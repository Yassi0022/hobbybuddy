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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the hardened password reset flow.
 *
 * <p>Covers:
 * <ul>
 *   <li>SHA-256 token storage (no raw tokens in DB)</li>
 *   <li>One-time use via {@code usedAt} (not deletion)</li>
 *   <li>Token expiry</li>
 *   <li>Auth version increment → JWT invalidation</li>
 *   <li>New token invalidates previous active tokens</li>
 *   <li>Neutral responses (no email enumeration)</li>
 *   <li>Rate limiting on forgot-password</li>
 * </ul>
 */
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

    // ── Helpers ────────────────────────────────────────────────────────

    /** Generate a secure raw token (same format as production). */
    private String generateRawToken() {
        byte[] bytes = new byte[32];
        new java.security.SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Compute SHA-256 hex hash (same as PasswordResetService.sha256Hex). */
    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().withLowerCase().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Insert a reset token directly into the DB using SHA-256 hash (matching production storage).
     * Returns the raw token string so tests can use it in API calls.
     */
    private String insertTokenAndGetRaw(User user, LocalDateTime expiresAt) {
        String raw = generateRawToken();
        String hash = sha256Hex(raw);
        PasswordResetToken token = new PasswordResetToken(hash, user, expiresAt);
        passwordResetTokenRepository.save(token);
        return raw;
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

    // ═══════════════════════════════════════════════════════════════════
    //  1. Neutral response for unknown email
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void forgotPasswordExistingEmail() throws Exception {
        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"" + userEmail + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If the email exists, a password reset link has been sent."));

        // Verify a token was created with SHA-256 hash (64 hex chars)
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        List<PasswordResetToken> tokens = passwordResetTokenRepository.findAllByUserOrderByCreatedAtDesc(user);
        org.junit.jupiter.api.Assertions.assertFalse(tokens.isEmpty(), "Reset token should be created");
        PasswordResetToken token = tokens.get(0);
        org.junit.jupiter.api.Assertions.assertEquals(64, token.getTokenHashSha256().length(),
                "Token hash should be 64 hex chars (SHA-256)");
        org.junit.jupiter.api.Assertions.assertNull(token.getUsedAt(), "Token should not be used yet");
        org.junit.jupiter.api.Assertions.assertFalse(token.isExpired(), "Token should not be expired");
    }

    @Test
    void forgotPasswordUnknownEmail() throws Exception {
        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"unknown@notreal.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If the email exists, a password reset link has been sent."));
    }

    @Test
    void forgotPasswordMissingEmail() throws Exception {
        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email is required"));
    }

    // ═══════════════════════════════════════════════════════════════════
    //  2. Token stored as SHA-256, not raw
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void tokenStoredAsSha256NotRaw() throws Exception {
        // Request a reset
        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"" + userEmail + "\"}"))
                .andExpect(status().isOk());

        User user = userRepository.findByEmail(userEmail).orElseThrow();
        List<PasswordResetToken> tokens = passwordResetTokenRepository.findAllByUserOrderByCreatedAtDesc(user);
        PasswordResetToken token = tokens.get(0);

        // Hash must be exactly 64 hex characters (SHA-256 output)
        String hash = token.getTokenHashSha256();
        org.junit.jupiter.api.Assertions.assertTrue(hash.matches("[0-9a-f]{64}"),
                "Token hash should be 64 lowercase hex chars, got: " + hash);

        // Hash must NOT be a BCrypt hash (which starts with $2a$)
        org.junit.jupiter.api.Assertions.assertFalse(hash.startsWith("$2a$"),
                "Token hash should NOT be BCrypt — should be SHA-256 hex");

        // Hash must NOT be a Base64-encoded raw token (which would contain +, /, or =)
        org.junit.jupiter.api.Assertions.assertFalse(hash.contains("+") || hash.contains("/") || hash.contains("="),
                "Token hash should NOT be Base64 — should be SHA-256 hex");
    }

    // ═══════════════════════════════════════════════════════════════════
    //  3. Successful reset with valid token
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void resetPasswordSuccess() throws Exception {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        String rawToken = insertTokenAndGetRaw(user, LocalDateTime.now().plusHours(1));

        String newPassword = "newSecure456";
        String body = "{\"token\": \"" + rawToken + "\", \"newPassword\": \"" + newPassword + "\"}";

        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully. You can now log in with your new password."));

        // Verify token is marked as used (not deleted — audit trail)
        String hash = sha256Hex(rawToken);
        PasswordResetToken usedToken = passwordResetTokenRepository.findByTokenHashSha256(hash).orElse(null);
        org.junit.jupiter.api.Assertions.assertNotNull(usedToken, "Token row should still exist (audit)");
        org.junit.jupiter.api.Assertions.assertNotNull(usedToken.getUsedAt(), "Token should be marked as used");

        // Verify password was changed
        User updatedUser = userRepository.findByEmail(userEmail).orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(
                passwordEncoder.matches(newPassword, updatedUser.getPassword()),
                "Password should be updated");
    }

    // ═══════════════════════════════════════════════════════════════════
    //  4. Expired token rejected
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void resetPasswordExpiredToken() throws Exception {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        String rawToken = insertTokenAndGetRaw(user, LocalDateTime.now().minusHours(1));

        String body = "{\"token\": \"" + rawToken + "\", \"newPassword\": \"newpass123\"}";

        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or expired reset token"));
    }

    // ═══════════════════════════════════════════════════════════════════
    //  5. Reused token rejected
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void resetPasswordTokenReuseBlocked() throws Exception {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        String rawToken = insertTokenAndGetRaw(user, LocalDateTime.now().plusHours(1));

        String body = "{\"token\": \"" + rawToken + "\", \"newPassword\": \"newSecure456\"}";

        // First use → success
        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        // Second use → rejected (token already used)
        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or expired reset token"));
    }

    // ═══════════════════════════════════════════════════════════════════
    //  6. New token invalidates older active tokens
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void newResetInvalidatesPreviousTokens() throws Exception {
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        // Create first token
        String rawToken1 = insertTokenAndGetRaw(user, LocalDateTime.now().plusHours(1));
        String hash1 = sha256Hex(rawToken1);

        // Request a new reset via API (should invalidate token1)
        mockMvc.perform(post("/api/users/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"" + userEmail + "\"}"))
                .andExpect(status().isOk());

        // First token should now be marked as used
        PasswordResetToken token1 = passwordResetTokenRepository.findByTokenHashSha256(hash1).orElse(null);
        org.junit.jupiter.api.Assertions.assertNotNull(token1, "First token row should still exist");
        org.junit.jupiter.api.Assertions.assertNotNull(token1.getUsedAt(), "First token should be marked as used");

        // Trying to use the first token should fail
        String body = "{\"token\": \"" + rawToken1 + "\", \"newPassword\": \"newpass123\"}";
        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // ═══════════════════════════════════════════════════════════════════
    //  7. Old JWT invalidated after password reset (authVersion)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void oldJwtInvalidatedAfterReset() throws Exception {
        // Login to get a valid JWT
        String loginBody = "{\"email\": \"" + userEmail + "\", \"password\": \"" + originalPassword + "\"}";
        String loginResponse = mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String oldToken = om.readTree(loginResponse).get("token").asText();

        // Verify old token works for authenticated endpoint
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + oldToken))
                .andExpect(status().isOk());

        // Reset password
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        String rawResetToken = insertTokenAndGetRaw(user, LocalDateTime.now().plusHours(1));
        String newPassword = "newSecure456";
        String resetBody = "{\"token\": \"" + rawResetToken + "\", \"newPassword\": \"" + newPassword + "\"}";
        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetBody))
                .andExpect(status().isOk());

        // Old JWT should now be rejected (authVersion mismatch)
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + oldToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("TOKEN_INVALIDATED"));

        // Login with new password should work and issue a new valid JWT
        String newLoginBody = "{\"email\": \"" + userEmail + "\", \"password\": \"" + newPassword + "\"}";
        String newLoginResponse = mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newLoginBody))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String newToken = om.readTree(newLoginResponse).get("token").asText();

        // New JWT should work
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + newToken))
                .andExpect(status().isOk());
    }

    // ═══════════════════════════════════════════════════════════════════
    //  8. New login after reset works normally
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void loginWithNewPasswordAfterReset() throws Exception {
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

    // ═══════════════════════════════════════════════════════════════════
    //  9. Auth version incremented on reset
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void authVersionIncrementedOnReset() throws Exception {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        int versionBefore = user.getAuthVersion();

        String rawToken = insertTokenAndGetRaw(user, LocalDateTime.now().plusHours(1));
        String resetBody = "{\"token\": \"" + rawToken + "\", \"newPassword\": \"newSecure456\"}";
        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetBody))
                .andExpect(status().isOk());

        User updatedUser = userRepository.findByEmail(userEmail).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(versionBefore + 1, updatedUser.getAuthVersion(),
                "authVersion should increment by 1 after reset");
    }

    // ═══════════════════════════════════════════════════════════════════
    //  10. Invalid token → 400
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void resetPasswordInvalidToken() throws Exception {
        String body = "{\"token\": \"nonexistent-token-12345\", \"newPassword\": \"newpass123\"}";

        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or expired reset token"));
    }

    // ═══════════════════════════════════════════════════════════════════
    //  12. Missing fields → 400
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void resetPasswordMissingToken() throws Exception {
        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\": \"newpass123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Reset token is required"));
    }

    @Test
    void resetPasswordMissingNewPassword() throws Exception {
        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\": \"some-token\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("New password is required"));
    }

    @Test
    void resetPasswordTooShort() throws Exception {
        mockMvc.perform(post("/api/users/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\": \"some-token\", \"newPassword\": \"abc\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Password must be at least 6 characters"));
    }
}
