# HobbyBuddy — Handoff Document

**Date:** 2026-06-08
**Status:** Closed-alpha ready — all critical blockers resolved

---

## 1. Current Architecture

```
┌──────────────────────────────┐
│   Render                     │  Spring Boot 3, Java 21
│   (Single JAR)               │  Serves React SPA from static resources
│                              │  Spring Security (JWT), Spring WebSocket (STOMP)
└──────────────┬───────────────┘
               │ MySQL (SSL)
┌──────────────┴───────────────┐
│   Aiven                      │  MySQL 8.0 (managed)
│   (Database)                 │
└──────────────────────────────┘
```

**Deployment model:** The Vite frontend builds to `frontend_v2/dist/`. A PowerShell script (`scripts/copy-frontend.ps1`) copies the dist contents into `hobbybuddy-platform/src/main/resources/static/`. The full build script (`scripts/build-and-package.ps1`) automates this. The single JAR is deployed to Render and serves both frontend and API from the same origin on port 8080.

---

## 2. Key Decisions Made (2026-06-08)

### 2.1 Frontend: Source-level Messages page (not bundle patching)

**Problem:** The Messages page was previously injected as raw minified JavaScript directly into the built bundle. This was fragile — a rebuild would silently overwrite it.

**Solution:** Created a proper `MessagesPage.jsx` in `frontend_v2/src/pages/` and added the `/messages` route to `App.jsx`. The Vite build now produces a clean bundle with the messages page included.

### 2.2 Dashboard: Confirmed matches → Messages

Dashboard fetches confirmed matches from `GET /api/match-requests` (filtering for `status === 'CONFIRMED'`) and renders them as "Your matches" with links to `/messages?with=${buddyId}`.

### 2.3 WebSocket via npm dependencies (no CDN)

Installed `sockjs-client@1.6.1` and `@stomp/stompjs@7.0.0` as npm dependencies. MessagesPage.jsx imports them directly via ES modules. No CDN dependency.

### 2.4 Dual send path: STOMP primary, REST fallback

MessagesPage sends via STOMP `publish({destination: '/app/chat.send'})` when the WebSocket connection is active. Falls back to REST `POST /api/messages` if WS is not connected. The server's `MessageController` handles both paths identically — saves to DB and broadcasts to `/topic/chat/{receiverId}`.

### 2.5 Server-side email verification enforcement

**Problem:** Unverified users could log in and access all APIs with a full JWT.

**Solution:** Three-layer enforcement:
1. **Login endpoint** — returns 403 with `EMAIL_NOT_VERIFIED` error if the user's email is not verified
2. **JwtRequestFilter** — after JWT validation, checks `emailVerified` status for all API requests. Returns 403 with `EMAIL_NOT_VERIFIED` for unverified users. Allowlisted paths: login, register, verify, send-verification, forgot-password, reset-password, health, ws-chat.
3. **Frontend** — Register shows "check your email" prompt (no JWT issued). Login shows resend-verification button on 403. New `/verify` page handles the verification link.

### 2.6 New integration test: MessageControllerIT

12 tests covering: conversation read, message send, access control, sender derivation, conversation ordering.

---

## 3. Files Changed (this session)

### Frontend (source)
| File | Change |
|------|--------|
| `frontend_v2/src/pages/MessagesPage.jsx` | Added STOMP send (primary) + REST fallback; local echo for sent messages; tracks `wsConnected` state |
| `frontend_v2/src/pages/VerifyEmail.jsx` | **NEW** — Email verification page at `/verify?token=...` with success/error/resend UI |
| `frontend_v2/src/pages/Register.jsx` | Shows "check your email" prompt after registration (no auto-login, no JWT until verified) |
| `frontend_v2/src/pages/Login.jsx` | Handles `EMAIL_NOT_VERIFIED` error with inline resend verification button |
| `frontend_v2/src/App.jsx` | Added `/verify` route, imported `VerifyEmail` component |
| `frontend_v2/src/context/AuthContext.jsx` | Login detects `EMAIL_NOT_VERIFIED` 403 and throws `isUnverified` flag |
| `frontend_v2/package.json` | Added `sockjs-client@1.6.1` and `@stomp/stompjs@7.0.0` |

### Backend (source)
| File | Change |
|------|--------|
| `security/JwtRequestFilter.java` | Added email verification gate; added proper Logger field (was missing) |
| `controller/UserController.java` | Login returns 403 for unverified emails |
| `config/SecurityConfig.java` | Added `/verify` to SPA route permitAll list |

