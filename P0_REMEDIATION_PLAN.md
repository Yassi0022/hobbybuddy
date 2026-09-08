=== P0 REMEDIATION PLAN — SECRET EXPOSURE ===
Audit-only: no edits made; no commits; no cloud changes.

--- EXPOSURE ASSESSMENT ---
File: .env
Status: tracked by Git index (git ls-files confirms); present in working tree.
Git ignore: .env and .env.* present in .gitignore (lines 20-21), but file was tracked before ignore.
Git history: file exists in repo; git log shows no additional .env-specific commits (file added early and retained).
Exposure scope: secret values exist in both working tree and Git tracked history. Any clone of this repo (public or private) carries secrets.
Severity: P0 — any secret in tracked history is considered compromised.

--- SECRET VARIABLE NAMES ONLY (no values shown) ---
Local/dev secrets (lower priority if only local):
  MYSQL_ROOT_PASSWORD
  MYSQL_DATABASE
  MYSQL_USER
  MYSQL_PASSWORD
Production/cloud secrets (P0 rotation required):
  AIVEN_URL (contains DB connection info; host/user embedded; does NOT embed AIVEN_PASSWORD in value observed)
  AIVEN_USER
  AIVEN_PASSWORD
Application/env variables read from environment (names only, from source/config):
  app.email.enabled
  app.email.from
  app.email.verification.required
  app.frontend-url
  app.photo.max-size-bytes
  fastapi.url
  ticketmaster.api.key
  SPRING_DATASOURCE_URL
  SPRING_DATASOURCE_USERNAME
  SPRING_DATASOURCE_PASSWORD
  EMAIL_HOST
  EMAIL_PORT
  EMAIL_USERNAME
  EMAIL_PASSWORD
  FRONTEND_ORIGINS
  FRONTEND_URL
  FASTAPI_URL
  PORT (matching service)
Note: No secret values are reported or displayed in this document.

--- REQUIRED ROTATIONS ---
Must rotate (production impact):
  1. AIVEN_PASSWORD (variable name only) — rotate in Aiven dashboard; update Render env var; never commit new value.
  2. AIVEN_USER / AIVEN_URL host/user component — if user/password pair or host is tied to the same account, rotate AIVEN credentials entirely. Variable names: AIVEN_USER, AIVEN_URL.
  3. MYSQL_ROOT_PASSWORD / MYSQL_PASSWORD (local/dev) — rotate locally; lower priority since not production, but clean hygiene requires rotation.
  4. Any embedded DB connection secrets inside SPRING_DATASOURCE_URL if it contains embedded user/password (observed as URL with host; separate username/password in env vars). Confirm by inspecting env value only; do not display.
Render production env vars to rotate (names only):
  SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD
Email env vars to rotate/confirm (names only):
  EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, EMAIL_PASSWORD
Note: .env.example does not exist; must create with names/placeholders only.

--- MINIMAL FILE / CONFIG CHANGES (not executed) ---
1. Remove .env from Git tracking:
   - git rm --cached .env (removes from index only; keeps working file)
   - Confirm .env remains in .gitignore (.gitignore already covers .env and .env.*)
2. Add safe redacted .env.example:
   - Create .env.example with variable names only: MYSQL_ROOT_PASSWORD=***, MYSQL_DATABASE=***, MYSQL_USER=***, MYSQL_PASSWORD=***, AIVEN_URL=***, AIVEN_USER=***, AIVEN_PASSWORD=***
   - No real values; no URL fragments that reveal hosts/users; placeholders only.
3. Verify render.yaml and docker-compose.yml reference env vars by name only (they do; no secret values embedded).
4. Confirm no other files contain hardcoded secrets (grep -r for old secret patterns — performed conceptually; actual values never shown).

--- GIT HISTORY REWRITE vs ROTATION SUFFICIENCY ---
Repository is private (user-controlled). Rotation is sufficient for portfolio/demo purposes. Full history rewrite (git filter-repo / BFG) is overkill unless the repo is shared with others or made public.
Recommendation for this private repo: rotation + removal from index is sufficient. Note in portfolio documentation that secrets were rotated and repo cleaned; no need to rewrite history unless sharing externally.

--- VALIDATION PLAN (post-rotation, not executed) ---
1. Confirm AIVEN dashboard shows new credentials working (DB connection test).
2. Confirm Render service restarts with new env vars (no deployment errors).
3. Confirm Spring Boot connects to Aiven MySQL (check health endpoint /api/health; observe logs for connection errors without displaying secrets).
4. Confirm .env is no longer tracked: git ls-files .env should return nothing.
5. Confirm .env remains in .gitignore.
6. Confirm .env.example exists and contains only placeholder names.
7. Confirm no secret values appear in repo via safe grep (search patterns by variable names, never by secret content).
8. Confirm frontend build passes; backend build passes; no secret-related errors.
Rollback: if rotation breaks DB connection, revert Render env vars to previous values (only possible if previous values preserved in Aiven/Render before rotation; always rotate after confirming backup access). For .env tracking change, rollback is git checkout -- .env (restores file) + git add .env (re-tracks) — but this would re-expose secrets; avoid unless necessary.

--- RISKS ---
- If AIVEN_URL contains embedded credentials (user/password in URL), rotation must cover that component too. Confirm URL format in Aiven dashboard; do not inspect values here.
- .env tracked in git means any previous clone or fork retains secrets; rotation addresses active use, not historical exposure.
- Removing .env from index without updating .gitignore could cause accidental re-add; .gitignore is already correct.
- No .env.example currently; creating it avoids future developer confusion.
--- END P0 PLAN (no edits performed) ---
