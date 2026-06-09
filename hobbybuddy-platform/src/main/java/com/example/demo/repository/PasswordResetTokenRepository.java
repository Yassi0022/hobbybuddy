package com.example.demo.repository;

import com.example.demo.model.PasswordResetToken;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * Find a token by its SHA-256 hash for deterministic O(1) lookup.
     */
    Optional<PasswordResetToken> findByTokenHashSha256(String tokenHashSha256);

    /**
     * Find all tokens for a user, ordered by creation time descending (newest first).
     * Used by the service to invalidate previous active tokens when a new one is requested.
     */
    List<PasswordResetToken> findAllByUserOrderByCreatedAtDesc(User user);

    /**
     * Mark all active (unused, unexpired) tokens for a user as used.
     * Returns the number of rows updated.
     */
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.usedAt = CURRENT_TIMESTAMP " +
           "WHERE t.user = :user AND t.usedAt IS NULL AND t.expiresAt > CURRENT_TIMESTAMP")
    int markAllActiveAsUsed(@Param("user") User user);

    /**
     * Count active tokens for cooldown checks.
     */
    @Query("SELECT COUNT(t) FROM PasswordResetToken t " +
           "WHERE t.user = :user AND t.usedAt IS NULL AND t.expiresAt > CURRENT_TIMESTAMP")
    long countActiveByUser(@Param("user") User user);
}
