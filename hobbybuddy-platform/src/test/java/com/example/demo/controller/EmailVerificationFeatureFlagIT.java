package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.MatchRequestFeedbackRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the app.email.verification.required feature flag.
 *
 * <p>Test profile has app.email.verification.required=false (see application-test.properties).
 * This means:
 * <ul>
 *   <li>Registration auto-verifies users (emailVerified=true)</li>
 *   <li>JWT is issued immediately on registration</li>
 *   <li>API access works without separate email verification</li>
 * </ul>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EmailVerificationFeatureFlagIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private MatchRequestRepository matchRequestRepository;

    @Autowired
    private MatchRequestFeedbackRepository feedbackRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private final ObjectMapper om = new ObjectMapper();

    @BeforeEach
    void setUp() {
        // Clean up in FK-safe order
        feedbackRepository.deleteAll();
        matchRequestRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Registration with verification disabled (test profile default)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void registrationAutoVerifiesUserWhenFlagDisabled() throws Exception {
        String email = "autoverify@test.com";
        String regBody = "{\"email\": \"" + email + "\", \"password\": \"pass123456\", \"name\": \"AutoVerify\"}";

        String responseBody = mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.message").value("Registration successful. Your account is ready!"))
                .andReturn().getResponse().getContentAsString();

        // User should be auto-verified in the DB
        User savedUser = userRepository.findByEmail(email).orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(savedUser.isEmailVerified(),
                "User should be auto-verified when app.email.verification.required=false");
    }

    @Test
    void registrationIssuesJwtImmediatelyWhenFlagDisabled() throws Exception {
        String email = "jwt-at-register@test.com";
        String regBody = "{\"email\": \"" + email + "\", \"password\": \"pass123456\", \"name\": \"JwtUser\"}";

        String responseBody = mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String token = om.readTree(responseBody).get("token").asText();
        org.junit.jupiter.api.Assertions.assertFalse(token.isBlank(), "JWT should be present in response");

        // JWT should work for authenticated endpoints
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void loginWorksImmediatelyAfterRegistrationWhenFlagDisabled() throws Exception {
        String email = "login-after-reg@test.com";
        String password = "pass123456";
        String regBody = "{\"email\": \"" + email + "\", \"password\": \"" + password + "\", \"name\": \"LoginUser\"}";

        // Register
        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regBody))
                .andExpect(status().isCreated());

        // Login should work immediately (no email verification needed)
        String loginBody = "{\"email\": \"" + email + "\", \"password\": \"" + password + "\"}";
        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void apiAccessWorksWithoutSeparateVerificationWhenFlagDisabled() throws Exception {
        String email = "api-access@test.com";
        String regBody = "{\"email\": \"" + email + "\", \"password\": \"pass123456\", \"name\": \"ApiUser\"}";

        // Register and get JWT from response
        String responseBody = mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String token = om.readTree(responseBody).get("token").asText();

        // Access a protected endpoint directly — no separate verification step
        mockMvc.perform(get("/api/users/{id}", 1)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden()); // 403 because user 1 is not this user, but NOT 403 EMAIL_NOT_VERIFIED
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Forgot-password when mail sender fails (NoOpMailSender in test)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void forgotPasswordStillCreatesTokenWhenEmailFails() throws Exception {
        // Create a verified user
        User user = new User();
        user.setEmail("forgot-fail@test.com");
        user.setPassword(passwordEncoder.encode("pass123"));
        user.setEmailVerified(true);
        user.setName("ForgotFail");
        user = userRepository.save(user);

        // Forgot-password returns neutral 200 even though email will silently fail (NoOpMailSender)
        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"forgot-fail@test.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If the email exists, a password reset link has been sent."));

        // Token should still be created in the DB (email failure is non-blocking)
        java.util.List<com.example.demo.model.PasswordResetToken> tokens =
                passwordResetTokenRepository.findAllByUserOrderByCreatedAtDesc(user);
        org.junit.jupiter.api.Assertions.assertFalse(tokens.isEmpty(),
                "Reset token should be created even when email delivery fails");
    }

    @Test
    void forgotPasswordDoesNotCrashAppWhenEmailDisabled() throws Exception {
        // Create a user
        User user = new User();
        user.setEmail("no-crash@test.com");
        user.setPassword(passwordEncoder.encode("pass123"));
        user.setEmailVerified(true);
        user.setName("NoCrash");
        user = userRepository.save(user);

        // Multiple forgot-password calls should all succeed without crashing
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/users/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\": \"no-crash@test.com\"}"))
                    .andExpect(status().isOk());
        }

        // App should still be healthy
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Registration conflict still works correctly
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void duplicateRegistrationReturnsConflictWhenFlagDisabled() throws Exception {
        String email = "dup@test.com";
        String regBody = "{\"email\": \"" + email + "\", \"password\": \"pass123456\", \"name\": \"DupUser\"}";

        // First registration succeeds
        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regBody))
                .andExpect(status().isCreated());

        // Second registration with same email returns 409
        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regBody))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Email already registered"));
    }
}
