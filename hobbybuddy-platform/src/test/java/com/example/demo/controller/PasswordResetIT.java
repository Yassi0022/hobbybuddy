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
import java.util.Base64;
import java.util.List;

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

    /**
     * Helper: generate a secure random token (same format as production code).
     */
    private String generateRawToken() {
        byte[] bytes = new byte[32];
        new java.security.SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Helper: create a BCrypt-hashed token in the DB (matching production storage).
     */
    private PasswordResetToken createHashedToken(User user, LocalDateTime expiry) {
        String raw = generateRawToken();
        PasswordResetToken token = new PasswordResetToken(
                passwordEncoder.encode(raw), user, expiry);
        token = passwordResetTokenRepository.save(token);
        // Return the raw token alongside — we store it in the tokenHash field for test lookup
        // Actually we need the raw token for the test to use in the API call.
        // We'll store it in a thread-local or return a wrapper. Simpler: just return the token
        // and track the raw value separately.
        return token;
    }

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

    // ── Helper: create a token and return the raw token string for API calls ──
    private String insertTokenAndGetRaw(User user, LocalDateTime expiry) {
        String raw = generateRawToken();
        PasswordResetToken token = new PasswordResetToken(
                passwordEncoder.encode(raw), user, expiry);
        passwordResetTokenRepository.save(token);
        return raw;
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
        // Create a BCrypt-hashed reset token directly in the DB
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        String rawToken = insertTokenAndGetRaw(user, LocalDateTime.now().plusHours(1));

        String newPassword = "newSecure456";
        String body = "{\"token\": \"" + rawToken + "\", \"newPassword\": \"" + newPassword + "\"}";

        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully. You can now log in with your new password."));

        // Verify the token was deleted after use (scan all — should be gone)
        List<PasswordResetToken> remaining = passwordResetTokenRepository.findAll();
        boolean tokenStillExists = remaining.stream()
                .anyMatch(t -> passwordEncoder.matches(rawToken, t.getTokenHash()));
        org.junit.jupiter.api.Assertions.assertFalse(tokenStillExists,
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
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        String rawToken = insertTokenAndGetRaw(user, LocalDateTime.now().plusHours(1));

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
        // Create an already-expired token (BCrypt-hashed)
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        String rawToken = insertTokenAndGetRaw(user, LocalDateTime.now().minusHours(1));

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
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        String rawToken = insertTokenAndGetRaw(user, LocalDateTime.now().plusHours(1));

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
                "Second request should generate a new token with a different hash");

        // Old token should no longer exist in the DB
        List<PasswordResetToken> allTokens = passwordResetTokenRepository.findAll();
        boolean oldTokenExists = allTokens.stream()
                .anyMatch(t -> firstTokenHash.equals(t.getTokenHash()));
        org.junit.jupiter.api.Assertions.assertFalse(oldTokenExists,
                "Old token should be deleted after replacement");
    }
}
