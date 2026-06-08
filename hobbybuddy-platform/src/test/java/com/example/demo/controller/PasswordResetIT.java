package com.example.demo.controller;

import com.example.demo.model.PasswordResetToken;
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

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PasswordResetIT {

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

    private Long userId;
    private String userEmail = "reset@test.com";
    private String originalPassword = "original123";

    @BeforeEach
    void setUp() {
        // Clean up in FK-safe order (child tables first)
        feedbackRepository.deleteAll();
        matchRequestRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        // Create a verified user
        User user = new User();
        user.setEmail(userEmail);
        user.setPassword(passwordEncoder.encode(originalPassword));
        user.setEmailVerified(true);
        user.setName("ResetUser");
        user = userRepository.save(user);
        userId = user.getId();
    }

    // 1. Request password reset with existing email -> generic success
    @Test
    void forgotPasswordExistingEmail() throws Exception {
        String body = "{\"email\": \"" + userEmail + "\"}";

        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If the email exists, a password reset link has been sent."));

        // Verify a token was created
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        PasswordResetToken token = passwordResetTokenRepository.findByUser(user).orElse(null);
        org.junit.jupiter.api.Assertions.assertNotNull(token, "Reset token should be created");
        org.junit.jupiter.api.Assertions.assertFalse(token.getExpiry().isBefore(LocalDateTime.now()), "Token should not be expired");
    }

    // 2. Request password reset with unknown email -> same generic success (no enumeration)
    @Test
    void forgotPasswordUnknownEmail() throws Exception {
        String body = "{\"email\": \"unknown@notreal.com\"}";

        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If the email exists, a password reset link has been sent."));
    }

    // 3. Request with missing email -> 400
    @Test
    void forgotPasswordMissingEmail() throws Exception {
        String body = "{}";

        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email is required"));
    }

    // 4. Successful password reset with valid token
    @Test
    void resetPasswordSuccess() throws Exception {
        // Create a reset token directly
        String rawToken = java.util.UUID.randomUUID().toString();
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        PasswordResetToken token = new PasswordResetToken(rawToken, user, LocalDateTime.now().plusHours(1));
        passwordResetTokenRepository.save(token);

        String newPassword = "newSecure456";
        String body = "{\"token\": \"" + rawToken + "\", \"newPassword\": \"" + newPassword + "\"}";

        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully. You can now log in with your new password."));

        // Verify the token was deleted after use
        org.junit.jupiter.api.Assertions.assertTrue(
                passwordResetTokenRepository.findByTokenHash(rawToken).isEmpty(),
                "Token should be deleted after successful reset");

        // Verify the password was actually changed
        User updatedUser = userRepository.findByEmail(userEmail).orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(
                passwordEncoder.matches(newPassword, updatedUser.getPassword()),
                "Password should be updated to the new value");
    }

    // 5. Login with new password after reset
    @Test
    void loginWithNewPasswordAfterReset() throws Exception {
        // Reset the password
        String rawToken = java.util.UUID.randomUUID().toString();
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        PasswordResetToken token = new PasswordResetToken(rawToken, user, LocalDateTime.now().plusHours(1));
        passwordResetTokenRepository.save(token);

        String newPassword = "newSecure456";
        String resetBody = "{\"token\": \"" + rawToken + "\", \"newPassword\": \"" + newPassword + "\"}";
        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetBody))
                .andExpect(status().isOk());

        // Login with new password
        String loginBody = "{\"email\": \"" + userEmail + "\", \"password\": \"" + newPassword + "\"}";
        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());

        // Old password should no longer work
        String oldLoginBody = "{\"email\": \"" + userEmail + "\", \"password\": \"" + originalPassword + "\"}";
        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(oldLoginBody))
                .andExpect(status().isUnauthorized());
    }

    // 6. Expired token -> 400
    @Test
    void resetPasswordExpiredToken() throws Exception {
        // Create an already-expired token
        String rawToken = java.util.UUID.randomUUID().toString();
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        PasswordResetToken token = new PasswordResetToken(rawToken, user, LocalDateTime.now().minusHours(1));
        passwordResetTokenRepository.save(token);

        String body = "{\"token\": \"" + rawToken + "\", \"newPassword\": \"newpass123\"}";

        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or expired reset token"));
    }

    // 7. Invalid token -> 400
    @Test
    void resetPasswordInvalidToken() throws Exception {
        String body = "{\"token\": \"nonexistent-token-12345\", \"newPassword\": \"newpass123\"}";

        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or expired reset token"));
    }

    // 8. Token reuse blocked (already used token)
    @Test
    void resetPasswordTokenReuseBlocked() throws Exception {
        // Create and use a token
        String rawToken = java.util.UUID.randomUUID().toString();
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        PasswordResetToken token = new PasswordResetToken(rawToken, user, LocalDateTime.now().plusHours(1));
        passwordResetTokenRepository.save(token);

        String newPassword = "newSecure456";
        String body = "{\"token\": \"" + rawToken + "\", \"newPassword\": \"" + newPassword + "\"}";

        // First use -> success
        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        // Second use with same token -> should fail (token was deleted)
        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or expired reset token"));
    }

    // 9. Missing token -> 400
    @Test
    void resetPasswordMissingToken() throws Exception {
        String body = "{\"newPassword\": \"newpass123\"}";

        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Reset token is required"));
    }

    // 10. Missing new password -> 400
    @Test
    void resetPasswordMissingNewPassword() throws Exception {
        String body = "{\"token\": \"some-token\"}";

        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("New password is required"));
    }

    // 11. Password too short -> 400
    @Test
    void resetPasswordTooShort() throws Exception {
        String body = "{\"token\": \"some-token\", \"newPassword\": \"abc\"}";

        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Password must be at least 6 characters"));
    }

    // 12. Forgot password replaces existing token (only one active at a time)
    @Test
    void forgotPasswordReplacesExistingToken() throws Exception {
        String body = "{\"email\": \"" + userEmail + "\"}";

        // First request
        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        User user = userRepository.findByEmail(userEmail).orElseThrow();
        PasswordResetToken firstToken = passwordResetTokenRepository.findByUser(user).orElseThrow();
        String firstTokenHash = firstToken.getTokenHash();

        // Second request should replace the first token
        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        PasswordResetToken secondToken = passwordResetTokenRepository.findByUser(user).orElseThrow();
        org.junit.jupiter.api.Assertions.assertNotEquals(firstTokenHash, secondToken.getTokenHash(),
                "Second request should generate a new token");

        // Old token should no longer be valid
        org.junit.jupiter.api.Assertions.assertTrue(
                passwordResetTokenRepository.findByTokenHash(firstTokenHash).isEmpty(),
                "Old token should be deleted");
    }
}
