package com.example.demo.dto;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Typed fallback state for when a section has no results.
 * Renders as a curated empty-state message with an optional action hint.
 *
 * Fallback types:
 * - "no_location"    : user has not set a city and no geolocation available
 * - "sparse_area"    : city is set but very few or no results found
 * - "no_events"      : city is set but no events (internal or external)
 * - "first_in_area"  : user is one of the first in their city — encourage inviting others
 */
public class FallbackDTO {

    private String type;
    private String message;
    private String action;       // "set_city" | "expand_radius" | "create_event" | "invite_friends" | "explore_all"
    private String actionLabel;  // human-readable CTA: "Set your city" | "Explore all" | "Create an event"

    public FallbackDTO() {}

    public FallbackDTO(String type, String message, String action, String actionLabel) {
        this.type = type;
        this.message = message;
        this.action = action;
        this.actionLabel = actionLabel;
    }

    /** Serialize to a map for clean JSON embedding in parent DTOs */
    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("type", type);
        map.put("message", message);
        map.put("action", action);
        map.put("actionLabel", actionLabel);
        return map;
    }

    // ── Factory methods for common fallbacks ──

    public static FallbackDTO noLocation() {
        return new FallbackDTO(
                "no_location",
                "Set your city to discover people and events near you",
                "set_city",
                "Set your city"
        );
    }

    public static FallbackDTO sparseArea(String city) {
        return new FallbackDTO(
                "sparse_area",
                "Not many people in " + city + " yet. Be the first to explore!",
                "explore_all",
                "Explore all users"
        );
    }

    public static FallbackDTO noEvents(String city) {
        return new FallbackDTO(
                "no_events",
                "No events in " + city + " yet. Why not start one?",
                "create_event",
                "Create an event"
        );
    }

    public static FallbackDTO firstInArea(String city) {
        return new FallbackDTO(
                "first_in_area",
                "You're one of the first in " + city + " — invite friends to grow the community!",
                "invite_friends",
                "Invite friends"
        );
    }

    // Getters/setters

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getActionLabel() { return actionLabel; }
    public void setActionLabel(String actionLabel) { this.actionLabel = actionLabel; }
}
