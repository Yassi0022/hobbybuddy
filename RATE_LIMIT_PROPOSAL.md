# Rate Limiting Proposal — HobbyBuddy

Status: PROPOSED (requires backend build/deploy authorization before execution).

Implementation (Express / Spring Boot filter):
- Free tier: `express-rate-limit` (if using Node proxy) or Spring Boot `RateLimiter` (free, built-in in newer versions) / custom filter.
- Limit: 100 requests per 15 minutes per IP address.
- Endpoints to protect: `/api/users/login`, `/api/users/register`, `/api/users/forgot-password`, `/api/messages/**`, POST `/api/events`.
- Response: 429 Too Many Requests with `Retry-After` header.
- No paid services required.

Notes:
- Implementation reserved for deploy authorization (does not alter production without confirmation).
- .env and credentials NOT exposed in this file.
