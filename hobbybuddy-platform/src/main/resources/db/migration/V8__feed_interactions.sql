-- Flyway migration V8: post_likes + comments tables for the trustworthy feed
-- Additive only; no existing tables are altered.

CREATE TABLE post_likes (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    post_id    BIGINT       NOT NULL,
    user_id    BIGINT       NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_post_like_post
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_like_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- A user can have at most one like on a given post (no duplicates)
    CONSTRAINT uq_post_likes UNIQUE (post_id, user_id)
);

-- Fast look-ups of likes for a post (feed counts)
CREATE INDEX idx_post_likes_post ON post_likes (post_id);

CREATE TABLE comments (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    post_id    BIGINT       NOT NULL,
    author_id  BIGINT       NOT NULL,
    content    TEXT         NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_comment_post
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_author
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feed/thread reads are ordered by post then time
CREATE INDEX idx_comments_post ON comments (post_id, created_at);
