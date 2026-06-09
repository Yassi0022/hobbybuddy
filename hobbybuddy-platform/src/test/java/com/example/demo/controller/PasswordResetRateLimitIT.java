package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.MatchRequestFeedbackRepository;
import com.example.demo.repository.MatchRequestRepository;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Rate-limit tests for the forgot-password endpoint.
 *
 * <p>Separate class with {@code @DirtiesContext} to ensure a fresh rate limiter.
 * Each test uses a distinct {@code X-Forwarded-For} IP to avoid bucket sharing.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class PasswordResetRateLimitIT {

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

    @BeforeEach
    void setUp() {
        feedbackRepository.deleteAll();
        matchRequestRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void forgotPasswordRateLimited() throws Exception {
        String body = "{\"email\": \"ratelimit@test.com\"}";

        // First 10 requests should succeed (limit is 10 per 15 min)
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/users/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk());
        }

        // 11th request should be rate-limited (429)
        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error").value("Too Many Requests"))
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    void forgotPasswordRateLimitPerEmail() throws Exception {
        // Use a dedicated IP for this test to avoid sharing the IP bucket
        String bodyAlice = "{\"email\": \"alice@example.com\"}";

        // Exhaust rate limit for alice@example.com (10 requests)
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/users/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("X-Forwarded-For", "10.0.0.50")
                            .content(bodyAlice))
                    .andExpect(status().isOk());
        }

        // 11th request for the same email should be blocked (email-based bucket)
        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Forwarded-For", "10.0.0.50")
                        .content(bodyAlice))
                .andExpect(status().isTooManyRequests());

        // Different email from a different IP should still work
        String bodyBob = "{\"email\": \"bob@example.com\"}";
        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Forwarded-For", "10.0.0.51")
                        .content(bodyBob))
                .andExpect(status().isOk());
    }
}
