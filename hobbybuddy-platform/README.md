# HobbyBuddy Platform

Spring Boot + React SPA for matching hobby partners via Big Five personality compatibility.

## Quick Start (Local Dev)

```bash
# 1. Start MySQL (or use the H2 fallback — see application.properties)
# 2. No SMTP needed in dev — emails are silently discarded
./mvnw spring-boot:run
```

The app starts on `http://localhost:8080` with `ddl-auto=update` and no email.

---

## Required Environment Variables

### Database (always required)

| Variable | Description | Example |
|---|---|---|
| `SPRING_DATASOURCE_URL` | JDBC URL | `jdbc:mysql://localhost:3306/hobbybuddy_db?createDatabaseIfNotExist=true` |
| `SPRING_DATASOURCE_USERNAME` | DB user | `root` |
| `SPRING_DATASOURCE_PASSWORD` | DB password | *(empty for local)* |

### JWT

| Variable | Description | Example |
|---|---|---|
| `JWT_SECRET` | Base64-encoded signing key (min 256 bits) | Generate: `openssl rand -base64 32` |

### Email / SMTP (required in `prod` profile only)

| Variable | Required | Default | Description |
|---|---|---|---|
| `EMAIL_HOST` | **yes** | — | SMTP server hostname, e.g. `smtp.gmail.com` |
| `EMAIL_PORT` | no | `587` | SMTP port |
| `EMAIL_USERNAME` | **yes** | — | SMTP login |
| `EMAIL_PASSWORD` | **yes** | — | SMTP password or app-specific token |
| `EMAIL_FROM` | no | `noreply@hobbybuddy.com` | Envelope "From" address |
| `EMAIL_TLS` | no | `true` | Enable STARTTLS |

> **Prod behaviour:** If any of `EMAIL_HOST`, `EMAIL_USERNAME`, or `EMAIL_PASSWORD`
> is missing or blank, the application **refuses to start** and logs the missing
> variable name.  On successful startup the app also opens a test SMTP connection
> and aborts if the server is unreachable.

### Optional

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port (Render injects this) | `8080` |
| `FASTAPI_URL` | Personality-analysis service URL | `http://localhost:8001` |
| `TICKETMASTER_API_KEY` | Ticketmaster Discovery API key | *(empty)* |
| `app.frontend-url` | Base URL for email links | `http://localhost:3000` |

---

## Profiles

| Profile | Use case | DDL | Email |
|---|---|---|---|
| *(default)* | Local dev | `update` | No-op (discards) |
| `test` | Integration tests | `update` (H2) | No-op (discards) |
| `prod` | Production (Render/Aiven) | `none` (Flyway) | Real SMTP + startup check |

Activate with `--spring.profiles.active=prod` or `SPRING_PROFILES_ACTIVE=prod`.

---

## Deployment (Render)

1. Set environment group with: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`,
   `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `EMAIL_HOST`, `EMAIL_USERNAME`,
   `EMAIL_PASSWORD`, `EMAIL_FROM`, `EMAIL_TLS`.
2. Set `SPRING_PROFILES_ACTIVE=prod`.
3. Flyway migrations run automatically on startup (`ddl-auto=none`).

---

## API Health

- `GET /api/health` — always public, returns app status
- `GET /actuator/health` — Spring Boot health (includes DB check)
- `GET /actuator/health/backup` — DB connectivity probe (`SELECT 1`)
