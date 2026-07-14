package com.example.demo.service;

import com.example.demo.dto.MatchRequestDTO;
import com.example.demo.dto.MatchResponseDTO;
import com.example.demo.dto.PythonMatchResponseDTO;
import com.example.demo.dto.UserTraitsDTO;
import com.example.demo.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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

    /** URL of the Python FastAPI matching engine, e.g. http://localhost:8001 or https://matching-engine.onrender.com */
    private final String fastapiUrl;

    private final RestTemplate restTemplate;

    private static final String[] TRAIT_NAMES = {
            "openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"
    };

    /** Connect and read timeouts in milliseconds for outbound matching-engine calls. */
    private static final int CONNECT_TIMEOUT_MS = 3000;
    private static final int READ_TIMEOUT_MS = 5000;

    public MatchingService(RestTemplateBuilder restTemplateBuilder,
                           @Value("${fastapi.url}") String fastapiUrl) {
        this.fastapiUrl = fastapiUrl;
        this.restTemplate = restTemplateBuilder
                .requestFactory(() -> {
                    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
                    factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
                    factory.setReadTimeout(READ_TIMEOUT_MS);
                    return factory;
                })
                .build();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Find the best matches for {@code currentUser} among {@code allUsers}.
     * <p>
     * Delegates to the Python FastAPI matching engine when available.
     * Falls back to the pure-Java Euclidean implementation if the engine is unreachable.
     *
     * @return top 5 matches, sorted by compatibility percentage descending
     */
    public List<MatchResponseDTO> calculateMatches(User currentUser, List<User> allUsers) {
        if (currentUser.getOpenness() == null) return new ArrayList<>();

        List<User> validCandidates = allUsers.stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .filter(u -> u.getOpenness() != null)
                .collect(Collectors.toList());

        if (validCandidates.isEmpty()) return new ArrayList<>();

        try {
            List<MatchResponseDTO> pythonMatches = callPythonEngine(currentUser, validCandidates);
            if (!pythonMatches.isEmpty()) {
                return pythonMatches;
            }
        } catch (Exception e) {
            logger.warn("[Matching] Python engine unavailable ({}), using Java fallback", e.getMessage());
        }

        return calculateMatchesJava(currentUser, validCandidates);
    }

    // ── Python FastAPI integration ────────────────────────────────────────────

    /**
     * POST the target user and candidates to the FastAPI /calculate-match endpoint
     * and map the Python response into our internal {@link MatchResponseDTO}.
     * <p>
     * Contract (FastAPI → Spring Boot):
     * <pre>
     *   { "best_match_id": int,
     *     "compatibility_score": int,
     *     "match_label": str,
     *     "shared_strengths": [str],
     *     "complementary_traits": [str],
     *     "trait_breakdowns": [{trait, userScore, matchScore, matchQuality}] }
     * </pre>
     */
    List<MatchResponseDTO> callPythonEngine(User currentUser, List<User> validCandidates) {
        MatchRequestDTO requestDTO = new MatchRequestDTO();
        requestDTO.setTargetUser(convertToTraitsDTO(currentUser));
        requestDTO.setPotentialMatches(
                validCandidates.stream().map(this::convertToTraitsDTO).collect(Collectors.toList())
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<MatchRequestDTO> entity = new HttpEntity<>(requestDTO, headers);

        ResponseEntity<PythonMatchResponseDTO[]> response = restTemplate.postForEntity(
                fastapiUrl + "/calculate-match",
                entity,
                PythonMatchResponseDTO[].class
        );

        PythonMatchResponseDTO[] body = response.getBody();
        if (body == null || body.length == 0) return new ArrayList<>();

        Map<Long, User> userMap = validCandidates.stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<MatchResponseDTO> matches = new ArrayList<>();
        for (PythonMatchResponseDTO py : body) {
            User matchUser = userMap.get(py.getBestMatchId());
            if (matchUser == null) continue;

            MatchResponseDTO dto = new MatchResponseDTO(
                    matchUser.getName() != null ? matchUser.getName() : "Buddy",
                    matchUser.getArchetype() != null ? matchUser.getArchetype() : "Explorer",
                    matchUser.getHobbies() != null ? matchUser.getHobbies() : "General",
                    py.getCompatibilityScore()
            );
            dto.setId(matchUser.getId());
            dto.setSharedStrengths(py.getSharedStrengths());
            dto.setComplementaryTraits(py.getComplementaryTraits());
            dto.setTraitBreakdowns(py.getTraitBreakdowns());
            matches.add(dto);
        }

        matches.sort((a, b) -> Integer.compare(b.getCompatibilityPercentage(), a.getCompatibilityPercentage()));
        return matches.subList(0, Math.min(5, matches.size()));
    }

    // ── Java fallback: Euclidean distance on Big Five traits ─────────────────

    /**
     * Pure-Java fallback when the Python engine is unreachable.
     * Uses normalised Euclidean distance across all five traits.
     */
    private List<MatchResponseDTO> calculateMatchesJava(User currentUser, List<User> candidates) {
        double[] currentTraits = getTraitsArray(currentUser);

        List<Map.Entry<User, Double>> scored = candidates.stream()
                .map(c -> {
                    double[] ct = getTraitsArray(c);
                    double distance = euclideanDistance(currentTraits, ct);
                    double similarity = (1.0 - distance / 223.6) * 100.0;
                    return Map.entry(c, similarity);
                })
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .collect(Collectors.toList());

        int limit = Math.min(5, scored.size());
        List<MatchResponseDTO> matches = new ArrayList<>();
        for (int i = 0; i < limit; i++) {
            User u = scored.get(i).getKey();
            int pct = (int) Math.round(Math.max(0, Math.min(100, scored.get(i).getValue())));
            double[] candidateTraits = getTraitsArray(u);

            MatchResponseDTO dto = new MatchResponseDTO(
                    u.getName() != null ? u.getName() : "Buddy",
                    u.getArchetype() != null ? u.getArchetype() : "Explorer",
                    u.getHobbies() != null ? u.getHobbies() : "General",
                    pct
            );
            dto.setId(u.getId());
            dto.setSharedStrengths(computeSharedStrengths(currentTraits, candidateTraits));
            dto.setComplementaryTraits(computeComplementaryTraits(currentTraits, candidateTraits));
            dto.setTraitBreakdowns(computeTraitBreakdowns(currentTraits, candidateTraits));
            matches.add(dto);
        }
        return matches;
    }

    // ── Trait helpers ─────────────────────────────────────────────────────────

    private double[] getTraitsArray(User user) {
        return new double[]{
                nz(user.getOpenness()),
                nz(user.getConscientiousness()),
                nz(user.getExtraversion()),
                nz(user.getAgreeableness()),
                100.0 - nz(user.getNeuroticism())   // invert to "calm"
        };
    }

    private double nz(Double v) { return v != null ? v : 0.0; }

    private double euclideanDistance(double[] a, double[] b) {
        double sum = 0;
        for (int i = 0; i < a.length; i++) {
            double d = a[i] - b[i];
            sum += d * d;
        }
        return Math.sqrt(sum);
    }

    // ── Shared strengths / complements / breakdowns (Java fallback) ──────────

    private List<String> computeSharedStrengths(double[] a, double[] b) {
        List<String> out = new ArrayList<>();
        for (int i = 0; i < TRAIT_NAMES.length; i++) {
            if (a[i] >= 60 && b[i] >= 60) out.add(capitalize(TRAIT_NAMES[i]));
        }
        if (out.size() >= 4) out.add("Exceptional Personality Alignment");
        else if (out.size() >= 2) out.add("Strong Personality Overlap");
        return out;
    }

    private List<String> computeComplementaryTraits(double[] a, double[] b) {
        List<String> out = new ArrayList<>();
        for (int i = 0; i < TRAIT_NAMES.length; i++) {
            if (a[i] >= 65 && b[i] >= 30 && b[i] < 65) out.add(capitalize(TRAIT_NAMES[i]) + " balance");
            else if (b[i] >= 65 && a[i] >= 30 && a[i] < 65) out.add(capitalize(TRAIT_NAMES[i]) + " complement");
        }
        return out;
    }

    private List<Map<String, Object>> computeTraitBreakdowns(double[] a, double[] b) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (int i = 0; i < TRAIT_NAMES.length; i++) {
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("trait", capitalize(TRAIT_NAMES[i]));
            e.put("userScore", (int) Math.round(a[i]));
            e.put("matchScore", (int) Math.round(b[i]));
            int diff = (int) Math.abs(a[i] - b[i]);
            e.put("matchQuality", diff <= 10 ? "Very High" : diff <= 25 ? "High" : diff <= 45 ? "Moderate" : "Low");
            out.add(e);
        }
        return out;
    }

    // ── Discover: personality + city boost + hobby overlap ─────────────────────

    /**
     * Enhanced matching for the Discover page.
     * <p>
     * Scoring: Euclidean base + city boost (+10) + hobby overlap (+5 each, max +15),
     * capped at 100.
     *
     * @return sorted list limited to {@code limit} entries, ready for JSON serialisation.
     */
    public List<Map<String, Object>> discoverMatches(User currentUser, List<User> candidates,
                                                     String city, int limit) {
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
            double baseScore = (1.0 - euclideanDistance(currentTraits, candidateTraits) / 223.6) * 100.0;

            double cityBoost = 0;
            if (currentUserCity != null && !currentUserCity.isBlank()
                    && currentUserCity.equalsIgnoreCase(candidate.getCity())) {
                cityBoost = 10;
            }

            long hobbyOverlap = currentUserHobbies.stream()
                    .filter(h -> parseHobbies(candidate.getHobbies()).stream()
                            .anyMatch(ch -> ch.equalsIgnoreCase(h)))
                    .count();
            double hobbyBonus = Math.min(hobbyOverlap * 5, 15);

            int score = (int) Math.round(Math.max(0, Math.min(100, baseScore + cityBoost + hobbyBonus)));

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", candidate.getId());
            entry.put("name", n(candidate.getName(), "Buddy"));
            entry.put("archetype", n(candidate.getArchetype(), "Explorer"));
            entry.put("archetypeEmoji", getArchetypeEmoji(candidate.getArchetype()));
            entry.put("hobbies", n(candidate.getHobbies(), ""));
            entry.put("city", candidate.getCity());
            entry.put("age", candidate.getAge());
            entry.put("personalityTagline", candidate.getPersonalityTagline());
            entry.put("photosJson", n(candidate.getPhotosJson(), "[]"));
            entry.put("matchLabel", scoreToDiscoverLabel(score));
            entry.put("matchScore", score);
            entry.put("sharedStrengths", computeSharedStrengths(currentTraits, candidateTraits));
            entry.put("complementaryTraits", computeComplementaryTraits(currentTraits, candidateTraits));
            entry.put("hobbyOverlapCount", (int) hobbyOverlap);
            entry.put("sameCity", cityBoost > 0);
            entry.put("distanceKm", null);
            results.add(entry);
        }

        results.sort((a, b) -> {
            int cmp = Integer.compare((int) b.get("matchScore"), (int) a.get("matchScore"));
            if (cmp != 0) return cmp;
            cmp = Integer.compare((int) b.get("hobbyOverlapCount"), (int) a.get("hobbyOverlapCount"));
            return cmp != 0 ? cmp : String.valueOf(a.get("name")).compareTo(String.valueOf(b.get("name")));
        });

        return results.stream().limit(Math.min(limit, results.size())).collect(Collectors.toList());
    }

    // ── Misc helpers ──────────────────────────────────────────────────────────

    private List<String> parseHobbies(String s) {
        if (s == null || s.isBlank()) return new ArrayList<>();
        return Arrays.stream(s.split(","))
                .map(String::trim)
                .filter(p -> !p.isEmpty())
                .collect(Collectors.toList());
    }

    private String scoreToDiscoverLabel(int score) {
        if (score >= 85) return "Top match";
        if (score >= 70) return "Strong fit";
        if (score >= 55) return "Great vibe";
        if (score >= 40) return "Similar energy";
        return "Complementary dynamic";
    }

    public String getArchetypeEmoji(String archetype) {
        if (archetype == null) return "🧭";
        return switch (archetype) {
            case "The Visionary" -> "🔮";
            case "The Champion"  -> "🏆";
            case "The Guardian"  -> "🛡️";
            case "The Diplomat"  -> "🕊️";
            case "The Analyst"   -> "🔬";
            case "The Explorer"  -> "🧭";
            case "The Anchor"    -> "⚓";
            case "The Catalyst"  -> "⚡";
            default              -> "🧭";
        };
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private String n(String value, String fallback) {
        return value != null ? value : fallback;
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
