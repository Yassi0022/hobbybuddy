# HobbyBuddy

A social platform that helps adults make real friends through shared interests. Users complete a personality quiz, get matched with compatible locals, and connect via chat and local events.

---

## Architecture

Two-tier deployment — frontend is built into the Spring Boot JAR, database on managed MySQL:

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

- The **React frontend** (Vite 8, React 19) builds to `frontend_v2/dist/`. During the Maven build a script copies the dist output into `hobbybuddy-platform/src/main/resources/static/`, so the JAR serves both API and UI.
- **Render** runs the single JAR — frontend and backend are served from the same origin on port 8080.
- **Aiven** hosts the production MySQL instance with SSL.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, CSS Modules |
| Backend | Spring Boot 3, Java 21, Spring Security (JWT), Spring WebSocket (STOMP) |
| Database | MySQL 8.0 with SSL (Aiven managed) |
| Auth | JWT (Bearer token in `Authorization` header; cookie fallback server-side) |
| Deploy | Render (single JAR serves frontend + backend) |
| Build | Maven Wrapper (`./mvnw`); `scripts\build-and-package.ps1` for full build |

---

## Local Development

### Prerequisites
- Node 18+
- Java 21+
- Maven (or use `./mvnw` — included)
- MySQL 8.0 (local or Aiven)

### 1. Clone

```bash
git clone https://github.com/Yassi0022/hobbybuddy.git
cd hobbybuddy
```

### 2. Backend (API-only for development)

```bash
cd hobbybuddy-platform

# Create src/main/resources/application-local.properties with your DB credentials:
#   spring.datasource.url=jdbc:mysql://localhost:3306/hobbybuddy_db?useSSL=false
#   spring.datasource.username=root
#   spring.datasource.password=yourpassword
#   JWT_SECRET=<base64-encoded-32-byte-key>

./mvnw spring-boot:run
```

The API runs at `http://localhost:8080`. Health check: `GET /api/health`.

### 3. Frontend (Vite dev server, proxies API to backend)

```bash
cd frontend_v2
npm install
npm run dev
```

The Vite dev server runs at `http://localhost:5173` and proxies `/api` to `http://localhost:8080`.

### 4. Production Build (frontend + backend in one JAR)

```bash
# Option A — single-command full build (from repo root):
.\scripts\build-and-package.ps1

# Option B — manual steps:
cd frontend_v2
npm run build
cd ../hobbybuddy-platform
.\scripts\copy-frontend.ps1
.\mvnw package -DskipTests
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

The built JAR serves both the API and the static frontend at `http://localhost:8080`.

---

## Authentication Flow

1. User registers via `POST /api/users` → account created, email verification sent, **no JWT issued**
2. User clicks verification link → `GET /api/users/verify?token=...` → account activated
3. User logs in via `POST /api/users/login`:
   - If email not verified → 403 with `EMAIL_NOT_VERIFIED` (frontend shows resend option)
   - If verified → JWT returned in response body **plus** server-side `Set-Cookie`
4. Frontend stores the token in `localStorage` (`hb_token`) and sends it as `Authorization: Bearer <token>` on every request
5. All API requests (except auth endpoints) require a valid JWT **and** verified email — unverified users get 403
6. The cookie is a server-side fallback only — the frontend reads from `localStorage`

---

## Production Deploy

### Render (Single JAR — frontend + backend)

| Setting | Value |
|---|---|
| Root directory | (repo root) |
| Build command | `powershell -ExecutionPolicy Bypass -File scripts\build-and-package.ps1` |
| Start command | `java -jar hobbybuddy-platform/target/demo-0.0.1-SNAPSHOT.jar` |
| Health check path | `/api/health` |

**Environment variables on Render:**

| Key | Value | Source |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://<host>:18844/hobbybuddy_db?useSSL=true&requireSSL=true` | Aiven Console |
| `SPRING_DATASOURCE_USERNAME` | `<username>` | Aiven Console |
| `SPRING_DATASOURCE_PASSWORD` | `<password>` | Aiven Console |
| `JWT_SECRET` | `<base64-encoded-32-byte-key>` | Generate: `openssl rand -base64 32` |
| `FRONTEND_ORIGINS` | `https://your-app.onrender.com` | Your Render URL |
| `FASTAPI_URL` | `http://localhost:8001` | Optional — Java matching fallback works without it |

---

## API Reference (selected endpoints)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/users` | Public | Register |
| POST | `/api/users/login` | Public | Login — returns JWT + user profile |
| GET | `/api/users/me` | JWT | Current user profile |
| GET | `/api/users/{id}` | JWT | User profile by ID |
| PUT | `/api/users/{id}/profile` | JWT | Update profile |
| POST | `/api/users/{id}/quiz-submit` | JWT | Submit Big Five quiz |
| GET | `/api/users/{id}/find-buddy` | JWT | Get compatibility matches |
| DELETE | `/api/users/{id}` | JWT | Delete account |
| GET | `/api/health` | Public | Health check — returns `{"status":"ok"}` |
| GET | `/api/match-requests` | JWT | List match requests (incl. confirmed matches) |
| POST | `/api/match-requests/{candidateId}` | JWT | Send a match request |
| PATCH | `/api/match-requests/{id}/confirm` | JWT | Confirm a match request |
| GET | `/api/messages/{user1}/{user2}` | JWT | Get conversation between two users |
| POST | `/api/messages` | JWT | Send a message (REST; server broadcasts via WebSocket) |
| WS | `/ws-chat` | JWT | WebSocket/STOMP endpoint for real-time chat |

---

## Residual Risks

1. **FastAPI matching microservice is not deployed.** The Python microservice in `matching-engine/` provides richer `traitBreakdowns` per match. Without it, the Java fallback matching works but produces simpler results. Deploying the Python service and setting `FASTAPI_URL` restores full fidelity.

2. **`JWT_SECRET` must be set as an environment variable** in every deployment environment (Render, local dev). Without it, the application refuses to start. Generate with: `openssl rand -base64 32`.

3. **Single-topic WebSocket subscription** — the user subscribes to `/topic/chat/{userId}` which delivers all messages for all conversations. The client filters by `buddyId`. This is fine for alpha but should be narrowed to per-conversation topics before beta.

4. **Frontend build and copy** is scripted via PowerShell: `scripts/build-and-package.ps1` does a full build (frontend + copy + Maven package). For frontend-only rebuilds, run `npm run build` in `frontend_v2/` and then `scripts/copy-frontend.ps1`.

---

## License

MIT
