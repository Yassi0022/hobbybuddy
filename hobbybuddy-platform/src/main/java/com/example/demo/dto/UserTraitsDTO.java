package com.example.demo.dto;

public class UserTraitsDTO {

    private Long id;
    private int openness;
    private int conscientiousness;
    private int extraversion;
    private int agreeableness;
    private int neuroticism;

    public UserTraitsDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getOpenness() {
        return openness;
    }

    public void setOpenness(int openness) {
        this.openness = openness;
    }

    public int getConscientiousness() {
        return conscientiousness;
    }

    public void setConscientiousness(int conscientiousness) {
        this.conscientiousness = conscientiousness;
    }

    public int getExtraversion() {
        return extraversion;
    }

    public void setExtraversion(int extraversion) {
        this.extraversion = extraversion;
    }

    public int getAgreeableness() {
        return agreeableness;
    }

    public void setAgreeableness(int agreeableness) {
        this.agreeableness = agreeableness;
    }

    public int getNeuroticism() {
        return neuroticism;
    }

    public void setNeuroticism(int neuroticism) {
        this.neuroticism = neuroticism;
    }
}
