package com.example.demo.dto;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Smart local suggestions for the Discover page.
 * Provides contextual hints about the user's area to make discovery feel alive
 * even when the raw result count is low.
 */
public class SuggestionsDTO {

    private int activeUsersInCity;
    private int upcomingEventsInCity;
    private String trendingHobby;
    private String localTip;

    public SuggestionsDTO() {}

    public SuggestionsDTO(int activeUsersInCity, int upcomingEventsInCity, String trendingHobby, String localTip) {
        this.activeUsersInCity = activeUsersInCity;
        this.upcomingEventsInCity = upcomingEventsInCity;
        this.trendingHobby = trendingHobby;
        this.localTip = localTip;
    }

    /** Serialize to a clean map, omitting null/empty fields */
    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        if (activeUsersInCity > 0) map.put("activeUsersInCity", activeUsersInCity);
        if (upcomingEventsInCity > 0) map.put("upcomingEventsInCity", upcomingEventsInCity);
        if (trendingHobby != null && !trendingHobby.isBlank()) map.put("trendingHobby", trendingHobby);
        if (localTip != null && !localTip.isBlank()) map.put("localTip", localTip);
        return map;
    }

    // Getters/setters

    public int getActiveUsersInCity() { return activeUsersInCity; }
    public void setActiveUsersInCity(int activeUsersInCity) { this.activeUsersInCity = activeUsersInCity; }

    public int getUpcomingEventsInCity() { return upcomingEventsInCity; }
    public void setUpcomingEventsInCity(int upcomingEventsInCity) { this.upcomingEventsInCity = upcomingEventsInCity; }

    public String getTrendingHobby() { return trendingHobby; }
    public void setTrendingHobby(String trendingHobby) { this.trendingHobby = trendingHobby; }

    public String getLocalTip() { return localTip; }
    public void setLocalTip(String localTip) { this.localTip = localTip; }
}
