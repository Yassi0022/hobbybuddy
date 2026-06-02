package com.example.demo.service;

import com.example.demo.dto.MatchRequestDTO;
import com.example.demo.dto.MatchResponseDTO;
import com.example.demo.dto.PythonMatchResponseDTO;
import com.example.demo.dto.UserTraitsDTO;
import com.example.demo.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MatchingService {

    private static final Logger logger = LoggerFactory.getLogger(MatchingService.class);
    private final String fastapiUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String[] TRAIT_NAMES = {"openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"};

    public MatchingService(@Value("${fastapi.url}") String fastapiUrl) {
        this.fastapiUrl = fastapiUrl;
    }

    public List<MatchResponseDTO> calculateMatches(User currentUser, List<User> allUsers) {
        List<MatchResponseDTO> matches = new ArrayList<>();

        if (currentUser.getOpenness() == null) return matches;

        List<User> validCandidates = allUsers.stream()
                .filter(u -> !u.getId().equals(currentUser.getId()) && u.getOpenness() != null)
                .collect(Collectors.toList());

        if (validCandidates.isEmpty()) return matches;

        // Try Python FastAPI first
        try {
            List<MatchResponseDTO> pythonMatches = callPythonEngine(currentUser, validCandidates);
            if (!pythonMatches.isEmpty()) {
                return pythonMatches;
            }
        } catch (Exception e) {
            logger.warn("Python matching engine unavailable ({}), falling back to Java matching", e.getMessage());
        }

        // Fallback: pure Java matching
        return calculateMatchesJava(currentUser, validCandidates);
    }

    private List<MatchResponseDTO> callPythonEngine(User currentUser, List<User> validCandidates) {
        MatchRequestDTO requestDTO = new MatchRequestDTO();
        requestDTO.setTargetUser(convertToTraitsDTO(currentUser));

        List<UserTraitsDTO> candidatesDTOs = validCandidates.stream()
                .map(this::convertToTraitsDTO)
                .collect(Collectors.toList());
        requestDTO.setPotentialMatches(candidatesDTOs);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<MatchRequestDTO> entity = new HttpEntity<>(requestDTO, headers);

        ResponseEntity<PythonMatchResponseDTO[]> response = restTemplate.postForEntity(
                fastapiUrl + "/calculate-match",
                entity,
                PythonMatchResponseDTO[].class
        );

        PythonMatchResponseDTO[] pythonResponse = response.getBody();
        if (pythonResponse == null || pythonResponse.length == 0) return new ArrayList<>();

        Map<Long, User> userMap = validCandidates.stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<MatchResponseDTO> matches = new ArrayList<>();
        for (PythonMatchResponseDTO pyMatch : pythonResponse) {
            User matchUser = userMap.get(pyMatch.getBestMatchId());
            if (matchUser != null) {
                int percentage = (int) Math.round(pyMatch.getCompatibilityScore());
                MatchResponseDTO dto = new MatchResponseDTO(
                        matchUser.getName() != null ? matchUser.getName() : "Buddy",
                        matchUser.getArchetype() != null ? matchUser.getArchetype() : "Explorer",
                        matchUser.getHobbies() != null ? matchUser.getHobbies() : "General",
                        percentage
                );
                dto.setId(matchUser.getId());
                dto.setSharedStrengths(pyMatch.getSharedStrengths());
                dto.setComplementaryTraits(pyMatch.getComplementaryTraits());
                dto.setTraitBreakdowns(pyMatch.getTraitBreakdowns());
                matches.add(dto);
            }
        }

        matches.sort((a, b) -> Integer.compare(b.getCompatibilityPercentage(), a.getCompatibilityPercentage()));
        return matches.subList(0, Math.min(5, matches.size()));
    }

    /**
     * Pure Java fallback matching based on Big-5 personality trait similarity.
     * Uses normalised Euclidean distance to compute compatibility percentage.
     */
    private List<MatchResponseDTO> calculateMatchesJava(User currentUser, List<User> candidates) {
        double[] currentTraits = getTraitsArray(currentUser);

        // Build scored list
        List<Map.Entry<User, Double>> scored = new ArrayList<>();
        for (User candidate : candidates) {
            double[] candidateTraits = getTraitsArray(candidate);
            double distance = euclideanDistance(currentTraits, candidateTraits);
            // Max possible Euclidean distance for 5 traits (0-100 range each) = sqrt(5 * 10000) = ~223.6
            double maxDistance = 223.6;
            double similarity = (1.0 - (distance / maxDistance)) * 100.0;
            scored.add(Map.entry(candidate, similarity));
        }

        // Sort descending by score
        scored.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        List<MatchResponseDTO> matches = new ArrayList<>();
        int limit = Math.min(5, scored.size());
        for (int i = 0; i < limit; i++) {
            User u = scored.get(i).getKey();
            int pct = (int) Math.round(Math.max(0, Math.min(100, scored.get(i).getValue())));

            MatchResponseDTO dto = new MatchResponseDTO(
                    u.getName() != null ? u.getName() : "Buddy",
                    u.getArchetype() != null ? u.getArchetype() : "Explorer",
                    u.getHobbies() != null ? u.getHobbies() : "General",
                    pct
            );
            dto.setId(u.getId());

            double[] candidateTraits = getTraitsArray(u);
            dto.setSharedStrengths(computeSharedStrengths(currentTraits, candidateTraits));
            dto.setComplementaryTraits(computeComplementaryTraits(currentTraits, candidateTraits));
            dto.setTraitBreakdowns(computeTraitBreakdowns(currentTraits, candidateTraits));

            matches.add(dto);
        }
        return matches;
    }

    private double[] getTraitsArray(User user) {
        return new double[]{
                user.getOpenness() != null ? user.getOpenness() : 0,
                user.getConscientiousness() != null ? user.getConscientiousness() : 0,
                user.getExtraversion() != null ? user.getExtraversion() : 0,
                user.getAgreeableness() != null ? user.getAgreeableness() : 0,
                // Invert neuroticism: lower neuroticism is better for compatibility
                user.getNeuroticism() != null ? (100 - user.getNeuroticism()) : 0
        };
    }

    private double euclideanDistance(double[] a, double[] b) {
        double sum = 0;
        for (int i = 0; i < a.length; i++) {
            double diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    /**
     * A shared strength = a trait where BOTH users score >= 70.
     */
    private List<String> computeSharedStrengths(double[] current, double[] candidate) {
        List<String> strengths = new ArrayList<>();
        for (int i = 0; i < TRAIT_NAMES.length; i++) {
            if (current[i] >= 60 && candidate[i] >= 60) {
                strengths.add(capitalize(TRAIT_NAMES[i]));
            }
        }
        // Extra badges
        if (strengths.size() >= 4) strengths.add("Exceptional Personality Alignment");
        else if (strengthCount(current, candidate, 60) >= 2) strengths.add("Strong Personality Overlap");
        return strengths;
    }

    private int strengthCount(double[] a, double[] b, double threshold) {
        int count = 0;
        for (int i = 0; i < a.length; i++) {
            if (a[i] >= threshold && b[i] >= threshold) count++;
        }
        return count;
    }

    /**
     * Complementary traits = one user is high (>=65) and the other is moderate (30-65),
     * creating balance rather than conflict.
     */
    private List<String> computeComplementaryTraits(double[] current, double[] candidate) {
        List<String> complementary = new ArrayList<>();
        for (int i = 0; i < TRAIT_NAMES.length; i++) {
            if (current[i] >= 65 && candidate[i] >= 30 && candidate[i] < 65) {
                complementary.add(capitalize(TRAIT_NAMES[i]) + " balance");
            } else if (candidate[i] >= 65 && current[i] >= 30 && current[i] < 65) {
                complementary.add(capitalize(TRAIT_NAMES[i]) + " complement");
            }
        }
        return complementary;
    }

    /**
     * Build per-trait breakdown with labels, scores for both users, and match quality.
     */
    private List<Map<String, Object>> computeTraitBreakdowns(double[] current, double[] candidate) {
        List<Map<String, Object>> breakdowns = new ArrayList<>();
        for (int i = 0; i < TRAIT_NAMES.length; i++) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("trait", capitalize(TRAIT_NAMES[i]));
            entry.put("userScore", (int) Math.round(current[i]));
            entry.put("matchScore", (int) Math.round(candidate[i]));
            int diff = (int) Math.abs(current[i] - candidate[i]);
            String quality;
            if (diff <= 10) quality = "Very High";
            else if (diff <= 25) quality = "High";
            else if (diff <= 45) quality = "Moderate";
            else quality = "Low";
            entry.put("matchQuality", quality);
            breakdowns.add(entry);
        }
        return breakdowns;
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }

    /**
     * Enhanced matching for Discover: personality + city boost + hobby overlap + recency.
     * Returns richer DTOs suitable for the Discover page (archetype, photos, city, etc.).
     *
     * Scoring:
     *   base score    = Euclidean distance on 5 Big-Five traits (0–100)
     *   city boost    = +10 if same city (capped at 100)
     *   hobby bonus   = +5 per shared hobby, max +15 (capped at 100 after city boost)
     *   recency bonus = +5 if quiz completed within last 7 days
     *   final score   = min(100, base + cityBoost + hobbyBonus + recencyBonus)
     *
     * Sort: finalScore DESC → hobbyOverlap DESC → name ASC
     */
    public List<Map<String, Object>> discoverMatches(User currentUser, List<User> candidates, String city, int limit) {
        if (currentUser.getOpenness() == null || candidates == null || candidates.isEmpty()) {
            return new ArrayList<>();
        }

        double[] currentTraits = getTraitsArray(currentUser);
        String currentUserCity = currentUser.getCity();
        List<String> currentUserHobbies = parseHobbies(currentUser.getHobbies());

        List<Map<String, Object>> results = new ArrayList<>();

        for (User candidate : candidates) {
            if (candidate.getId().equals(currentUser.getId())) continue;
            if (candidate.getOpenness() == null) continue;

            double[] candidateTraits = getTraitsArray(candidate);
            double distance = euclideanDistance(currentTraits, candidateTraits);
            double maxDistance = 223.6;
            double baseScore = (1.0 - (distance / maxDistance)) * 100.0;

            // City boost
            double cityBoost = 0;
            if (currentUserCity != null && !currentUserCity.isBlank()
                    && currentUserCity.equalsIgnoreCase(candidate.getCity())) {
                cityBoost = 10;
            }

            // Hobby overlap
            List<String> candidateHobbies = parseHobbies(candidate.getHobbies());
            long hobbyOverlap = currentUserHobbies.stream()
                    .filter(h -> candidateHobbies.stream()
                            .anyMatch(ch -> ch.equalsIgnoreCase(h)))
                    .count();
            double hobbyBonus = Math.min(hobbyOverlap * 5, 15);

            // Users with no shared hobbies don't get a penalty — base score stands

            double finalScore = Math.min(100, baseScore + cityBoost + hobbyBonus);
            int score = (int) Math.round(Math.max(0, finalScore));

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", candidate.getId());
            entry.put("name", candidate.getName() != null ? candidate.getName() : "Buddy");
            entry.put("archetype", candidate.getArchetype() != null ? candidate.getArchetype() : "Explorer");
            entry.put("archetypeEmoji", getArchetypeEmoji(candidate.getArchetype()));
            entry.put("hobbies", candidate.getHobbies() != null ? candidate.getHobbies() : "");
            entry.put("city", candidate.getCity());
            entry.put("age", candidate.getAge());
            entry.put("personalityTagline", candidate.getPersonalityTagline());
            entry.put("photosJson", candidate.getPhotosJson() != null ? candidate.getPhotosJson() : "[]");
            entry.put("matchLabel", scoreToDiscoverLabel(score));
            entry.put("matchScore", score);
            entry.put("sharedStrengths", computeSharedStrengths(currentTraits, candidateTraits));
            entry.put("complementaryTraits", computeComplementaryTraits(currentTraits, candidateTraits));
            entry.put("hobbyOverlapCount", (int) hobbyOverlap);
            entry.put("sameCity", cityBoost > 0);
            entry.put("distanceKm", null); // reserved for future geo-radius filtering

            results.add(entry);
        }

        // Sort: score DESC → hobby overlap DESC → name ASC
        results.sort((a, b) -> {
            int scoreCompare = Integer.compare((int) b.get("matchScore"), (int) a.get("matchScore"));
            if (scoreCompare != 0) return scoreCompare;
            int hobbyCompare = Integer.compare((int) b.get("hobbyOverlapCount"), (int) a.get("hobbyOverlapCount"));
            if (hobbyCompare != 0) return hobbyCompare;
            return String.valueOf(a.get("name")).compareTo(String.valueOf(b.get("name")));
        });

        return results.stream().limit(Math.min(limit, results.size())).collect(Collectors.toList());
    }

    /**
     * Parse comma-separated hobby string into trimmed list.
     */
    private List<String> parseHobbies(String hobbiesStr) {
        if (hobbiesStr == null || hobbiesStr.isBlank()) return new ArrayList<>();
        return Arrays.stream(hobbiesStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private String scoreToDiscoverLabel(int score) {
        if (score >= 85) return "Top match";
        if (score >= 70) return "Strong fit";
        if (score >= 55) return "Great vibe";
        if (score >= 40) return "Similar energy";
        return "Complementary dynamic";
    }

    private String getArchetypeEmoji(String archetype) {
        if (archetype == null) return "🧭";
        return switch (archetype) {
            case "The Visionary" -> "🔮";
            case "The Champion" -> "🏆";
            case "The Guardian" -> "🛡️";
            case "The Diplomat" -> "🕊️";
            case "The Analyst" -> "🔬";
            case "The Explorer" -> "🧭";
            case "The Anchor" -> "⚓";
            case "The Catalyst" -> "⚡";
            default -> "🧭";
        };
    }

    private UserTraitsDTO convertToTraitsDTO(User user) {
        UserTraitsDTO dto = new UserTraitsDTO();
        dto.setId(user.getId());
        dto.setOpenness(user.getOpenness());
        dto.setConscientiousness(user.getConscientiousness());
        dto.setExtraversion(user.getExtraversion());
        dto.setAgreeableness(user.getAgreeableness());
        dto.setNeuroticism(user.getNeuroticism());
        return dto;
    }
}
