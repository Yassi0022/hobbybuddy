-- Flyway migration V4: invite_tokens table + priority flag on users

-- Add priority match flag to users
ALTER TABLE users
    ADD COLUMN priority_match_available BOOLEAN NOT NULL DEFAULT FALSE;

-- Invite tokens for referral flow
CREATE TABLE invite_tokens (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    inviter_id BIGINT       NOT NULL,
    expiry     TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_invite_inviter
        FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_invite_tokens_inviter ON invite_tokens (inviter_id);
