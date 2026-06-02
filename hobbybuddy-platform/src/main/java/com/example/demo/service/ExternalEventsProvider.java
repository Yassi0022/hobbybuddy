package com.example.demo.service;

import java.util.List;
import java.util.Map;

/**
 * Pluggable interface for external event source integrations.
 *
 * Implementations call third-party APIs (Ticketmaster, Eventbrite, etc.)
 * and return normalized event data. All API keys stay server-side.
 *
 * The provider is considered optional — if no API key is configured,
 * {@link #isConfigured()} returns false and the caller skips it gracefully.
 */
public interface ExternalEventsProvider {

    /**
     * @return true if this provider has a valid API key and can make requests
     */
    boolean isConfigured();

    /**
     * Search for public events in a city.
     *
     * @param city    city name (e.g. "Rome")
     * @param keyword optional keyword filter (e.g. "music", "hiking")
     * @param size    max results to return
     * @return list of event data maps with normalized keys:
     *         title, description, date, location, city, hobbyCategory, externalUrl, source
     *         Returns empty list on any failure — never throws.
     */
    List<Map<String, Object>> searchEvents(String city, String keyword, int size);
}
