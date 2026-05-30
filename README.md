# HobbyBuddy

A social platform that helps adults make real friends through shared interests. Users complete a personality quiz, get matched with compatible locals, and connect via chat and local events.

---

## Architecture

Three-tier deployment — frontend, backend, database on separate managed services:

```
┌─────────────────┐
│   Vercel CDN    │  React SPA (Vite)
│   (Frontend)    │
└────────┬────────┘
         │ API calls + JWT Bearer
┌────────┴────────┐
│   Render        │  Spring Boot 3, Java 17
│   (Backend)     │
└────────┬────────┘
         │ MySQL (SSL)
┌────────┴────────┐
│   Aiven         │  MySQL 8.0 (managed)
│   (Database)    │
└─────────────────┘
```

- **Vercel** serves the compiled React app from its global CDN.
- **Render** runs the Spring Boot JAR, handles authentication, matching logic, chat, and media uploads.
- **Aiven** hosts the production MySQL instance with SSL.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, CSS Modules |
| Backend | Spring Boot 3, Java 17, Spring Security (JWT), Spring WebSocket (STOMP) |
| Database | MySQL 8.0 with SSL (Aiven managed) |
| Auth | JWT (Bearer token in `Authorization` header; cookie fallback server-side) |
| Deploy | Vercel (frontend), Render Web Service (backend) |
| Build | Maven Wrapper (`./mvnw`) for CI compatibility |

---

## Local Development

### Prerequisites
- Node 18+
- Java 17+
- Maven (or use `./mvnw` — included)
- MySQL 8.0 (local or Aiven)

### 1. Clone

```bash
git clone https://github.com/Yassi0022/hobbybuddy.git
cd hobbybuddy
```

### 2. Backend

```bash
cd hobbybuddy-platform

# Create src/main/resources/application-local.properties with your DB credentials:
#   spring.datasource.url=jdbc:mysql://localhost:3306/hobbybuddy_db?useSSL=false
#   spring.datasource.username=root
#   spring.datasource.password=yourpassword

./mvnw spring-boot:run
```

The API runs at `http://localhost:8080`. Health check: `GET /api/health`.

### 3. Frontend

```bash
cd frontend_v2
npm install
npm run dev
```

The Vite dev server runs at `http://localhost:5173` and proxies `/api` to the backend.

### 4. Production Build (local verification)

```bash
cd frontend_v2
npm run build          # outputs to dist/
cd ../hobbybuddy-platform
./mvnw package -DskipTests
java -jar target/hobbybuddy-platform-0.0.1-SNAPSHOT.jar
```

The built JAR serves both the API and the static frontend on `http://localhost:8080`.

---

## Authentication Flow

1. User submits email + password via `POST /api/users/login`.
2. Server verifies credentials (BCrypt), generates a JWT, and returns it in the JSON response body **plus** a server-side `Set-Cookie` header.
3. Frontend stores the token in `localStorage` (`hb_token`) and sends it as `Authorization: Bearer <token>` on every request.
4. The cookie is a server-side fallback only — the frontend reads from `localStorage`.

---

## Production Deploy

### Vercel (Frontend)

| Setting | Value |
|---|---|
| Root directory | `frontend_v2/` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Framework preset | Vite |

### Render (Backend Web Service)

| Setting | Value |
|---|---|
| Root directory | `hobbybuddy-platform/` |
| Build command | `./mvnw package -DskipTests` |
| Start command | `java -jar target/hobbybuddy-platform-0.0.1-SNAPSHOT.jar` |
| Health check path | `/api/health` |

**Environment variables on Render:**

| Key | Value | Source |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://<host>:18844/hobbybuddy_db?useSSL=true&requireSSL=true` | Aiven Console |
| `SPRING_DATASOURCE_USERNAME` | `<username>` | Aiven Console |
| `SPRING_DATASOURCE_PASSWORD` | `<password>` | Aiven Console |
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

---

## Residual Risks

1. **FastAPI matching microservice is not deployed.** The Python microservice in `matching-engine/` provides richer `traitBreakdowns` per match. Without it, the Java fallback matching works but produces simpler results. Deploying the Python service and setting `FASTAPI_URL` restores full fidelity.

2. **`JwtUtil` generates a new random `SecretKey` on every boot** (see `JwtUtil.java`). After a restart, all existing tokens become invalid and users must log in again. For a real production workload, inject a fixed secret via `JWT_SECRET` environment variable instead of calling `Keys.secretKeyFor()` each time.

---

## License

MIT
