package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class MatchResponseDTO {

    @JsonProperty("best_match_id")
    private Long best_match_id;

    @JsonProperty("similarity_score")
    private double similarity_score;

    public MatchResponseDTO() {
    }

    public Long getBest_match_id() {
        return best_match_id;
    }

    public void setBest_match_id(Long best_match_id) {
        this.best_match_id = best_match_id;
    }

    public double getSimilarity_score() {
        return similarity_score;
    }

    public void setSimilarity_score(double similarity_score) {
        this.similarity_score = similarity_score;
    }
}
