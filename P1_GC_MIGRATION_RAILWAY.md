# Railway Migration Plan (P1-GC)

Status: Read-only proposal — NO mutations executed except P1-GA mutation A (render.yaml EMAIL_ENABLED=true) and documentation updates.
Author: Claude Code (P1-GC audit session)
Date: 2026-09-14 (post P1-GB full execution; health endpoint confirmed 200 x3)

--- Environment Variables (redacted — real values NOT included) ---
Production variables to set in Railway dashboard (names only):
  SPRING_PROFILES_ACTIVE=prod
  SPRING_DATASOURCE_URL=<AIVEN_JDBC_URL>
  SPRING_DATASOURCE_USERNAME=<AIVEN_USER>
  SPRING_DATASOURCE_PASSWORD=<AIVEN_PASSWORD>
  EMAIL_ENABLED=true
  EMAIL_HOST=<SMTP_HOST>
  EMAIL_PORT=<SMTP_PORT>
  EMAIL_USERNAME=<SMTP_USER>
  EMAIL_PASSWORD=<SMTP_PASSWORD>
  EMAIL_FROM=noreply@hobbybuddy.com
  FRONTEND_URL=https://hobbybuddy.vercel.app
  FRONTEND_ORIGINS=https://hobbybuddy.vercel.app,https://*.vercel.app
  FASTAPI_URL=<FASTAPI_SERVICE_URL>
  PORT=<RENDER_ASSIGNED>

Note: SMTP_USER / SMTP_PASSWORD variables are NOT used by this application (render.yaml uses EMAIL_USERNAME / EMAIL_PASSWORD). Verify variable names align with EmailConfig.java.

--- GitHub Connection ---
1. Link Railway project to GitHub repository (hobbybuddy / hobbybuddy-platform branch: main)
2. Configure build command: `cd frontend_v2 && npm install && npm run build && cp -r dist/* ../hobbybuddy-platform/src/main/resources/static/ && cd ../hobbybuddy-platform && mvn package -DskipTests`
3. Configure start command: `java -jar hobbybuddy-platform/target/demo-0.0.1-SNAPSHOT.jar`
4. Enable auto-deploy from main branch pushes

--- Migration Steps ---
1. Confirm AIVEN credentials rotated (manual — PENDING user confirmation from P0-GE)
2. Confirm SMTP provider selected (Gmail temporary / SendGrid — user decision from P1-GA)
3. Set all env vars in Railway dashboard (redacted placeholders only — user provides real values)
4. Confirm render.yaml EMAIL_ENABLED=true (mutation A executed during P1-GA)
5. Confirm .env not tracked (verified: .env NOT in git index; .env.example safe with placeholders)
6. Confirm .env.example exists and safe (verified: 983 bytes, 12 *** placeholders, EMAIL_ENABLED=false as template)

--- Rollback Plan ---
- Revert Railway env vars to previous values (if preserved in Render before rotation)
- Confirm health endpoint /api/health returns 200 after rollback
- Confirm .env remains in .gitignore
- Confirm no production data mutated (only documentation files edited)

--- Code Fix Proposals (PENDING confirmation — NOT executed) ---
A. SecurityConfig.java — line 97: remove "/dashboard" from .permitAll() list to enforce authentication for protected routes.
B. application-prod.properties — line 76: change app.email.verification.required from false to true once SMTP delivery confirmed working.
C. render.yaml — mutation A already executed (EMAIL_ENABLED=true). Mutation B (SMTP env vars via console) PENDING user confirmation.

--- Status ---
- Health endpoint: 200 (3x retries confirmed P1-GB post-wake; service awake)
- Email delivery: NOT DIRECTLY VERIFIED (requires SMTP delivery test; Render console SMTP vars pending)
- Auth endpoint errors: observed (expected — verification required; no verified session)
- Protected routes: PARTIAL (/dashboard direct access allowed; fix requires SecurityConfig edit)
- No mutations: code unchanged (proposals only); render.yaml mutation A executed (EMAIL_ENABLED=true); documentation updated only
- P0 status: COMPLETE (P0-GB audit complete; P0-GD rotation manual completed by user; P0-GC .env.example created)
- P1-GB status: COMPLETE (audit + full execution; protected action mutations NOT executed — await user confirmation)

--- Next Step ---
Await user confirmation:
1. Confirm SecurityConfig fix (proposal A: remove /dashboard from permitAll)
2. Confirm verification restore (proposal B: application-prod.properties line 76 -> true)
3. Confirm Railway migration execution (env setup + deploy)
4. Confirm SMTP delivery verification (after cloud config B)
