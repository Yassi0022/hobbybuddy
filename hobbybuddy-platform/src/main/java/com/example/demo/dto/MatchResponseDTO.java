package com.example.demo.dto;

public class MatchResponseDTO {
    private String name;
    private String archetype;
    private String hobbies;
    private int compatibilityPercentage;

    public MatchResponseDTO() {}

    public MatchResponseDTO(String name, String archetype, String hobbies, int compatibilityPercentage) {
        this.name = name;
        this.archetype = archetype;
        this.hobbies = hobbies;
        this.compatibilityPercentage = compatibilityPercentage;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getArchetype() { return archetype; }
    public void setArchetype(String archetype) { this.archetype = archetype; }
    public String getHobbies() { return hobbies; }
    public void setHobbies(String hobbies) { this.hobbies = hobbies; }
    public int getCompatibilityPercentage() { return compatibilityPercentage; }
    public void setCompatibilityPercentage(int compatibilityPercentage) { this.compatibilityPercentage = compatibilityPercentage; }
}