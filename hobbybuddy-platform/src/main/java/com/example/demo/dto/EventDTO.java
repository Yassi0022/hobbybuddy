package com.example.demo.dto;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Unified event representation for both internal (user-created) and external
 * (Ticketmaster / third-party) events. Used in both Discover teasers and
 * the full Events listing.
 *
 * Fields that don't apply to a source are null (e.g. external events have
 * no internal "id" or "createdBy"; internal events have no "externalUrl").
 */
public class EventDTO {

    private Long id;                    // null for external events
    private String title;
    private String description;
    private String hobbyCategory;
    private String location;            // venue / area name
    private String city;
    private String date;                // ISO-8601 string
    private int maxParticipants;
    private int currentParticipants;
    private boolean joined;
    private String source;              // "internal" | "external"
    private String externalUrl;         // null for internal events
    private boolean teaser;             // true when shown as a teaser in Discover
    private Map<String, Object> createdBy; // {id, name} for internal events

    public EventDTO() {}

    // ── Factory: internal event from entity ──

    public static EventDTO fromInternal(com.example.demo.model.Event entity, Long currentUserId) {
        EventDTO dto = new EventDTO();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setHobbyCategory(entity.getHobbyCategory());
        dto.setLocation(entity.getLocation());
        dto.setCity(entity.getLocation());
        dto.setDate(entity.getDate() != null ? entity.getDate().toString() : null);
        dto.setMaxParticipants(entity.getMaxParticipants() != null ? entity.getMaxParticipants() : 50);
        int participants = entity.getParticipants() != null ? entity.getParticipants().size() : 0;
        dto.setCurrentParticipants(participants);
        dto.setJoined(currentUserId != null && entity.getParticipants() != null &&
                entity.getParticipants().stream().anyMatch(p -> p.getId().equals(currentUserId)));
        dto.setSource("internal");
        dto.setExternalUrl(null);
        dto.setTeaser(false);
        if (entity.getCreatedBy() != null) {
            Map<String, Object> cb = new LinkedHashMap<>();
            cb.put("id", entity.getCreatedBy().getId());
            cb.put("name", entity.getCreatedBy().getName());
            dto.setCreatedBy(cb);
        }
        return dto;
    }

    // ── Factory: external event from provider map ──

    @SuppressWarnings("unchecked")
    public static EventDTO fromExternal(Map<String, Object> data) {
        EventDTO dto = new EventDTO();
        dto.setId(null);
        dto.setTitle((String) data.getOrDefault("title", ""));
        dto.setDescription((String) data.getOrDefault("description", ""));
        dto.setHobbyCategory((String) data.getOrDefault("hobbyCategory", "Social"));
        dto.setLocation((String) data.getOrDefault("location", ""));
        dto.setCity((String) data.getOrDefault("city", ""));
        dto.setDate((String) data.get("date"));
        dto.setMaxParticipants((int) data.getOrDefault("maxParticipants", 50));
        dto.setCurrentParticipants((int) data.getOrDefault("currentParticipants", 0));
        dto.setJoined(false);
        dto.setSource("external");
        dto.setExternalUrl((String) data.get("externalUrl"));
        dto.setTeaser(false);
        dto.setCreatedBy(null);
        return dto;
    }

    // ── Mark as teaser (for Discover page) ──

    public EventDTO asTeaser() {
        this.teaser = true;
        return this;
    }

    // Getters/setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getHobbyCategory() { return hobbyCategory; }
    public void setHobbyCategory(String hobbyCategory) { this.hobbyCategory = hobbyCategory; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public int getMaxParticipants() { return maxParticipants; }
    public void setMaxParticipants(int maxParticipants) { this.maxParticipants = maxParticipants; }

    public int getCurrentParticipants() { return currentParticipants; }
    public void setCurrentParticipants(int currentParticipants) { this.currentParticipants = currentParticipants; }

    public boolean isJoined() { return joined; }
    public void setJoined(boolean joined) { this.joined = joined; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getExternalUrl() { return externalUrl; }
    public void setExternalUrl(String externalUrl) { this.externalUrl = externalUrl; }

    public boolean isTeaser() { return teaser; }
    public void setTeaser(boolean teaser) { this.teaser = teaser; }

    public Map<String, Object> getCreatedBy() { return createdBy; }
    public void setCreatedBy(Map<String, Object> createdBy) { this.createdBy = createdBy; }
}
