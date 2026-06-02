package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Resolves and normalizes location context for discovery.
 *
 * Fallback chain: explicit param → browser geolocation → user profile → null.
 * No external geocoding API needed — we rely on city strings from the user
 * profile or manual input. Lat/lng are stored passively for future
 * radius-based filtering.
 */
@Service
public class LocationService {

    private static final Logger logger = LoggerFactory.getLogger(LocationService.class);

    /** Well-known city aliases → canonical name */
    private static final Map<String, String> CITY_ALIASES = new LinkedHashMap<>();

    static {
        CITY_ALIASES.put("roma", "Rome");
        CITY_ALIASES.put("milano", "Milan");
        CITY_ALIASES.put("napoli", "Naples");
        CITY_ALIASES.put("torino", "Turin");
        CITY_ALIASES.put("firenze", "Florence");
        CITY_ALIASES.put("venezia", "Venice");
        CITY_ALIASES.put("bologna", "Bologna");
        CITY_ALIASES.put("padova", "Padua");
        CITY_ALIASES.put("genova", "Genoa");
        CITY_ALIASES.put("palermo", "Palermo");
        CITY_ALIASES.put("catania", "Catania");
        CITY_ALIASES.put("berlin", "Berlin");
        CITY_ALIASES.put("paris", "Paris");
        CITY_ALIASES.put("london", "London");
        CITY_ALIASES.put("madrid", "Madrid");
        CITY_ALIASES.put("barcelona", "Barcelona");
        CITY_ALIASES.put("amsterdam", "Amsterdam");
        CITY_ALIASES.put("lisbon", "Lisbon");
    }

    /**
     * Resolve the effective city from the request parameters and user profile.
     *
     * @param paramCity      city explicitly provided in the request (manual input)
     * @param profileCity    city stored in the user's profile
     * @return resolved city, or null if no city available
     */
    public String resolveCity(String paramCity, String profileCity) {
        String city = null;
        if (paramCity != null && !paramCity.isBlank()) {
            city = paramCity.trim();
        } else if (profileCity != null && !profileCity.isBlank()) {
            city = profileCity.trim();
        }
        return normalizeCity(city);
    }

    /**
     * Normalize a city name: trim, title-case, resolve aliases.
     */
    public String normalizeCity(String city) {
        if (city == null || city.isBlank()) return null;
        city = city.trim();
        // Check aliases (case-insensitive)
        String alias = CITY_ALIASES.get(city.toLowerCase());
        if (alias != null) return alias;
        // Title-case single word
        if (city.contains(" ")) {
            // Multi-word: title-case each word
            String[] parts = city.split("\\s+");
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < parts.length; i++) {
                if (i > 0) sb.append(' ');
                sb.append(capitalize(parts[i]));
            }
            return sb.toString();
        }
        return capitalize(city);
    }

    /**
     * @return a location metadata bean for the API response
     */
    public Map<String, Object> buildLocationContext(String resolvedCity, String source, boolean hasCoordinates) {
        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put("city", resolvedCity);
        ctx.put("source", source); // "manual" | "geolocation" | "profile" | "none"
        ctx.put("hasCoordinates", hasCoordinates);
        return ctx;
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }
}
