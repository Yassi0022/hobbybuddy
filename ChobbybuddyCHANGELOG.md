# Changelog — HobbyBuddy

## P0 (Audit + Remediation)
- P0-GB: Playwright desktop/mobile PASS; health 200; console/network/CORS/WebSocket clean.
- P0-GC: .env untracked verified; .env.example created (safe placeholders); SMTP typo not found; AIVEN rotation manual completed.
- P0-GD: Health endpoint 200 x3 (post-wake); .env untracked; docs updated.
- P0-GE: Health endpoint 200 x3 post-wake; service awake.

## P1 (Features + Auth)
- P1-GA: Email proposal delivered; render.yaml EMAIL_ENABLED=true; proposal B (SMTP console vars) proposed.
- P1-GB: Full auth audit PASS; protected routes verified; Playwright desktop/mobile PASS; health [200/200/200].
- P1-GC: SecurityConfig auth fix (/dashboard protected); render.yaml G1GC optimization; application-prod.properties verification restored (line 76=true); 404/500/faq/help created.

## P2 (Launch + Verification)
- P2-GB: Deploy verification truthful (health 000 warm-up; frontend 200; Playwright PASS); LAUNCH_README.md + LAUNCH_ANNOUNCEMENT.md updated.
- P2-GC: Step-by-step cron-job.org guide delivered; manual steps preserved; no automated account creation.
- P2-GD: LAUNCH_CHECKLIST.md, LAUNCH_METRICS.md, LAUNCH_FAQ.md updated/created.
- P2-GE (in progress): UI/UX polish (animations, skeletons, toasts, dark mode, responsive), SEO (sitemap/robots/structured data), error pages verified, FAQ/contact created, performance recommendations, analytics verified, security/compliance documented, testing truthful, docs complete.

## P2-GE (Sections 7-9)
- Section 7: Email templates (welcome, password reset, notification friend request, notification new message, notification event invitation) — 5 HTML templates in email_templates/.
- Section 8: Social features — ShareProfile.jsx (copy link + social buttons), InviteFriends.jsx (email invite form + personalized message), SocialShare.jsx (Twitter/Facebook/LinkedIn/WhatsApp links with pre-filled message).
- Section 9: Onboarding — WelcomeTour.jsx (4-step guided tour with overlay and close), ProfileProgress.jsx (completion % progress bar + suggestions).
