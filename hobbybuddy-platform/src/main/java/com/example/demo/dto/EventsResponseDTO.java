package com.example.demo.dto;

import java.util.List;
import java.util.Map;

/**
 * Events listing response with pagination, filters, and fallback states.
 */
public class EventsResponseDTO {

    private List<EventDTO> events;
    private Map<String, Object> pagination;
    private Map<String, Object> filters;
    private FallbackDTO fallback;
    private LocationDTO location;

    public EventsResponseDTO() {}

    // Getters/setters

    public List<EventDTO> getEvents() { return events; }
    public void setEvents(List<EventDTO> events) { this.events = events; }

    public Map<String, Object> getPagination() { return pagination; }
    public void setPagination(Map<String, Object> pagination) { this.pagination = pagination; }

    public Map<String, Object> getFilters() { return filters; }
    public void setFilters(Map<String, Object> filters) { this.filters = filters; }

    public FallbackDTO getFallback() { return fallback; }
    public void setFallback(FallbackDTO fallback) { this.fallback = fallback; }

    public LocationDTO getLocation() { return location; }
    public void setLocation(LocationDTO location) { this.location = location; }
}
