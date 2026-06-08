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
    @Column(nullable = false, unique = true)
    private String email;
    @Column
    private Double openness;
    @Column
    private Double conscientiousness;
    @Column
    private Double extraversion;
    @Column
    private Double agreeableness;
    @Column
    private Double neuroticism;
    @Column
    private String archetype;

    @Column(nullable = true)
    private Long referredBy;

    @Column(nullable = false)
    private int referralCount = 0;

    /** True when the user has a high-priority match credit (e.g. from a successful referral). */
    @Column(nullable = false)
    private boolean priorityMatchAvailable = false;

    /** Transient invite token passed during registration (not persisted). */
    @jakarta.persistence.Transient
    private String inviteToken;

    @Column(columnDefinition = "TEXT")
    private String hobbies;

    @Column(columnDefinition = "TEXT")
    private String prompt1;
    @Column(columnDefinition = "TEXT")
    private String prompt2;
    @Column(columnDefinition = "TEXT")
    private String prompt3;

    @Column
    private String city;

    @Column
    private Integer age;

    @Column
    private String personalityTagline;

    @Column(columnDefinition = "TEXT")
    private String photosJson; // Stored as JSON array of URLs

    @Column(nullable = false)
    private boolean emailVerified = false;

    // ----- New: List of PhotoInfo (transient, not persisted directly) -----
    @jakarta.persistence.Transient
    private java.util.List<com.example.demo.model.PhotoInfo> photoList = new java.util.ArrayList<>();


    public User() {

    }

    public User(String name, String password, String email) {
        this.name = name;
        this.password = password;
        this.email = email;
    }

    public User(String name, String password, String email, Double openness, Double conscientiousness, Double extraversion,
            Double agreeableness, Double neuroticism) {
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
        return archetype != null;
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

    public String getArchetype() {
        return archetype;
    }

    public void setArchetype(String archetype) {
        this.archetype = archetype;
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

    public boolean isPriorityMatchAvailable() {
        return priorityMatchAvailable;
    }

    public void setPriorityMatchAvailable(boolean priorityMatchAvailable) {
        this.priorityMatchAvailable = priorityMatchAvailable;
    }

    public String getInviteToken() {
        return inviteToken;
    }

    public void setInviteToken(String inviteToken) {
        this.inviteToken = inviteToken;
    }

    public String getHobbies() {
        return hobbies;
    }

    public void setHobbies(String hobbies) {
        this.hobbies = hobbies;
    }

    public String getPrompt1() {
        return prompt1;
    }

    public void setPrompt1(String prompt1) {
        this.prompt1 = prompt1;
    }

    public String getPrompt2() {
        return prompt2;
    }

    public void setPrompt2(String prompt2) {
        this.prompt2 = prompt2;
    }

    public String getPrompt3() {
        return prompt3;
    }

    public void setPrompt3(String prompt3) {
        this.prompt3 = prompt3;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getPersonalityTagline() {
        return personalityTagline;
    }

    public void setPersonalityTagline(String personalityTagline) {
        this.personalityTagline = personalityTagline;
    }

    public String getPhotosJson() {
        return photosJson;
    }

    public void setPhotosJson(String photosJson) {
        this.photosJson = photosJson;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public java.util.List<com.example.demo.model.PhotoInfo> getPhotoList() {
        return photoList;
    }

    public void setPhotoList(java.util.List<com.example.demo.model.PhotoInfo> photoList) {
        this.photoList = photoList;
    }
}
