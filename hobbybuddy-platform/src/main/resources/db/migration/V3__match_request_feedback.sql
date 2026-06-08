-- Flyway migration V3: match_request_feedback table
-- Stores post-activity feedback (rating + comment) from match participants.

CREATE TABLE match_request_feedback (
    id               BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    match_request_id BIGINT       NOT NULL,
    author_id        BIGINT       NOT NULL,
    rating           INT          NOT NULL,
    comment          TEXT,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_match_request
        FOREIGN KEY (match_request_id) REFERENCES match_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_author
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,

    -- One feedback per user per match request
    CONSTRAINT uq_feedback_per_user
        UNIQUE (match_request_id, author_id),

    -- Rating between 1 and 5
    CONSTRAINT chk_feedback_rating
        CHECK (rating BETWEEN 1 AND 5)
);

-- Index for lookups by match request
CREATE INDEX idx_feedback_match_request ON match_request_feedback (match_request_id);
