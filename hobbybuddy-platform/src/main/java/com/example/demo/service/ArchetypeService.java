package com.example.demo.service;

import org.springframework.stereotype.Service;

@Service
public class ArchetypeService {

    public String calculateArchetype(Double openness, Double conscientiousness, Double extraversion, Double agreeableness, Double neuroticism) {
        boolean highOpen = openness != null && openness > 3.5;
        boolean highExtra = extraversion != null && extraversion > 3.5;
        boolean highConscience = conscientiousness != null && conscientiousness > 3.5;
        boolean highAgree = agreeableness != null && agreeableness > 3.5;
        boolean highNeuro = neuroticism != null && neuroticism > 3.5;

        if (highOpen && highExtra) {
            return "The Creative Explorer";
        } else if (highConscience && !highExtra) {
            return "The Organized Catalyst";
        } else if (highAgree && highOpen) {
            return "The Empathic Visionary";
        } else if (highNeuro && highOpen) {
            return "The Sensitive Innovator";
        } else {
            return "The Zen Maverick";
        }
    }
}
