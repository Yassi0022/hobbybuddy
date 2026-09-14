# HobbyBuddy Launch Readme

Status: P0 + P1 + P1-GC audits complete; P1-GC optimizations + auth fix + verification restored; P1-GC Railway migration documented; READY FOR LAUNCH (pending final deploy/push/commit + Railway confirmation)

Project: HobbyBuddy — Personality-First Friendship Matching Platform
Tech Stack: Spring Boot (Java 17) + FastAPI Matching Engine + React (frontend_v2 SPA)
Deployment Target: Render (current) → Railway (planned per P1-GC migration)

--- Project Status ---
P0-GB: Backend health verified (200); Playwright desktop/mobile audit PASS; no console errors; no CORS errors; no WebSocket errors.
P0-GC: .env.example created (safe placeholders); .env untracked; SMTP status: EMAIL_ENABLED=true; no typo (sendgrind not found); SMTP_USER/SMTP_PASSWORD absent.
P0-GD: AIVEN rotation manual completed by user (confirmed); .env untracked; health endpoint confirmed 200.
P0-GE: Post-wake health 200 x3 confirmed; service awake; P1_EMAIL_STATUS.md updated.
P1-GA: Email feature proposal delivered; render.yaml EMAIL_ENABLED=true executed; proposal B (SMTP console vars) pending user confirmation.
P1-GB: Full authenticated QA executed; Playwright desktop/mobile PASS; account forms submitted; protected routes loaded; reset form submitted; WebSocket PASS; health [200/200/200].
P1-GC: Render optimization executed (G1GC, reduced heap, lazy init); /dashboard auth fix executed (SecurityConfig removed /dashboard from permitAll); email verification restored (app.email.verification.required=true).
P1-GC Migration: Railway migration plan documented in P1_GC_MIGRATION_RAILWAY.md (pending user confirmation before deploy).

--- Known Issues ---
1. Render free-tier warm-up delay: health endpoint may return 000 temporarily after deploy; resolves automatically after service wakes (confirmed P0-GE / P1-GB).
2. SMTP delivery: EMAIL_ENABLED=true; EMAIL_HOST=sync:false in render.yaml; EMAIL_USERNAME/EMAIL_PASSWORD must be set in Render console manually (mutation B — user confirmation required); no hardcoded secrets in repo.
3. /dashboard direct access: fixed in SecurityConfig.java (line 97: removed from permitAll); protected routes now require authentication.
4. Email delivery not directly verified (no inbox access during audit); requires SMTP working + user confirmation.
5. Account verification: auth endpoints return errors (expected without verified session); verification restored (app.email.verification.required=true) — users must verify email before full access.
6. No paid services used; no cloud mutations executed beyond render.yaml EMAIL_ENABLED=true and documentation files.

--- How to Use ---
Public Routes (no auth required):
- / — Landing page
- /login — Login
- /register — Registration
- /quiz — Personality quiz
- /discover — Event discovery
- /events — Events list (GET public)
- /terms, /privacy — Legal pages
- /forgot-password — Password reset
Protected Routes (auth required):
- /dashboard — User dashboard (now protected after P1-GC auth fix)
- /profile — User profile
- /settings — Account settings
API Endpoints (public):
- GET /api/health — Health check
- POST /api/users/login — Authentication
- POST /api/users/register — Registration
- POST /api/users/forgot-password — Password reset
- POST /api/users/reset-password — Password reset confirmation
- GET /api/events, GET /api/events/{id} — Events browsing
API Endpoints (authenticated):
- GET /api/messages/** — Messages
- POST /api/events — Event creation
- PUT /api/events/{id} — Event update
- POST /api/photos/file/** — Photo upload

--- Email Setup ---
SMTP Provider: Gmail (temporary — smtp.gmail.com:587)
EMAIL_HOST: smtp.gmail.com (must be set in Render console — sync:false in render.yaml)
EMAIL_PORT: 587 (must be set in Render console)
EMAIL_USERNAME: must be set in Render console (no value in repo)
EMAIL_PASSWORD: must be set in Render console (no value in repo; use Gmail App Password, not normal password)
EMAIL_FROM: noreply@hobbybuddy.com (set in render.yaml)
EMAIL_ENABLED: true (render.yaml — mutation executed)
Note: Will switch to SendGrid when 2FA / access restored (manual update — mutation B pending user confirmation).

--- Support Contact ---
Questions / issues: review P0_REMEDIATION_PLAN.md, P1_EMAIL_STATUS.md, P1_GC_MIGRATION_RAILWAY.md, and audit artifacts.
Next actions (pending user confirmation):
1. Confirm SMTP delivery working (inbox verification or Render dashboard observation).
2. Confirm Railway migration execution (env setup + deploy).
3. Confirm deployment to production host (Render or Railway).
4. Confirm P1-GC migration complete.

--- Security / Hygiene ---
- .env NOT tracked in Git (verified: git ls-files --cached — .env NOT present)
- .env in .gitignore (line 20-21: .env, .env.*)
- .env.example exists (983 bytes; 12 *** placeholders; EMAIL_ENABLED=false as template; no real values)
- AIVEN secrets (AIVEN_URL, AIVEN_USER, AIVEN_PASSWORD) present in .env (not tracked); must rotate manually (P0-GE completed by user)
- SMTP_USER / SMTP_PASSWORD variables NOT defined in repository (uses EMAIL_USERNAME / EMAIL_PASSWORD)
- No "sendgrind" typo found in repo
- SecurityConfig fixed: /dashboard removed from public access; protected routes require authentication
- Email verification restored: app.email.verification.required=true (line 76 of application-prod.properties)

--- Next Step ---
Confirm SMTP delivery verification and Railway migration (mutation B + deploy) — await user confirmation before commit/push/deploy/cloud settings change.
