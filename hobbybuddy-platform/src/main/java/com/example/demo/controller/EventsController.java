package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.model.Event;
import com.example.demo.model.User;
import com.example.demo.repository.EventRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ExternalEventsProvider;
import com.example.demo.service.LocationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Events — dedicated event browsing and creation surface.
 *
 * GET    /api/events          → paginated event listing (internal + external)
 * POST   /api/events          → create a new event
 * POST   /api/events/{id}/join → join an event
 *
 * Query params for listing:
 *   city   — filter by city (optional)
 *   hobby  — filter by hobby category (optional)
 *   source — "internal" | "external" | "all" (default: all)
 *   page   — page number (default: 0)
 *   size   — page size (default: 12, max: 50)
 */
@RestController
@RequestMapping("/api/events")
public class EventsController {

    private static final Logger logger = LoggerFactory.getLogger(EventsController.class);
    private static final int DEFAULT_PAGE_SIZE = 12;
    private static final int MAX_PAGE_SIZE = 50;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LocationService locationService;

    @Autowired
    private ExternalEventsProvider externalEventsProvider;

    // ── List events ──────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<EventsResponseDTO> listEvents(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String hobby,
            @RequestParam(defaultValue = "all") String source,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            Authentication authentication) {

        EventsResponseDTO response = new EventsResponseDTO();

        // Resolve city: explicit param → user profile
        String profileCity = null;
        User currentUser = null;
        Long currentUserId = null;
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
            if (currentUser != null) {
                profileCity = currentUser.getCity();
                currentUserId = currentUser.getId();
            }
        }

        String resolvedCity = locationService.resolveCity(city, profileCity);
        boolean hasCoordinates = false;

        LocationDTO locationDTO = new LocationDTO(resolvedCity, city != null ? "manual" : "profile", hasCoordinates);
        response.setLocation(locationDTO);

        // Pagination
        int effectiveSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int effectivePage = Math.max(page, 0);
        Pageable pageable = PageRequest.of(effectivePage, effectiveSize);

        List<EventDTO> allEvents = new ArrayList<>();

        // Internal events
        if ("all".equals(source) || "internal".equals(source)) {
            try {
                Page<Event> internalPage;
                long totalInternal;
                if (resolvedCity != null) {
                    if (hobby != null && !hobby.isBlank()) {
                        internalPage = eventRepository.findPageByFilters(resolvedCity, hobby, pageable);
                        totalInternal = eventRepository.countByFilters(resolvedCity, hobby);
                    } else {
                        internalPage = eventRepository.findPageByFilters(resolvedCity, null, pageable);
                        totalInternal = eventRepository.countByFilters(resolvedCity, null);
                    }
                } else {
                    internalPage = eventRepository.findPageByFilters(null, null, pageable);
                    totalInternal = eventRepository.countByFilters(null, null);
                }

                for (Event event : internalPage.getContent()) {
                    allEvents.add(EventDTO.fromInternal(event, currentUserId));
                }

                response.setPagination(Map.of(
                        "page", effectivePage,
                        "size", effectiveSize,
                        "totalElements", totalInternal,
                        "totalPages", (int) Math.ceil((double) totalInternal / effectiveSize)
                ));
            } catch (Exception e) {
                logger.warn("[Events] Failed to fetch internal events: {}", e.getMessage());
                response.setPagination(Map.of(
                        "page", 0, "size", effectiveSize, "totalElements", 0, "totalPages", 0
                ));
            }
        }

        // External events (append — no pagination blend, just add to the list)
        if (("all".equals(source) || "external".equals(source)) && externalEventsProvider.isConfigured()) {
            try {
                if (resolvedCity != null) {
                    List<Map<String, Object>> external = externalEventsProvider.searchEvents(resolvedCity, hobby, effectiveSize);
                    for (Map<String, Object> ext : external) {
                        allEvents.add(EventDTO.fromExternal(ext));
                    }
                }
            } catch (Exception e) {
                logger.warn("[Events] Failed to fetch external events: {}", e.getMessage());
            }
        }

        response.setEvents(allEvents);
        java.util.HashMap<String, Object> filters = new java.util.HashMap<>();
        filters.put("city", resolvedCity != null ? resolvedCity : "");
        filters.put("hobby", hobby != null ? hobby : "");
        filters.put("source", source);
        response.setFilters(filters);

        // Fallback
        if (allEvents.isEmpty()) {
            if (resolvedCity == null) {
                response.setFallback(FallbackDTO.noLocation());
            } else {
                response.setFallback(FallbackDTO.noEvents(resolvedCity));
            }
        }

        logger.info("[Events] city={} | hobby={} | source={} | results={}",
                resolvedCity, hobby, source, allEvents.size());

        return ResponseEntity.ok(response);
    }

    // ── Create event ─────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> payload, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        String title = (String) payload.get("title");
        String location = (String) payload.get("location");
        if (title == null || title.isBlank() || location == null || location.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Title and location are required"));
        }

        try {
            User creator = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Event event = new Event();
            event.setTitle(title);
            event.setDescription((String) payload.getOrDefault("description", ""));
            event.setLocation(location);
            event.setHobbyCategory((String) payload.getOrDefault("hobbyCategory", "Social"));
            event.setMaxParticipants(payload.get("maxParticipants") != null ?
                    ((Number) payload.get("maxParticipants")).intValue() : 20);
            event.setCreatedBy(creator);

            // Parse date if provided
            String dateStr = (String) payload.get("date");
            if (dateStr != null && !dateStr.isBlank()) {
                event.setDate(java.time.LocalDateTime.parse(dateStr));
            } else {
                event.setDate(java.time.LocalDateTime.now().plusDays(7)); // default: 1 week from now
            }

            event.setParticipants(new ArrayList<>());
            event.getParticipants().add(creator); // creator auto-joins

            eventRepository.save(event);
            logger.info("[Events] Created event '{}' in {} by user {}", title, location, creator.getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of("message", "Event created", "id", event.getId()));
        } catch (Exception e) {
            logger.error("[Events] Failed to create event: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create event"));
        }
    }

    // ── Join event ───────────────────────────────────────────────────

    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinEvent(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        try {
            Event event = eventRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Event not found"));
            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (event.getParticipants() == null) {
                event.setParticipants(new ArrayList<>());
            }

            boolean alreadyJoined = event.getParticipants().stream()
                    .anyMatch(p -> p.getId().equals(user.getId()));

            if (alreadyJoined) {
                return ResponseEntity.ok(Map.of("message", "Already joined", "joined", true));
            }

            if (event.getMaxParticipants() != null
                    && event.getParticipants().size() >= event.getMaxParticipants()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Event is full"));
            }

            event.getParticipants().add(user);
            eventRepository.save(event);

            logger.info("[Events] User {} joined event {}", user.getId(), id);
            return ResponseEntity.ok(Map.of("message", "Joined event", "joined", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("[Events] Failed to join event {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to join event"));
        }
    }
}
