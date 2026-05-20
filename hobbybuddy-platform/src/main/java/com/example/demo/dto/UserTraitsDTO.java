package com.example.demo.dto;

public class UserTraitsDTO {

    private Long id;
    private Double openness;
    private Double conscientiousness;
    private Double extraversion;
    private Double agreeableness;
    private Double neuroticism;

    public UserTraitsDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getOpenness() {
        return openness;
    }

    public void setOpenness(Double openness) {
        this.openness = openness;
    }

    public Double getConscientiousness() {
        return conscientiousness;
    }

    public void setConscientiousness(Double conscientiousness) {
        this.conscientiousness = conscientiousness;
    }

    public Double getExtraversion() {
        return extraversion;
    }

    public void setExtraversion(Double extraversion) {
        this.extraversion = extraversion;
    }

    public Double getAgreeableness() {
        return agreeableness;
    }

    public void setAgreeableness(Double agreeableness) {
        this.agreeableness = agreeableness;
    }

    public Double getNeuroticism() {
        return neuroticism;
    }

    public void setNeuroticism(Double neuroticism) {
        this.neuroticism = neuroticism;
    }
}
