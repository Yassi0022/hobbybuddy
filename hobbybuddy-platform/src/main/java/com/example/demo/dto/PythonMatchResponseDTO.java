package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class PythonMatchResponseDTO {

    @JsonProperty("best_match_id")
    private Long bestMatchId;

    @JsonProperty("similarity_score")
    private double similarityScore;

    public PythonMatchResponseDTO() {
    }

    public Long getBestMatchId() {
        return bestMatchId;
    }

    public void setBestMatchId(Long bestMatchId) {
        this.bestMatchId = bestMatchId;
    }

    public double getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(double similarityScore) {
        this.similarityScore = similarityScore;
    }
}
