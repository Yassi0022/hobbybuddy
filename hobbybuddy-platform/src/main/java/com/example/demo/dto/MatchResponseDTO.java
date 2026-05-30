package com.example.demo.dto;

import java.util.List;
import java.util.Map;

public class MatchResponseDTO {
    private Long id;
    private String name;
    private String archetype;
    private String hobbies;
    private int compatibilityPercentage;
    private List<String> sharedStrengths;
    private List<String> complementaryTraits;
    private List<Map<String, Object>> traitBreakdowns;

    public MatchResponseDTO() {}

    public MatchResponseDTO(String name, String archetype, String hobbies, int compatibilityPercentage) {
        this.name = name;
        this.archetype = archetype;
        this.hobbies = hobbies;
        this.compatibilityPercentage = compatibilityPercentage;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getArchetype() { return archetype; }
    public void setArchetype(String archetype) { this.archetype = archetype; }
    public String getHobbies() { return hobbies; }
    public void setHobbies(String hobbies) { this.hobbies = hobbies; }
    public int getCompatibilityPercentage() { return compatibilityPercentage; }
    public void setCompatibilityPercentage(int compatibilityPercentage) { this.compatibilityPercentage = compatibilityPercentage; }
    public List<String> getSharedStrengths() { return sharedStrengths; }
    public void setSharedStrengths(List<String> sharedStrengths) { this.sharedStrengths = sharedStrengths; }
    public List<String> getComplementaryTraits() { return complementaryTraits; }
    public void setComplementaryTraits(List<String> complementaryTraits) { this.complementaryTraits = complementaryTraits; }
    public List<Map<String, Object>> getTraitBreakdowns() { return traitBreakdowns; }
    public void setTraitBreakdowns(List<Map<String, Object>> traitBreakdowns) { this.traitBreakdowns = traitBreakdowns; }
}
