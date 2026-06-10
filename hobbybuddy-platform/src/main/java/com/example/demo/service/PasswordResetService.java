package com.example.demo.service;

import com.example.demo.model.PasswordResetToken;
import com.example.demo.model.User;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Production-grade password reset service.
 *
 * <h3>Token design</h3>
 * <ul>
 *   <li>32 bytes from {@link SecureRandom} → Base64url → sent by email</li>
 *   <li>Only {@code SHA-256(rawToken)} is stored (hex-encoded, 64 chars)</li>
 *   <li>Lookup is O(1) via {@code token_hash_sha256} unique index</li>
 * </ul>
 *
 * <h3>Security properties</h3>
 * <ul>
 *   <li>One-time use: consumed tokens get {@code usedAt} set (not deleted — audit trail)</li>
 *   <li>Expiry: 1 hour from creation</li>
 *   <li>User-bound: token is tied to a specific user</li>
 *   <li>Invalidation: requesting a new reset marks all previous active tokens as used</li>
 *   <li>JWT invalidation: {@code authVersion} is incremented on the user, invalidating all prior JWTs</li>
 *   <li>Neutral responses: no information leakage about account existence</li>
 *   <li>No sensitive values in logs</li>
 * </ul>
 */
@Service
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int TOKEN_BYTES = 32;
    private static final int TOKEN_EXPIRY_HOURS = 1;

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final String emailFrom;
    private final String frontendUrl;

    @Autowired
    public PasswordResetService(
            PasswordResetTokenRepository tokenRepository,
            UserRepository userRepository,
            JavaMailSender mailSender,
            @Value("${app.email.from:noreply@hobbybuddy.com}") String emailFrom,
            @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.emailFrom = emailFrom;
        this.frontendUrl = frontendUrl;
    }

    // ── Public API ─────────────────────────────────────────────────────

    /**
     * Request a password reset for the given email.
     *
     * <p><b>Always returns {@code true}</b> regardless of whether the email exists in the system.
     * This prevents email enumeration attacks.
     *
     * @param email the email requesting a password reset
     * @return always {@code true} (neutral response)
     */
    @Transactional
    public boolean requestReset(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Neutral: do not reveal that the email doesn't exist
            logger.info("[PASSWORD_RESET] Request for unknown email — neutral response returned");
            return true;
        }

        // Invalidate all previous active tokens for this user
        int invalidated = tokenRepository.markAllActiveAsUsed(user);
        if (invalidated > 0) {
            logger.info("[PASSWORD_RESET] Invalidated {} previous active token(s) for user {}", invalidated, user.getId());
        }

        // Generate new token
        String rawToken = generateSecureToken();
        String sha256Hash = sha256Hex(rawToken);

        PasswordResetToken token = new PasswordResetToken(
                sha256Hash,
                user,
                LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS)
        );
        tokenRepository.save(token);

        // Send email (best-effort — never fail the request if email fails)
        sendResetEmail(user.getEmail(), rawToken);

        logger.info("[PASSWORD_RESET] Reset token created for user {}", user.getId());
        return true;
    }

    /**
     * Reset a user's password using a raw reset token.
     *
     * @param rawToken    the raw token from the email link
     * @param newPassword the new password (plaintext — will be encoded by the caller)
     * @return result indicating success or the specific failure reason
     */
    @Transactional
    public ResetResult resetPassword(String rawToken, String newPassword) {
        String sha256Hash = sha256Hex(rawToken);

        PasswordResetToken token = tokenRepository.findByTokenHashSha256(sha256Hash).orElse(null);

        if (token == null) {
            logger.info("[PASSWORD_RESET] Token not found (hash prefix: {}...)", sha256Hash.substring(0, 8));
            return ResetResult.INVALID_TOKEN;
        }

        if (token.isUsed()) {
            logger.info("[PASSWORD_RESET] Token {} already used for user {}", token.getId(), token.getUser().getId());
            return ResetResult.TOKEN_REUSED;
        }

        if (token.isExpired()) {
            logger.info("[PASSWORD_RESET] Token {} expired for user {}", token.getId(), token.getUser().getId());
            return ResetResult.TOKEN_EXPIRED;
        }

        // Mark token as consumed (one-time use, audit trail)
        token.markUsed();
        tokenRepository.save(token);

        // Update password and increment auth version to invalidate all existing JWTs
        User user = token.getUser();
        user.setPassword(newPassword); // caller must encode
        user.incrementAuthVersion();
        userRepository.save(user);

        logger.info("[PASSWORD_RESET] Password reset successful for user {} — authVersion now {}",
                user.getId(), user.getAuthVersion());

        return ResetResult.SUCCESS;
    }

    // ── Email ──────────────────────────────────────────────────────────

    private void sendResetEmail(String to, String rawToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + rawToken;
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(emailFrom);
            msg.setTo(to);
            msg.setSubject("Reset your password");
            msg.setText("Click the link to reset your password:\n"
                    + resetLink
                    + "\n\nThis link expires in 1 hour.\n"
                    + "If you did not request this, you can safely ignore this email.");
            mailSender.send(msg);
            logger.info("[PASSWORD_RESET] Reset email sent successfully to {}", to);
        } catch (Exception e) {
            // Never fail the request because of email issues — but log loudly
            // so operators know email is broken
            logger.error("[PASSWORD_RESET][EMAIL_FAILURE] Failed to send reset email to {} — {}: {}. "
                    + "Check EMAIL_HOST / EMAIL_PORT / EMAIL_USERNAME / EMAIL_PASSWORD.",
                    to, e.getClass().getSimpleName(), e.getMessage());
        }
    }

    // ── Token generation ───────────────────────────────────────────────

    /**
     * Generate a cryptographically secure random token.
     * 32 bytes from SecureRandom → Base64url (no padding) = ~43 chars.
     */
    private static String generateSecureToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        try {
            SecureRandom.getInstanceStrong().nextBytes(bytes);
        } catch (NoSuchAlgorithmException e) {
            new SecureRandom().nextBytes(bytes);
        }
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Compute SHA-256 hash and return as lowercase hex string (64 chars).
     * Package-visible so the controller can hash email verification tokens the same way.
     */
    public static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().withLowerCase().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is guaranteed to be available in all JVMs
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    // ── Result type ────────────────────────────────────────────────────

    public enum ResetResult {
        SUCCESS,
        INVALID_TOKEN,
        TOKEN_EXPIRED,
        TOKEN_REUSED
    }
}
