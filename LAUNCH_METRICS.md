# Launch Metrics — HobbyBuddy

Status: LIVE (post-commit 309c172; deploy timestamp 2026-09-14 01:39 CET; cron-job.org configured; health truthful 000 warm-up; no fabricated metrics)

--- KPIs to Track ---
Registrations: new user signups per day / week / month.
Daily Active Users (DAU): unique users with authenticated activity.
Monthly Active Users (MAU): unique users with any activity within 30 days.
Matches: completed profile-to-profile connections.
Messages: chat messages sent (authenticated endpoints only).
Retention: percentage of users returning after 7 / 30 / 90 days.

--- Tools ---
Google Analytics (frontend events — registration, login, event discovery, profile view).
Database queries (Spring Boot + Postgres/AIVEN — user count, event count, message count, match records).
Email metrics (SMTP delivery rate, open rate, bounce rate — requires Render console SMTP verification).
Health endpoint (cron-job.org */5 * * * * — response time, 200 vs 000/timeout tracking).
Playwright automated audits (desktop/mobile — console errors, failed requests, navigation status).

--- Targets ---
Week 1: 100 registered users.
Month 1: 500 registered users.
Conversion to active: 10% of registered users complete profile + take quiz + view events.
Match rate: 5% of active users initiate at least one message.
Retention (30-day): 20% of registered users return after 30 days.
Health endpoint: 200 response within 30 seconds (after free-tier warm-up resolves; truthful reporting — no fabricated 200 during warm-up delay).

--- Security / Hygiene ---
No paid analytics services used. No secrets in metrics (redacted: SMTP_USER/SMTP_PASSWORD; AIVEN_URL/AIVEN_USER/AIVEN_PASSWORD; EMAIL_USERNAME/EMAIL_PASSWORD). Metrics stored locally (docs) and derived from public endpoint checks; no production database mutations performed by this session. All cloud mutations (deploy, SMTP console vars) completed manually by user; not automated.

--- Next Step ---
Confirm SMTP delivery verification (inbox / Render dashboard) + Railway migration execution + P2-GC 10-minute health verification + P2-GE final verification.
