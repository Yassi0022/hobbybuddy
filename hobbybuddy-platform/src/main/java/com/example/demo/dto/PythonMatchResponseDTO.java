package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * DTO matching the FastAPI /calculate-match response contract exactly:
 *   best_match_id, compatibility_score, match_label,
 *   shared_strengths, complementary_traits, trait_breakdowns
 */
public class PythonMatchResponseDTO {

    @JsonProperty("best_match_id")
    private Long bestMatchId;

    @JsonProperty("compatibility_score")
    private int compatibilityScore;

    @JsonProperty("match_label")
    private String matchLabel;

    @JsonProperty("shared_strengths")
    private List<String> sharedStrengths;

    @JsonProperty("complementary_traits")
    private List<String> complementaryTraits;

    @JsonProperty("trait_breakdowns")
    private List<Map<String, Object>> traitBreakdowns;

    public PythonMatchResponseDTO() {
    }

    public Long getBestMatchId() { return bestMatchId; }
    public void setBestMatchId(Long bestMatchId) { this.bestMatchId = bestMatchId; }

    public int getCompatibilityScore() { return compatibilityScore; }
    public void setCompatibilityScore(int compatibilityScore) { this.compatibilityScore = compatibilityScore; }

    public String getMatchLabel() { return matchLabel; }
    public void setMatchLabel(String matchLabel) { this.matchLabel = matchLabel; }

    public List<String> getSharedStrengths() { return sharedStrengths; }
    public void setSharedStrengths(List<String> sharedStrengths) { this.sharedStrengths = sharedStrengths; }

    public List<String> getComplementaryTraits() { return complementaryTraits; }
    public void setComplementaryTraits(List<String> complementaryTraits) { this.complementaryTraits = complementaryTraits; }

    public List<Map<String, Object>> getTraitBreakdowns() { return traitBreakdowns; }
    public void setTraitBreakdowns(List<Map<String, Object>> traitBreakdowns) { this.traitBreakdowns = traitBreakdowns; }
}
