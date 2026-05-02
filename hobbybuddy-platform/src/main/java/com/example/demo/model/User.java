package com.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String name;
    @Column
    private String password;
    @Column(unique = true)
    private String email;
    @Column
    private int openness;
    @Column
    private int conscientiousness;
    @Column
    private int extraversion;
    @Column
    private int agreeableness;

    @Column
    private int neuroticism;

    @Column(nullable = true)
    private Long referredBy;

    @Column(nullable = false)
    private int referralCount = 0;

    @Column(columnDefinition = "TEXT")
    private String hobbies;

    public User() {

    }

    public User(String name, String password, String email) {
        this.name = name;
        this.password = password;
        this.email = email;
    }

    public User(String name, String password, String email, int openness, int conscientiousness, int extraversion,
            int agreeableness, int neuroticism) {
        this.name = name;
        this.password = password;
        this.email = email;
        this.openness = openness;
        this.conscientiousness = conscientiousness;
        this.extraversion = extraversion;
        this.agreeableness = agreeableness;
        this.neuroticism = neuroticism;
    }

    public boolean isQuizCompleted() {
        return openness > 0 || conscientiousness > 0 || extraversion > 0 || agreeableness > 0 || neuroticism > 0;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public Long getReferredBy() {
        return referredBy;
    }

    public void setReferredBy(Long referredBy) {
        this.referredBy = referredBy;
    }

    public int getReferralCount() {
        return referralCount;
    }

    public void setReferralCount(int referralCount) {
        this.referralCount = referralCount;
    }

    public String getHobbies() {
        return hobbies;
    }

    public void setHobbies(String hobbies) {
        this.hobbies = hobbies;
    }
}
