package com.example.demo.dto;

import java.util.List;
import java.util.Map;

/**
 * Discover page response — social discovery focused.
 *
 * Contains:
 * - people: nearby compatible users ranked by personality match + city boost + hobby overlap
 * - eventTeasers: small event cards (max 3) to tease the Events section
 * - suggestions: contextual local stats and tips
 * - location: resolved location context
 * - fallback: typed empty-state guidance (null when results exist)
 */
public class DiscoverResponseDTO {

    private List<Map<String, Object>> people;
    private List<EventDTO> eventTeasers;
    private SuggestionsDTO suggestions;
    private LocationDTO location;
    private FallbackDTO fallback;

    public DiscoverResponseDTO() {}

    // Getters/setters

    public List<Map<String, Object>> getPeople() { return people; }
    public void setPeople(List<Map<String, Object>> people) { this.people = people; }

    public List<EventDTO> getEventTeasers() { return eventTeasers; }
    public void setEventTeasers(List<EventDTO> eventTeasers) { this.eventTeasers = eventTeasers; }

    public SuggestionsDTO getSuggestions() { return suggestions; }
    public void setSuggestions(SuggestionsDTO suggestions) { this.suggestions = suggestions; }

    public LocationDTO getLocation() { return location; }
    public void setLocation(LocationDTO location) { this.location = location; }

    public FallbackDTO getFallback() { return fallback; }
    public void setFallback(FallbackDTO fallback) { this.fallback = fallback; }
}
