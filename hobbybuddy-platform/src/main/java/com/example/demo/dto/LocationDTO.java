package com.example.demo.dto;

/**
 * Resolved location context returned in discovery and events responses.
 * Tells the frontend where results are scoped and how the city was determined.
 */
public class LocationDTO {

    private String city;
    private String source;        // "manual" | "geolocation" | "profile" | "none"
    private boolean hasCoordinates;
    private Double lat;
    private Double lng;

    public LocationDTO() {}

    public LocationDTO(String city, String source, boolean hasCoordinates) {
        this.city = city;
        this.source = source;
        this.hasCoordinates = hasCoordinates;
    }

    // Getters/setters

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public boolean isHasCoordinates() { return hasCoordinates; }
    public void setHasCoordinates(boolean hasCoordinates) { this.hasCoordinates = hasCoordinates; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }
}
