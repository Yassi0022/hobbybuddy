-- Flyway migration V2: match_requests table
-- Stores one‑off buddy‑match requests between two users.

CREATE TABLE match_requests (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    requester_id BIGINT      NOT NULL,
    candidate_id BIGINT      NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_match_request_requester
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_match_request_candidate
        FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Prevent duplicate pending requests in the same direction
    CONSTRAINT uq_match_requests_pending
        UNIQUE (requester_id, candidate_id, status)
);

-- Index for fast look‑ups by candidate (incoming requests)
CREATE INDEX idx_match_requests_candidate ON match_requests (candidate_id, status);

-- Index for fast look‑ups by requester (outgoing requests)
CREATE INDEX idx_match_requests_requester ON match_requests (requester_id, status);
