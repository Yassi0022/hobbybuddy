package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

/**
 * Ticketmaster Discovery API integration — implements {@link ExternalEventsProvider}.
 *
 * API key is injected from {@code ticketmaster.api.key} env var / properties.
 * If the key is blank, {@link #isConfigured()} returns false and the caller
 * silently skips external events.
 *
 * Responses are cached 30 minutes via Spring Cache to stay within the
 * Ticketmaster free-tier rate limit (5 000 requests / day).
 *
 * API docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */
@Service
public class TicketmasterProvider implements ExternalEventsProvider {

    private static final Logger logger = LoggerFactory.getLogger(TicketmasterProvider.class);
    private static final String BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

    @Value("${ticketmaster.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    @Cacheable(value = "external-events", key = "#city + '-' + #keyword + '-' + #size", unless = "#result == null")
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> searchEvents(String city, String keyword, int size) {
        if (!isConfigured()) {
            logger.debug("[Ticketmaster] No API key configured, skipping external events");
            return Collections.emptyList();
        }
        if (city == null || city.isBlank()) {
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

            Map<String, Object> response = restTemplate.getForObject(builder.toUriString(), Map.class);
            if (response == null) {
                logger.warn("[Ticketmaster] Empty response for city={}", city);
                return Collections.emptyList();
            }

            Map<String, Object> embedded = (Map<String, Object>) response.get("_embedded");
            if (embedded == null) {
                logger.debug("[Ticketmaster] No events found for city={}", city);
                return Collections.emptyList();
            }

            List<Map<String, Object>> tmEvents = (List<Map<String, Object>>) embedded.get("events");
            if (tmEvents == null || tmEvents.isEmpty()) {
                return Collections.emptyList();
            }

            List<Map<String, Object>> results = new ArrayList<>();
            for (Map<String, Object> tmEvent : tmEvents) {
                results.add(normalizeEvent(tmEvent, city));
            }

            logger.info("[Ticketmaster] Found {} events for city={}", results.size(), city);
            return results;

        } catch (RestClientException e) {
            logger.warn("[Ticketmaster] API call failed for city={}: {}", city, e.getMessage());
            return Collections.emptyList();
        } catch (Exception e) {
            logger.error("[Ticketmaster] Unexpected error for city={}: {}", city, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Normalize a Ticketmaster event into our standard event map format.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> normalizeEvent(Map<String, Object> tmEvent, String fallbackCity) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("source", "external");
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
                String localDate = (String) start.get("localDate");
                Object localTime = start.get("localTime");
                event.put("date", localDate + (localTime != null ? "T" + localTime : ""));
            }
        }

        // Venue / location
        String locationName = "";
        String venueCity = fallbackCity;
        Map<String, Object> venuesEmbedded = (Map<String, Object>) tmEvent.get("_embedded");
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
        String hobbyCat = "Social";
        List<Map<String, Object>> classifications = (List<Map<String, Object>>) tmEvent.get("classifications");
        if (classifications != null && !classifications.isEmpty()) {
            Map<String, Object> segment = (Map<String, Object>) classifications.get(0).get("segment");
            if (segment != null) {
                hobbyCat = (String) segment.get("name");
            }
        }
        event.put("hobbyCategory", hobbyCat);

        event.put("maxParticipants", 50);  // default for public events
        event.put("currentParticipants", 0);
        event.put("joined", false);

        return event;
    }
}
