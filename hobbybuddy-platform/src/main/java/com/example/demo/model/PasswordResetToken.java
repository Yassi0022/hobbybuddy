package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Store a BCrypt hash of the token, never the raw value
    @Column(nullable = false)
    private String tokenHash;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiry;

    public PasswordResetToken() {}

    public PasswordResetToken(String tokenHash, User user, LocalDateTime expiry) {
        this.tokenHash = tokenHash;
        this.user = user;
        this.expiry = expiry;
    }

    public Long getId() { return id; }
    public String getTokenHash() { return tokenHash; }
    public User getUser() { return user; }
    public LocalDateTime getExpiry() { return expiry; }
    public void setExpiry(LocalDateTime expiry) { this.expiry = expiry; }
}
