package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

/**
 * Backend-only integration with Ticketmaster Discovery API.
 * API key is stored server-side only (env var or application.properties).
 * Never exposed to frontend.
 *
 * API docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */
@Service
public class TicketmasterService {

    private static final Logger logger = LoggerFactory.getLogger(TicketmasterService.class);
    private static final String BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

    @Value("${ticketmaster.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Search for public events near a city.
     * Returns simplified event maps suitable for DiscoverResponseDTO.LocalEventDTO.
     *
     * @param city    city name (e.g. "Rome", "Milan")
     * @param keyword optional hobby/keyword filter (e.g. "hiking", "music")
     * @param size    max results (default 10)
     * @return list of simplified event data maps, or empty list if API key not configured
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> searchEvents(String city, String keyword, int size) {
        if (apiKey == null || apiKey.isBlank()) {
            logger.info("[Ticketmaster] No API key configured, skipping external events");
            return Collections.emptyList();
        }

        try {
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(BASE_URL)
                    .queryParam("apikey", apiKey)
                    .queryParam("city", city)
                    .queryParam("size", Math.min(size, 20))
                    .queryParam("sort", "date,asc")
                    .queryParam("locale", "*");

            if (keyword != null && !keyword.isBlank()) {
                builder.queryParam("keyword", keyword);
            }

            Map<String, Object> response = restTemplate.getForObject(
                    builder.toUriString(), Map.class);

            if (response == null) {
                logger.warn("[Ticketmaster] Empty response for city={}", city);
                return Collections.emptyList();
            }

            // Parse the response
            Map<String, Object> embedded = (Map<String, Object>) response.get("_embedded");
            if (embedded == null) {
                logger.info("[Ticketmaster] No events found for city={}", city);
                return Collections.emptyList();
            }

            List<Map<String, Object>> tmEvents = (List<Map<String, Object>>) embedded.get("events");
            if (tmEvents == null || tmEvents.isEmpty()) {
                return Collections.emptyList();
            }

            List<Map<String, Object>> results = new ArrayList<>();
            for (Map<String, Object> tmEvent : tmEvents) {
                Map<String, Object> event = new LinkedHashMap<>();
                event.put("source", "ticketmaster");
                event.put("externalUrl", tmEvent.get("url"));
                event.put("title", tmEvent.get("name"));

                // Description
                Object desc = tmEvent.get("info");
                event.put("description", desc != null ? desc.toString() : "");

                // Date
                Map<String, Object> dates = (Map<String, Object>) tmEvent.get("dates");
                if (dates != null) {
                    Map<String, Object> start = (Map<String, Object>) dates.get("start");
                    if (start != null) {
                        event.put("date", start.get("localDate") + "T" + start.get("localTime"));
                    }
                }

                // Venue / location
                Map<String, Object> venuesEmbedded = (Map<String, Object>) tmEvent.get("_embedded");
                String locationName = "";
                String venueCity = city;
                if (venuesEmbedded != null) {
                    List<Map<String, Object>> venues = (List<Map<String, Object>>) venuesEmbedded.get("venues");
                    if (venues != null && !venues.isEmpty()) {
                        Map<String, Object> venue = venues.get(0);
                        locationName = (String) venue.get("name");
                        Map<String, Object> vc = (Map<String, Object>) venue.get("city");
                        if (vc != null) venueCity = (String) vc.get("name");
                    }
                }
                event.put("location", locationName);
                event.put("city", venueCity);

                // Hobby category from classifications
                List<Map<String, Object>> classifications = (List<Map<String, Object>>) tmEvent.get("classifications");
                String hobbyCat = "Social";
                if (classifications != null && !classifications.isEmpty()) {
                    Map<String, Object> segment = (Map<String, Object>) classifications.get(0).get("segment");
                    if (segment != null) {
                        hobbyCat = (String) segment.get("name");
                    }
                }
                event.put("hobbyCategory", hobbyCat);

                // Ticket cap as proxy for max participants
                Map<String, Object> tmAccess = (Map<String, Object>) tmEvent.get("accessibility");
                event.put("maxParticipants", 50);  // default for public events
                event.put("currentParticipants", 0);
                event.put("joined", false);

                results.add(event);
            }

            logger.info("[Ticketmaster] Found {} events for city={}", results.size(), city);
            return results;

        } catch (Exception e) {
            logger.warn("[Ticketmaster] API call failed for city={}: {}", city, e.getMessage());
            return Collections.emptyList();
        }
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
