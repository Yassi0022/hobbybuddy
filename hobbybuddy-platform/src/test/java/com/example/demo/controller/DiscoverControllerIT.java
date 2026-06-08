package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.MatchRequestRepository;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DiscoverControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MatchRequestRepository matchRequestRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private final ObjectMapper om = new ObjectMapper();

    private String userAToken;
    private Long userAId;

    @BeforeEach
    void setUp() {
        // Clean up in FK-safe order
        matchRequestRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        // Create user A (the searcher) — verified, with full quiz data, in Rome
        User a = new User();
        a.setEmail("a@test.com");
        a.setPassword(passwordEncoder.encode("pass123"));
        a.setEmailVerified(true);
        a.setName("Alice");
        a.setOpenness(80.0);
        a.setConscientiousness(70.0);
        a.setExtraversion(60.0);
        a.setAgreeableness(75.0);
        a.setNeuroticism(30.0);
        a.setArchetype("The Champion");
        a.setHobbies("hiking,reading,cooking");
        a.setCity("Rome");
        a.setAge(28);
        a = userRepository.save(a);
        userAId = a.getId();
        userAToken = jwtUtil.generateToken(a.getEmail());
    }

    // Helper: create a verified user with quiz data
    private User createVerifiedUser(String email, String name, String city,
                                    double openness, double conscientiousness,
                                    double extraversion, double agreeableness,
                                    double neuroticism, String hobbies) {
        User u = new User();
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode("pass456"));
        u.setEmailVerified(true);
        u.setName(name);
        u.setOpenness(openness);
        u.setConscientiousness(conscientiousness);
        u.setExtraversion(extraversion);
        u.setAgreeableness(agreeableness);
        u.setNeuroticism(neuroticism);
        u.setArchetype("The Explorer");
        u.setHobbies(hobbies);
        u.setCity(city);
        u.setAge(25);
        return userRepository.save(u);
    }

    // 1. Authenticated user with quiz gets ranked results
    @Test
    void discoverReturnsRankedResults() throws Exception {
        // User B: same city, similar traits, overlapping hobbies
        createVerifiedUser("b@test.com", "Bob", "Rome",
                78.0, 72.0, 58.0, 73.0, 32.0, "hiking,reading,photography");

        // User C: different city, different traits, no hobby overlap
        createVerifiedUser("c@test.com", "Carol", "Berlin",
                30.0, 40.0, 20.0, 50.0, 80.0, "gaming,anime");

        mockMvc.perform(get("/api/discover")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people").isArray())
                .andExpect(jsonPath("$.people.length()").value(2))
                // Bob should be first (same city + similar traits + hobby overlap)
                .andExpect(jsonPath("$.people[0].name").value("Bob"))
                .andExpect(jsonPath("$.people[0].sameCity").value(true))
                .andExpect(jsonPath("$.people[0].hobbyOverlapCount").value(2))
                // Carol should be second
                .andExpect(jsonPath("$.people[1].name").value("Carol"))
                .andExpect(jsonPath("$.people[1].sameCity").value(false))
                .andExpect(jsonPath("$.people[1].hobbyOverlapCount").value(0));
    }

    // 2. Self is excluded from results
    @Test
    void discoverExcludesSelf() throws Exception {
        // Only user A exists — should get empty results
        mockMvc.perform(get("/api/discover")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people").isArray())
                .andExpect(jsonPath("$.people.length()").value(0));
    }

    // 3. Users without quiz (null openness) are excluded
    @Test
    void discoverExcludesUsersWithoutQuiz() throws Exception {
        User b = new User();
        b.setEmail("b@test.com");
        b.setPassword(passwordEncoder.encode("pass456"));
        b.setEmailVerified(true);
        b.setName("Bob");
        b.setCity("Rome");
        // No Big Five traits set — openness is null
        userRepository.save(b);

        mockMvc.perform(get("/api/discover")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people").isArray())
                .andExpect(jsonPath("$.people.length()").value(0));
    }

    // 4. Unauthenticated request -> 401 (discover now requires auth)
    @Test
    void discoverUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/discover"))
                .andExpect(status().isUnauthorized());
    }

    // 5. City match boosts score — RomeUser gets +10 city boost, BerlinUser does not
    @Test
    void cityMatchBoostsScore() throws Exception {
        // Both have identical traits, only city differs
        // Alice traits (neuroticism inverted): [80, 70, 60, 75, 70]
        // dist from Alice to [45,40,35,45,40] = sqrt(1225+900+625+900+900) = sqrt(4550) = 67.5
        // base = (1 - 67.5/223.6)*100 = 69.8 for both
        // RomeUser: +10 city boost = 80, BerlinUser: +0 = 70
        createVerifiedUser("rome@test.com", "RomeUser", "Rome",
                45.0, 40.0, 35.0, 45.0, 60.0, "knitting");
        createVerifiedUser("berlin@test.com", "BerlinUser", "Berlin",
                45.0, 40.0, 35.0, 45.0, 60.0, "knitting");

        mockMvc.perform(get("/api/discover")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people.length()").value(2))
                // RomeUser first: same base + city boost
                .andExpect(jsonPath("$.people[0].name").value("RomeUser"))
                .andExpect(jsonPath("$.people[0].sameCity").value(true))
                .andExpect(jsonPath("$.people[1].name").value("BerlinUser"))
                .andExpect(jsonPath("$.people[1].sameCity").value(false));
    }

    // 6. Hobby overlap increases score
    @Test
    void hobbyOverlapIncreasesScore() throws Exception {
        // Same city, same traits — but different hobbies
        createVerifiedUser("full@test.com", "FullHobby", "Rome",
                80.0, 70.0, 60.0, 75.0, 30.0, "hiking,reading,cooking");
        createVerifiedUser("none@test.com", "NoHobby", "Rome",
                80.0, 70.0, 60.0, 75.0, 30.0, "gaming,anime");

        mockMvc.perform(get("/api/discover")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people.length()").value(2))
                // FullHobby should be first (3 shared hobbies)
                .andExpect(jsonPath("$.people[0].name").value("FullHobby"))
                .andExpect(jsonPath("$.people[0].hobbyOverlapCount").value(3))
                .andExpect(jsonPath("$.people[1].name").value("NoHobby"))
                .andExpect(jsonPath("$.people[1].hobbyOverlapCount").value(0));
    }

    // 7. Pagination: limit and offset control result count
    @Test
    void discoverPagination() throws Exception {
        // Create 5 candidates with varying scores (different openness = different Euclidean distance)
        for (int i = 0; i < 5; i++) {
            createVerifiedUser("user" + i + "@test.com", "User" + i, "Rome",
                    70.0 + i * 3, 60.0 + i * 2, 50.0 + i * 2, 65.0 + i, 35.0 - i, "hiking");
        }

        // First page: limit=2, offset=0 → should return 2 results
        String page1 = mockMvc.perform(get("/api/discover")
                        .param("limit", "2")
                        .param("offset", "0")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people.length()").value(2))
                .andReturn().getResponse().getContentAsString();
        String firstNamePage1 = om.readTree(page1).get("people").get(0).get("name").asText();

        // Second page: limit=2, offset=2 → should return 2 different results
        String page2 = mockMvc.perform(get("/api/discover")
                        .param("limit", "2")
                        .param("offset", "2")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people.length()").value(2))
                .andReturn().getResponse().getContentAsString();
        String firstNamePage2 = om.readTree(page2).get("people").get(0).get("name").asText();

        // Pages should contain different users
        org.junit.jupiter.api.Assertions.assertNotEquals(firstNamePage1, firstNamePage2);

        // Last page: limit=2, offset=4 → should return 1 result (only 5 total)
        mockMvc.perform(get("/api/discover")
                        .param("limit", "2")
                        .param("offset", "4")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people.length()").value(1));
    }

    // 8. Active match request excludes user from discover
    @Test
    void discoverExcludesUsersWithActiveMatchRequests() throws Exception {
        User b = createVerifiedUser("b@test.com", "Bob", "Rome",
                78.0, 72.0, 58.0, 73.0, 32.0, "hiking,reading");

        // Create a pending match request from A to B
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/match-requests/{candidateId}", b.getId())
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        // B should NOT appear in A's discover results
        mockMvc.perform(get("/api/discover")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people").isArray())
                .andExpect(jsonPath("$.people.length()").value(0));
    }

    // 9. Confirmed match request also excludes user
    @Test
    void discoverExcludesUsersWithConfirmedMatchRequests() throws Exception {
        User b = createVerifiedUser("b@test.com", "Bob", "Rome",
                78.0, 72.0, 58.0, 73.0, 32.0, "hiking,reading");

        // Create a pending request from A to B
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/match-requests/{candidateId}", b.getId())
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        // Get the request id
        Long requestId = matchRequestRepository.findAll().get(0).getId();

        // B confirms the request
        String userBToken = jwtUtil.generateToken("b@test.com");
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/api/match-requests/{id}/confirm", requestId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk());

        // B should still NOT appear in A's discover results
        mockMvc.perform(get("/api/discover")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people.length()").value(0));
    }

    // 10. DONE match request does NOT exclude user (they can be rediscovered)
    @Test
    void discoverIncludesUsersWithDoneMatchRequests() throws Exception {
        User b = createVerifiedUser("b@test.com", "Bob", "Rome",
                78.0, 72.0, 58.0, 73.0, 32.0, "hiking,reading");

        // Create + confirm request
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/match-requests/{candidateId}", b.getId())
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        Long requestId = matchRequestRepository.findAll().get(0).getId();
        String userBToken = jwtUtil.generateToken("b@test.com");
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/api/match-requests/{id}/confirm", requestId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk());

        // Mark as DONE (simulate feedback submission which transitions to DONE)
        // We'll directly set it since feedback endpoint returns fresh matches
        var mr = matchRequestRepository.findById(requestId).orElseThrow();
        mr.setStatus(com.example.demo.model.MatchRequest.Status.DONE);
        matchRequestRepository.save(mr);

        // B SHOULD appear in A's discover results now (DONE is not active)
        mockMvc.perform(get("/api/discover")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people.length()").value(1))
                .andExpect(jsonPath("$.people[0].name").value("Bob"));
    }

    // 11. Response includes score explanation fields
    @Test
    void discoverResponseIncludesScoreExplanation() throws Exception {
        createVerifiedUser("b@test.com", "Bob", "Rome",
                78.0, 72.0, 58.0, 73.0, 32.0, "hiking,reading");

        mockMvc.perform(get("/api/discover")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people[0].matchScore").isNumber())
                .andExpect(jsonPath("$.people[0].matchLabel").isString())
                .andExpect(jsonPath("$.people[0].sharedStrengths").isArray())
                .andExpect(jsonPath("$.people[0].complementaryTraits").isArray())
                .andExpect(jsonPath("$.people[0].sameCity").isBoolean())
                .andExpect(jsonPath("$.people[0].hobbyOverlapCount").isNumber())
                .andExpect(jsonPath("$.people[0].archetype").isString())
                .andExpect(jsonPath("$.people[0].city").isString());
    }

    // 12. User without quiz gets empty results with message
    @Test
    void discoverWithoutQuizReturnsEmptyWithMessage() throws Exception {
        // Create user A without quiz data
        matchRequestRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        User a = new User();
        a.setEmail("noquiz@test.com");
        a.setPassword(passwordEncoder.encode("pass123"));
        a.setEmailVerified(true);
        a.setName("NoQuiz");
        a.setCity("Rome");
        // No Big Five traits
        a = userRepository.save(a);
        String noQuizToken = jwtUtil.generateToken(a.getEmail());

        // Create a candidate with quiz
        createVerifiedUser("candidate@test.com", "Candidate", "Rome",
                70.0, 60.0, 50.0, 65.0, 35.0, "hiking");

        mockMvc.perform(get("/api/discover")
                        .header("Authorization", "Bearer " + noQuizToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people").isArray())
                .andExpect(jsonPath("$.people.length()").value(0));
    }
}
