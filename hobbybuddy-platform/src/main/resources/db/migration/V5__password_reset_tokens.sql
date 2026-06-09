-- Flyway migration V5: password_reset_tokens table

CREATE TABLE password_reset_tokens (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL,
    user_id    BIGINT       NOT NULL UNIQUE,
    expiry     TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reset_token_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reset_tokens_user ON password_reset_tokens (user_id);
