# HobbyBuddy — Handoff Document

**Date:** 2026-06-08
**Status:** Alpha-ready — pushed, deployed to Render
**Commits:** `7db7221` (main)

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

**Deployment model:** The Vite frontend builds to `frontend_v2/dist/`. A PowerShell script (`scripts/copy-frontend.ps1`) copies the dist contents into `hobbybuddy-platform/src/main/resources/static/`. The single JAR is deployed to Render and serves both API and UI from the same origin on port 8080.

---

## 2. Key Decisions Made (2026-06-08)

### 2.1 Shared Navbar Component
Created `frontend_v2/src/components/ui/Navbar.jsx` — a shared navbar with working mobile hamburger toggle, active link highlighting, and click-away overlay. All authenticated pages (Dashboard, Discover, Events, Messages, Profile) use this component.

### 2.2 Discover → Connect Flow
Discover page now has a "Connect" button on each person's card that calls `POST /api/match-requests/{candidateId}` to send a match request directly from the Discover page. Refresh removes sent users from the list.

### 2.3 Email Verification Enforcement (3 layers)
1. **Login endpoint** — returns 403 with `EMAIL_NOT_VERIFIED` error
2. **JwtRequestFilter** — blocks all API access for unverified users (except allowlisted paths)
3. **Frontend** — Register shows "check your email", Login shows resend button, `/verify` page handles verification link

### 2.4 Dual Messaging Path
STOMP publish (`/app/chat.send`) primary, REST (`POST /api/messages`) fallback. Connection status indicator shows real-time vs fallback mode.

### 2.5 Password Strength Indicator
Register page shows a 3-bar strength meter (Weak/Fair/Good/Strong) as user types password.

### 2.6 Password Visibility Toggle
Login page has an eye icon to toggle password visibility.

### 2.7 Mobile Responsiveness
Mobile hamburger nav works on all authenticated pages. Messages page uses flex layout that fills viewport height.

---

## 3. Files Changed (this session)

### Frontend
| File | Change |
|------|--------|
| `frontend_v2/src/components/ui/Navbar.jsx` | **NEW** — Shared navbar with mobile hamburger, active link highlighting |
| `frontend_v2/src/components/discover/PeopleCard.jsx` | Added `onConnect` prop + Connect button, hobby overflow "+N more" |
| `frontend_v2/src/pages/Dashboard.jsx` | Uses shared Navbar component |
| `frontend_v2/src/pages/DiscoverPage.jsx` | Uses shared Navbar, `handleConnect` + toast feedback, passes `onConnect` to PeopleCard |
| `frontend_v2/src/pages/EventsPage.jsx` | Uses shared Navbar component |
| `frontend_v2/src/pages/Login.jsx` | Password visibility toggle button |
| `frontend_v2/src/pages/Register.jsx` | Password strength meter (3-bar visual indicator) |
| `frontend_v2/src/pages/MessagesPage.jsx` | Mobile flex layout, connection status indicator, smart auto-scroll, improved message bubbles, WS single-subscribe guard |
| `frontend_v2/src/pages/Profile.jsx` | Uses shared Navbar component |
| `frontend_v2/src/pages/VerifyEmail.jsx` | Email verification page (from prior session) |
| `frontend_v2/src/App.jsx` | `/verify` route, shared route config |
| `frontend_v2/src/context/AuthContext.jsx` | FormData-aware `authFetch` (doesn't force Content-Type for FormData) |

### Backend
| File | Change |
|------|--------|
| `security/JwtRequestFilter.java` | Added Logger field, email verification gate, SLF4J parameterized logging |
| `controller/UserController.java` | Login blocks unverified users (403), cleaned up debug log tags |
| `config/SecurityConfig.java` | Added `/verify` to SPA routes |
| `config/ActuatorConfig.java` | **NEW** — Actuator health config |
| `config/EmailConfig.java` | **NEW** — SMTP config |
| `config/JwtChannelInterceptor.java` | STOMP JWT validation |
| `config/StructuredLogger.java` | **NEW** — Structured logging utility |
| `controller/MatchRequestController.java` | **NEW** — Full match request lifecycle with feedback |
| `controller/InviteController.java` | **NEW** — Invite/referral endpoint |
| `model/MatchRequest.java` | **NEW** — JPA entity |
| `model/MatchRequestFeedback.java` | **NEW** — Match rating entity |
| `model/InviteToken.java` | **NEW** — Invite token entity |
| `model/PasswordResetToken.java` | **NEW** — Token reuse for verification + reset |
| `model/PhotoInfo.java` | **NEW** — Photo metadata |
| Various Repositories | **NEW** — Flyway migrations V1–V4, MatchRequestRepository, etc. |

### Build & Deploy
| File | Change |
|------|--------|
| `scripts/build-and-package.ps1` | Full build: frontend + copy + Maven package |
| `scripts/copy-frontend.ps1` | Copies dist/ to Spring Boot static resources |

---

## 4. Alpha-Ready Core Loop

1. **Register** → `POST /api/users` → verification email sent, no JWT issued
2. **Verify email** → `GET /api/users/verify?token=...` → account activated
3. **Login** → `POST /api/users/login` → 403 if unverified, JWT if verified
4. **Quiz** → `POST /api/users/{id}/quiz-submit` → archetype calculated
5. **Discover** → `GET /api/discover` → ranked compatible people with Connect button
6. **Request match** → `POST /api/match-requests/{candidateId}` → PENDING
7. **Confirm match** → `PATCH /api/match-requests/{id}/confirm` → CONFIRMED (+ WS notification)
8. **See confirmed match** → Dashboard shows "Your matches" section
9. **Open messages** → Click match card → `/messages?with={buddyId}`
10. **Send message** → STOMP publish or REST fallback → saved + broadcast via WebSocket
11. **Receive message** → WebSocket subscription to `/topic/chat/{userId}` → real-time

---

## 5. Build & Test Verification

- **Frontend build:** ✅ `vite build` succeeds (137 modules, bundle ~420 KB)
- **Backend build:** ✅ `.\mvnw package` succeeds
- **JAR contents:** ✅ `demo-0.0.1-SNAPSHOT.jar` includes `index-BiPIV6sN.js`
- **All tests:** ✅ 8/8 tests pass, 0 failures, 0 errors
- **Deploy:** ✅ Pushed to `origin/main`, Render auto-deploys

---

## 6. Known Issues

### Alpha-acceptable (can ship to 10-20 users)
| Issue | Impact | Mitigation |
|-------|--------|------------|
| Single-topic WS subscription | User receives ALL messages for all conversations; client filters by `buddyId` | Fine for alpha with few conversations |
| No conversation list | Messages page only shows one conversation at a time (selected via `?with=`) | Users navigate from Dashboard matches |

### Beta blockers (must fix before scaling)
| Issue | Impact | Fix |
|-------|--------|-----|
| No conversation list | Can't see all active conversations | Add sidebar with conversation list |
| No message read receipts | Can't tell if messages were seen | Add read status to message model |
| No file/image sharing | Text-only chat | Add media upload to messages |
| Notify on match confirm | Users don't know when match is confirmed | Show notification/toast in Dashboard |

---

## 7. Build & Deploy Commands

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
