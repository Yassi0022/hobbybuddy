-- Flyway migration V7: event_participants join table
--
-- Many-to-many relationship between events and users.
-- Composite primary key (event_id, user_id) enforces uniqueness
-- and satisfies MySQL sql_require_primary_key=ON.

CREATE TABLE event_participants (
    event_id BIGINT NOT NULL,
    user_id  BIGINT NOT NULL,

    PRIMARY KEY (event_id, user_id),

    CONSTRAINT fk_event_participants_event
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,

    CONSTRAINT fk_event_participants_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for fast lookups by user (find all events a user joined)
CREATE INDEX idx_event_participants_user
    ON event_participants (user_id);
