-- Flyway migration V5: password_reset_tokens table (audit-capable)
--
-- Design: SHA-256(token) is stored for deterministic O(1) lookup.
-- Rows are retained after use (used_at set, not deleted) for audit.
-- Multiple rows per user allowed; only one should be active at a time.
--
-- Safety: V1__init.sql may have already created a password_reset_tokens table
-- with a different schema (BIGSERIAL, VARCHAR(255), UNIQUE(user_id), expiry).
-- Drop it if present so this migration is idempotent.

DROP TABLE IF EXISTS password_reset_tokens;

CREATE TABLE password_reset_tokens (
    id                 BIGINT   NOT NULL AUTO_INCREMENT PRIMARY KEY,
    token_hash_sha256  CHAR(64) NOT NULL,                          -- SHA-256 hex = exactly 64 chars
    user_id            BIGINT   NOT NULL,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at         TIMESTAMP NOT NULL,
    used_at            TIMESTAMP NULL DEFAULT NULL,                -- NULL = not yet consumed

    CONSTRAINT fk_reset_token_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Deterministic lookup by SHA-256 hash
CREATE UNIQUE INDEX idx_reset_tokens_sha256
    ON password_reset_tokens (token_hash_sha256);

-- Query support: find active tokens for a user
CREATE INDEX idx_reset_tokens_user_active
    ON password_reset_tokens (user_id, used_at, expires_at);
