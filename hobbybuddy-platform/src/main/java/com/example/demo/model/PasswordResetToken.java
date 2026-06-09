package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * One-time password reset token audit record.
 *
 * <p>Lifecycle:
 * <ol>
 *   <li>Created with {@code tokenHashSha256} = SHA-256(rawToken), {@code expiresAt} = now + 1h</li>
 *   <li>Raw token is sent by email only — never stored</li>
 *   <li>On successful reset: {@code usedAt} is set, row is retained for audit</li>
 *   <li>Expired/unused rows can be purged by a background job (not implemented)</li>
 * </ol>
 *
 * <p>Multiple rows per user are allowed (history). Only one should be active at a time
 * — enforced by the service layer which marks previous active tokens as used before
 * issuing a new one.
 */
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** SHA-256 hash of the raw token (hex-encoded). Used for deterministic lookup. */
    @Column(name = "token_hash_sha256", nullable = false, length = 64)
    private String tokenHashSha256;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Set when the token is consumed. {@code null} means the token has not been used.
     * A token is valid only if {@code usedAt == null} AND {@code expiresAt > now}.
     */
    @Column(name = "used_at")
    private LocalDateTime usedAt;

    public PasswordResetToken() {}

    public PasswordResetToken(String tokenHashSha256, User user, LocalDateTime expiresAt) {
        this.tokenHashSha256 = tokenHashSha256;
        this.user = user;
        this.expiresAt = expiresAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── Getters ────────────────────────────────────────────────────────

    public Long getId() { return id; }
    public String getTokenHashSha256() { return tokenHashSha256; }
    public User getUser() { return user; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public LocalDateTime getUsedAt() { return usedAt; }

    // ── Business helpers ───────────────────────────────────────────────

    /** Mark this token as consumed (one-time use). */
    public void markUsed() {
        this.usedAt = LocalDateTime.now();
    }

    /** @return true if this token has been consumed. */
    public boolean isUsed() {
        return this.usedAt != null;
    }

    /** @return true if this token has expired (regardless of use status). */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }

    /** @return true if this token is currently valid (not used, not expired). */
    public boolean isActive() {
        return !isUsed() && !isExpired();
    }
}