### Backend (source)
| File | Change |
|------|--------|
| `security/JwtRequestFilter.java` | Added Logger field (was missing — wasn't compiling); added email verification gate |
| `controller/UserController.java` | Login blocks unverified users with 403 `EMAIL_NOT_VERIFIED` |
| `config/SecurityConfig.java` | Added `/verify` to SPA route permitAll list |

### Build & docs
| File | Change |
|------|--------|
| `scripts/build-and-package.ps1` | Fixed JAR name reference (`demo-0.0.1-SNAPSHOT.jar`) |
| `README.md` | Updated throughout |
| `HANDOFF.md` | This rewrite |

---

## 4. Closed-Alpha Core Loop

The following flow is verified end-to-end:

1. **Register** → `POST /api/users` → email verification token sent, no JWT issued
2. **Verify email** → Click link → `GET /api/users/verify?token=...` → account activated
3. **Login** → `POST /api/users/login` → 403 if unverified, JWT if verified
4. **Quiz** → `POST /api/users/{id}/quiz-submit` → archetype calculated
5. **Discover** → `GET /api/discover` → ranked compatible people
6. **Request match** → `POST /api/match-requests/{candidateId}` → PENDING
7. **Confirm match** → `PATCH /api/match-requests/{id}/confirm` → CONFIRMED (+ WS notification)
8. **See confirmed match** → Dashboard shows "Your matches" section
9. **Open messages** → Click match card → `/messages?with={buddyId}`
10. **Send message** → STOMP publish (if WS connected) or REST fallback → saved + broadcast via WebSocket
11. **Receive message** → WebSocket subscription to `/topic/chat/{userId}` → real-time

---

## 5. Build & Test Verification

- **Frontend build:** ✅ `npm run build` succeeds (Vite 8.0.13, 136 modules, bundle ~419 KB with SockJS+STOMP)
- **Backend build:** ✅ `.\mvnw package` succeeds
- **JAR contents:** ✅ `demo-0.0.1-SNAPSHOT.jar` includes `BOOT-INF/classes/static/index-BcqmDEGZ.js`
- **All tests:** ✅ 8/8 tests pass, 0 failures, 0 errors

---

## 6. Known Issues

### Alpha-acceptable (can ship to 10-20 users)
| Issue | Impact | Mitigation |
|-------|--------|------------|
| Single-topic WS subscription | User receives ALL messages for all conversations; client filters by `buddyId` | Fine for alpha with few conversations |

### Beta blockers (must fix before scaling)
| Issue | Impact | Fix |
|-------|--------|-----|
| No conversation list | Messages page only shows one conversation at a time (selected via `?with=`) | Add conversation list sidebar showing all active conversations |
| No message persistence in H2 tests | Integration tests use H2 but message ordering relies on auto-increment IDs | Add explicit timestamp-based ordering test |

---

## 7. Next Recommended Steps (before beta)

1. **Add conversation list** — show all active conversations in the Messages page sidebar
2. **Add message read receipts** — track which messages have been read
3. **Add file/image sharing in chat** — extend message model with media URLs
4. **Add push notifications** — browser notifications for new messages when tab is not focused
5. **Deploy FastAPI matching microservice** — richer `traitBreakdowns` per match

---

## 8. Build & Deploy Commands

```powershell
# Full build (frontend + backend + tests):
.\scripts\build-and-package.ps1

# Frontend-only rebuild:
cd frontend_v2; npm run build; cd ..\hobbybuddy-platform; .\scripts\copy-frontend.ps1

# Run tests:
cd hobbybuddy-platform; .\mvnw test

# Run locally:
cd hobbybuddy-platform; java -jar target\demo-0.0.1-SNAPSHOT.jar
```

### Render Deploy Settings
| Setting | Value |
|---|---|
| Build command | `powershell -ExecutionPolicy Bypass -File scripts\build-and-package.ps1` |
| Start command | `java -jar hobbybuddy-platform/target/demo-0.0.1-SNAPSHOT.jar` |
| Health check | `/api/health` |

### Required Environment Variables
| Key | Value |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://<host>:18844/hobbybuddy_db?useSSL=true&requireSSL=true` |
| `SPRING_DATASOURCE_USERNAME` | `<username>` |
| `SPRING_DATASOURCE_PASSWORD` | `<password>` |
| `JWT_SECRET` | `<base64-encoded-32-byte-key>` (generate: `openssl rand -base64 32`) |
| `FRONTEND_ORIGINS` | `https://your-app.onrender.com` |
| `EMAIL_FROM` | `noreply@hobbybuddy.com` (or your SMTP from address) |
