package com.example.demo.service;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ArchetypeService {

    private static class ArchetypeDef {
        final String name;
        final String emoji;
        final double openness;
        final double conscientiousness;
        final double extraversion;
        final double agreeableness;
        final double neuroticism; // high = more neurotic (unstable)

        ArchetypeDef(String name, String emoji, double o, double c, double e, double a, double n) {
            this.name = name;
            this.emoji = emoji;
            this.openness = o;
            this.conscientiousness = c;
            this.extraversion = e;
            this.agreeableness = a;
            this.neuroticism = n;
        }
    }

    // 8 archetypes matching frontend archetype.js (trait center points, 0-100 scale)
    // Note: neuroticism in frontend archetype.js uses "neuroticism: 20" for The Anchor (low neuroticism = stable)
    //       The backend receives neuroticism as-is (higher = more neurotic)
    private static final ArchetypeDef[] ARCHETYPES = {
        new ArchetypeDef("The Visionary",    "🔮", 80, 50, 60, 50, 50),  // high openness, moderate others
        new ArchetypeDef("The Champion",     "🏆", 50, 60, 80, 70, 50),  // high extraversion + agreeableness
        new ArchetypeDef("The Guardian",     "🛡️", 40, 80, 40, 70, 30),  // high conscientiousness + agreeableness, stable
        new ArchetypeDef("The Diplomat",     "🕊️", 55, 50, 50, 80, 45),  // high agreeableness
        new ArchetypeDef("The Analyst",      "🔬", 70, 70, 40, 45, 50),  // high openness + conscientiousness, introverted
        new ArchetypeDef("The Explorer",     "🧭", 80, 45, 70, 55, 50),  // high openness + extraversion
        new ArchetypeDef("The Anchor",       "⚓", 40, 70, 40, 60, 20),  // stable, conscientious, low neuroticism
        new ArchetypeDef("The Catalyst",     "⚡", 70, 50, 70, 50, 55),  // high extraversion + openness
    };

    /**
     * Calculate the closest archetype using Euclidean distance on the 5 Big Five traits.
     * All scores are on a 0-100 scale.
     * Note: neuroticism should be passed as stored (higher = more neurotic).
     */
    public String calculateArchetype(Double openness, Double conscientiousness, Double extraversion, Double agreeableness, Double neuroticism) {
        double o = openness != null ? openness : 50;
        double c = conscientiousness != null ? conscientiousness : 50;
        double e = extraversion != null ? extraversion : 50;
        double a = agreeableness != null ? agreeableness : 50;
        double n = neuroticism != null ? neuroticism : 50;

        ArchetypeDef best = ARCHETYPES[0];
        double bestDist = Double.MAX_VALUE;

        for (ArchetypeDef arch : ARCHETYPES) {
            double dist = Math.sqrt(
                sq(o - arch.openness) +
                sq(c - arch.conscientiousness) +
                sq(e - arch.extraversion) +
                sq(a - arch.agreeableness) +
                sq(n - arch.neuroticism)
            );
            if (dist < bestDist) {
                bestDist = dist;
                best = arch;
            }
        }

        return best.name;
    }

    /**
     * Calculate archetype and return both name and emoji.
     * Returns map with "name" and "emoji" keys.
     */
    public Map<String, String> calculateArchetypeWithEmoji(Double openness, Double conscientiousness, Double extraversion, Double agreeableness, Double neuroticism) {
        double o = openness != null ? openness : 50;
        double c = conscientiousness != null ? conscientiousness : 50;
        double e = extraversion != null ? extraversion : 50;
        double a = agreeableness != null ? agreeableness : 50;
        double n = neuroticism != null ? neuroticism : 50;

        ArchetypeDef best = ARCHETYPES[0];
        double bestDist = Double.MAX_VALUE;

        for (ArchetypeDef arch : ARCHETYPES) {
            double dist = Math.sqrt(
                sq(o - arch.openness) +
                sq(c - arch.conscientiousness) +
                sq(e - arch.extraversion) +
                sq(a - arch.agreeableness) +
                sq(n - arch.neuroticism)
            );
            if (dist < bestDist) {
                bestDist = dist;
                best = arch;
            }
        }

        Map<String, String> result = new LinkedHashMap<>();
        result.put("name", best.name);
        result.put("emoji", best.emoji);
        return result;
    }

    private static double sq(double v) {
        return v * v;
    }
}
