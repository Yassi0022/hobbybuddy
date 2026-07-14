package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.MatchRequestRepository;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
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
class UserAccessControlIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private MatchRequestRepository matchRequestRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private String userAToken;
    private String userBToken;
    private Long userAId;
    private Long userBId;

    @BeforeEach
    void setUp() {
        passwordResetTokenRepository.deleteAll();
        matchRequestRepository.deleteAll();
        userRepository.deleteAll();

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
        a.setHobbies("hiking,reading");
        a.setCity("Rome");
        a.setAge(28);
        a = userRepository.save(a);
        userAId = a.getId();
        userAToken = jwtUtil.generateToken(a.getEmail());

        User b = new User();
        b.setEmail("b@test.com");
        b.setPassword(passwordEncoder.encode("pass456"));
        b.setEmailVerified(true);
        b.setName("Bob");
        b.setOpenness(60.0);
        b.setConscientiousness(55.0);
        b.setExtraversion(45.0);
        b.setAgreeableness(65.0);
        b.setNeuroticism(40.0);
        b.setArchetype("The Explorer");
        b.setHobbies("gaming,anime");
        b.setCity("Berlin");
        b.setAge(25);
        b = userRepository.save(b);
        userBId = b.getId();
        userBToken = jwtUtil.generateToken(b.getEmail());
    }

    // ── GET /api/users/{id} ──

    // 1. Unauthenticated -> 401
    @Test
    void getUserByIdUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/users/{id}", userAId))
                .andExpect(status().isUnauthorized());
    }

    // 2. Authenticated owner -> 200 with own data
    @Test
    void getUserByIdAsOwner() throws Exception {
        mockMvc.perform(get("/api/users/{id}", userAId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userAId))
                .andExpect(jsonPath("$.email").value("a@test.com"))
                .andExpect(jsonPath("$.name").value("Alice"));
    }

    // 3. Authenticated but accessing other user's data -> 403
    @Test
    void getUserByIdAsOtherUser() throws Exception {
        mockMvc.perform(get("/api/users/{id}", userBId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("You can only view your own profile"));
    }

    // ── GET /api/users/{id}/profile ──

    // 4a. Unauthenticated -> 401
    @Test
    void getProfileUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/users/{id}/profile", userAId))
                .andExpect(status().isUnauthorized());
    }

    // 4b. Authenticated owner -> 200 with profile data
    @Test
    void getProfileAsOwner() throws Exception {
        mockMvc.perform(get("/api/users/{id}/profile", userAId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userAId))
                .andExpect(jsonPath("$.email").value("a@test.com"))
                .andExpect(jsonPath("$.name").value("Alice"))
                .andExpect(jsonPath("$.archetype").isString())
                .andExpect(jsonPath("$.referralCount").isNumber());
    }

    // 4c. Authenticated but accessing other user's profile -> 403
    @Test
    void getProfileAsOtherUser() throws Exception {
        mockMvc.perform(get("/api/users/{id}/profile", userBId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("You can only view your own profile"));
    }

    // ── GET /api/users/{id}/find-buddy ──

    // 4d. Unauthenticated -> 401
    @Test
    void findBuddyUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/users/{id}/find-buddy", userAId))
                .andExpect(status().isUnauthorized());
    }

    // 5. Authenticated owner -> 200 with matches
    @Test
    void findBuddyAsOwner() throws Exception {
        mockMvc.perform(get("/api/users/{id}/find-buddy", userAId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matches").isArray());
    }

    // 6. Authenticated but accessing other user's find-buddy -> 403
    @Test
    void findBuddyAsOtherUser() throws Exception {
        mockMvc.perform(get("/api/users/{id}/find-buddy", userBId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("You can only find buddies for your own account"));
    }

    // ── GET /api/discover ──

    // 7. Unauthenticated -> 401 (no longer permitAll)
    @Test
    void discoverUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/discover"))
                .andExpect(status().isUnauthorized());
    }

    // 8. Authenticated -> 200
    @Test
    void discoverAuthenticated() throws Exception {
        mockMvc.perform(get("/api/discover")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk());
    }
}
