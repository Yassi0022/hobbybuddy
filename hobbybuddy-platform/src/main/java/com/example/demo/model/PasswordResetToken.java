package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * One-time password reset token.
 * The raw token is sent via email; only a BCrypt hash is stored in the database.
 * Tokens expire after a configurable period and are single-use (deleted on consumption).
 */
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** BCrypt hash of the raw token string. */
    @Column(nullable = false)
    private String tokenHash;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiry;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public PasswordResetToken() {}

    public PasswordResetToken(String tokenHash, User user, LocalDateTime expiry) {
        this.tokenHash = tokenHash;
        this.user = user;
        this.expiry = expiry;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
    public User getUser() { return user; }
    public LocalDateTime getExpiry() { return expiry; }
    public void setExpiry(LocalDateTime expiry) { this.expiry = expiry; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
