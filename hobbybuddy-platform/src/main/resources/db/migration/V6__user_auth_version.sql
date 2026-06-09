-- Flyway migration V6: add auth_version to users for JWT invalidation
--
-- auth_version is incremented on every password change/reset.
-- The current value is embedded in JWT claims at login time.
-- On each authenticated request, the JWT's auth_version is compared
-- to the DB value — a mismatch means the token was issued before a
-- password change and must be rejected.

ALTER TABLE users
    ADD COLUMN auth_version INT NOT NULL DEFAULT 0;
