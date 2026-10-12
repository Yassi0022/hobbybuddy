-- Flyway migration V1: initial schema for HobbyBuddy
-- This migration creates the core tables used by the application.

CREATE TABLE users (
    id AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    password VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    openness DOUBLE PRECISION,
    conscientiousness DOUBLE PRECISION,
    extraversion DOUBLE PRECISION,
    agreeableness DOUBLE PRECISION,
    neuroticism DOUBLE PRECISION,
    archetype VARCHAR(255),
    referred_by BIGINT,
    referral_count INT NOT NULL DEFAULT 0,
    hobbies TEXT,
    prompt1 TEXT,
    prompt2 TEXT,
    prompt3 TEXT,
    city VARCHAR(255),
    age INT,
    personality_tagline VARCHAR(255),
    photos_json TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_referred_by FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE password_reset_tokens (
    id AUTO_INCREMENT PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL UNIQUE,
    expiry TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Additional tables (simplified) for other entities – these can be expanded later.
CREATE TABLE posts (
    id AUTO_INCREMENT PRIMARY KEY,
    author_id BIGINT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE events (
    id AUTO_INCREMENT PRIMARY KEY,
    created_by_id BIGINT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    start_time TIMESTAMP WITHOUT TIME ZONE,
    end_time TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_event_creator FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT,
    sent_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE hobbies (
    id AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255),
    CONSTRAINT fk_hobby_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
