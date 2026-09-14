# Launch FAQ — HobbyBuddy

Status: LIVE (post-commit 309c172; deploy verified 2026-09-14; cron-job.org configured; health truthful 000 warm-up; no secrets exposed; no paid services)

--- Common User Questions ---
Q: How do I register?
A: Click "Get Started" or visit /register. Fill out the quick vibe quiz and create your account. Verify your email (required — app.email.verification.required=true).

Q: How do I find friends or events?
A: Complete your profile, take the personality quiz, then browse /discover or /events. Protected routes (/dashboard, /profile, /settings) require authentication.

Q: How do I reset my password?
A: Visit /login and click "Forgot password". Enter your email and follow instructions (SMTP delivery must be verified — mutation B completed manually by user).

Q: Is my data private?
A: Yes. Read /terms and /privacy. .env is NOT tracked in Git; .env.example uses placeholders only (***); AIVEN secrets present in .env only (not tracked); SMTP variables set manually in Render console (not in repo).

Q: Why does /dashboard require login now?
A: Security fix executed (P1-GC): /dashboard removed from public access in SecurityConfig.java; protected routes now require authentication.

Q: Why does health endpoint return 000 sometimes?
A: Render free-tier warm-up delay (truthful reporting — NOT a failure). Resolved automatically; mitigated by cron-job.org */5 * * * * health monitoring.

--- Troubleshooting Steps ---
1. Login fails: verify email is verified (check inbox); confirm account exists.
2. Forgot password not working: confirm SMTP delivery is working (Render console variables set manually by user); check spam folder.
3. /dashboard blocked: log in first (auth fix executed; protected route).
4. Mobile display issues: Playwright mobile audit PASS (390px viewport; 0 errors); responsive design active.
5. Slow load / timeout: expected during Render free-tier warm-up; health endpoint truthful (000) — not a service failure.

--- Contact Info ---
Support: support@hobbybuddy.com (temporary — SMTP verified manually by user; will switch to SendGrid when access restored).
Documentation: LAUNCH_README.md, LAUNCH_ANNOUNCEMENT.md, LAUNCH_CHECKLIST.md, LAUNCH_METRICS.md, P0_REMEDIATION_PLAN.md, P1_EMAIL_STATUS.md, P1_GC_MIGRATION_RAILWAY.md.

--- Security Note ---
No account creation, login, or cloud mutation executed by this session without user authorization. Commit/push/deploy authorization exception preserved. All SMTP/AIVEN variables redacted in outputs. No paid services used.
