package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.model.Event;
import com.example.demo.model.User;
import com.example.demo.repository.EventRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ExternalEventsProvider;
import com.example.demo.service.LocationService;
import com.example.demo.service.MatchingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Discover — social discovery surface.
 *
 * GET /api/discover  → nearby compatible people + event teasers + suggestions
 *
 * Query params:
 *   city   — explicit city override (optional)
 *   lat    — browser latitude (optional, stored for future radius filtering)
 *   lng    - browser longitude (optional)
 *   limit  — max people results (default 10, max 20)
 *
 * This endpoint is read-only. It does NOT modify any state.
 */
@RestController
@RequestMapping("/api/discover")
public class DiscoverController {

    private static final Logger logger = LoggerFactory.getLogger(DiscoverController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private LocationService locationService;

    @Autowired
    private MatchingService matchingService;

    @Autowired
    private ExternalEventsProvider externalEventsProvider;

    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 20;
    private static final int TEASER_COUNT = 3;

    @GetMapping
    public ResponseEntity<DiscoverResponseDTO> discover(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {

        DiscoverResponseDTO response = new DiscoverResponseDTO();

        // ── Resolve current user ──
        User currentUser = null;
        String profileCity = null;
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
            if (currentUser != null) {
                profileCity = currentUser.getCity();
            }
        }

        // ── Resolve location ──
        String resolvedCity = locationService.resolveCity(city, profileCity);
        boolean hasCoordinates = lat != null && lng != null;
        String locationSource = (city != null && !city.isBlank()) ? "manual"
                : (profileCity != null && !profileCity.isBlank()) ? "profile"
                : "none";

        LocationDTO locationDTO = new LocationDTO(resolvedCity, locationSource, hasCoordinates);
        if (hasCoordinates) {
            locationDTO.setLat(lat);
            locationDTO.setLng(lng);
        }
        response.setLocation(locationDTO);

        // ── No location at all → early fallback ──
        if (resolvedCity == null) {
            response.setFallback(FallbackDTO.noLocation());
            response.setPeople(Collections.emptyList());
            response.setEventTeasers(Collections.emptyList());
            return ResponseEntity.ok(response);
        }

        // ── Find compatible people ──
        int effectiveLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

        final User discoverUser = currentUser; // effectively final for lambda
        if (discoverUser != null && discoverUser.getOpenness() != null) {
            List<User> candidates = userRepository.findAll().stream()
                    .filter(u -> !u.getId().equals(discoverUser.getId()))
                    .filter(u -> u.getOpenness() != null)
                    .collect(Collectors.toList());

            List<Map<String, Object>> people = matchingService.discoverMatches(
                    discoverUser, candidates, resolvedCity, effectiveLimit);
            response.setPeople(people);

            // ── Sparse area fallback ──
            if (people.isEmpty()) {
                response.setFallback(FallbackDTO.sparseArea(resolvedCity));
            }
        } else {
            response.setPeople(Collections.emptyList());
            response.setFallback(FallbackDTO.sparseArea(resolvedCity));
        }

        // ── Event teasers (internal upcoming + external) ──
        List<EventDTO> teasers = buildEventTeasers(resolvedCity, currentUser);
        response.setEventTeasers(teasers);

        // ── Suggestions ──
        SuggestionsDTO suggestions = buildSuggestions(resolvedCity);
        response.setSuggestions(suggestions);

        logger.info("[Discover] city={} | people={} | teasers={}",
                resolvedCity,
                response.getPeople() != null ? response.getPeople().size() : 0,
                teasers.size());

        return ResponseEntity.ok(response);
    }

    // ── Event teasers: mix of internal upcoming + external ──

    private List<EventDTO> buildEventTeasers(String city, User currentUser) {
        Long currentUserId = currentUser != null ? currentUser.getId() : null;
        List<EventDTO> teasers = new ArrayList<>();

        // Internal upcoming events in city (next 3)
        try {
            Pageable topThree = PageRequest.of(0, TEASER_COUNT);
            List<Event> internalEvents = eventRepository.findUpcomingByCity(city, topThree).toList();
            for (Event event : internalEvents) {
                teasers.add(EventDTO.fromInternal(event, currentUserId).asTeaser());
            }
        } catch (Exception e) {
            logger.warn("[Discover] Failed to fetch internal event teasers: {}", e.getMessage());
        }

        // External events from provider (fill up to TEASER_COUNT)
        if (teasers.size() < TEASER_COUNT && externalEventsProvider.isConfigured()) {
            try {
                int externalNeeded = TEASER_COUNT - teasers.size();
                List<Map<String, Object>> external = externalEventsProvider.searchEvents(city, null, externalNeeded);
                for (Map<String, Object> ext : external) {
                    if (teasers.size() >= TEASER_COUNT) break;
                    teasers.add(EventDTO.fromExternal(ext).asTeaser());
                }
            } catch (Exception e) {
                logger.warn("[Discover] Failed to fetch external event teasers: {}", e.getMessage());
            }
        }

        return teasers;
    }

    // ── Local suggestions ──

    private SuggestionsDTO buildSuggestions(String city) {
        int activeUsers = 0;
        int upcomingEvents = 0;
        String trendingHobby = null;

        try {
            activeUsers = eventRepository.countDistinctUsersInCity(city);
        } catch (Exception e) {
            logger.debug("[Discover] Could not count active users: {}", e.getMessage());
        }

        try {
            upcomingEvents = (int) eventRepository.countUpcomingByCity(city);
        } catch (Exception e) {
            logger.debug("[Discover] Could not count upcoming events: {}", e.getMessage());
        }

        // Generate a contextual tip based on data
        String localTip;
        if (activeUsers == 0 && upcomingEvents == 0) {
            localTip = "Be the first to explore " + city + "! Create an event or invite friends.";
        } else if (activeUsers > 0 && upcomingEvents == 0) {
            localTip = activeUsers + " people active in " + city + " — create an event to bring them together!";
        } else if (activeUsers == 0 && upcomingEvents > 0) {
            localTip = upcomingEvents + " events coming up in " + city + " — join one to meet people!";
        } else {
            localTip = activeUsers + " people and " + upcomingEvents + " events in " + city;
        }

        return new SuggestionsDTO(activeUsers, upcomingEvents, trendingHobby, localTip);
    }
}
