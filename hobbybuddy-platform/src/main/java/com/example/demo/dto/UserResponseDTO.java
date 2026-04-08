package com.example.demo.dto;

import java.util.ArrayList;
import java.util.List;

public class UserResponseDTO {

    private Long id;
    private String name;

    private List<Double> matchVibeScore = new ArrayList<>();
    private List<String> sharedStrengths = new ArrayList<>();
    private List<String> complementaryTraits = new ArrayList<>();

    public UserResponseDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<Double> getMatchVibeScore() {
        return matchVibeScore;
    }

    public void setMatchVibeScore(List<Double> matchVibeScore) {
        this.matchVibeScore = matchVibeScore;
    }

    public void pushMatchVibeScore(Double score) {
        if (matchVibeScore == null) {
            matchVibeScore = new java.util.ArrayList<>();
        }
        matchVibeScore.add(score);
    }

    public List<String> getSharedStrengths() {
        return sharedStrengths;
    }

    public void setSharedStrengths(List<String> sharedStrengths) {
        this.sharedStrengths = sharedStrengths;
    }

    public List<String> getComplementaryTraits() {
        return complementaryTraits;
    }

    public void setComplementaryTraits(List<String> complementaryTraits) {
        this.complementaryTraits = complementaryTraits;
    }

    private String token;
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
}
