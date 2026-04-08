package com.example.demo.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;


public class MatchRequestDTO {

    @JsonProperty("target_user")
    private UserTraitsDTO targetUser;

    @JsonProperty("potential_matches")
    private List<UserTraitsDTO> potentialMatches;

    public MatchRequestDTO() {
    }

    public MatchRequestDTO(UserTraitsDTO targetUser, List<UserTraitsDTO> potentialMatches) {
        this.targetUser = targetUser;
        this.potentialMatches = potentialMatches;
    }

    public UserTraitsDTO getTargetUser() {
        return targetUser;
    }

    public void setTargetUser(UserTraitsDTO targetUser) {
        this.targetUser = targetUser;
    }

    public List<UserTraitsDTO> getPotentialMatches() {
        return potentialMatches;
    }

    public void setPotentialMatches(List<UserTraitsDTO> potentialMatches) {
        this.potentialMatches = potentialMatches;
    }

}
