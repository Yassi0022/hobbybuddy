package com.example.demo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * In-memory token-bucket rate limiter for authentication endpoints.
 *
 * <p><b>Deployment model:</b> single-instance in-memory. This means:
 * <ul>
 *   <li>Each Render instance tracks its own counters independently.</li>
 *   <li>Under auto-scaling (multiple instances), limits are per-instance, not global.</li>
 *   <li>For a single Render web service (default), this is effective.</li>
 *   <li>Future upgrade path: swap to a Redis-backed bucket (e.g., Bucket4j + Redis)
 *       for multi-instance consistency.</li>
 * </ul>
 *
 * <p><b>Protected endpoints:</b>
 * <ul>
 *   <li>{@code POST /api/users/login} — 10 attempts per 5-minute window per IP + email</li>
 *   <li>{@code POST /api/users} (register) — 5 attempts per 15-minute window per IP</li>
 * </ul>
 *
 * <p><b>Headers on rejection (HTTP 429):</b>
 * <ul>
 *   <li>{@code Retry-After} — seconds until the window resets</li>
 *   <li>{@code X-RateLimit-Limit} — the request limit for this endpoint</li>
 *   <li>{@code X-RateLimit-Remaining} — always 0 when rejected</li>
 *   <li>{@code X-RateLimit-Reset} — epoch seconds when the window resets</li>
 * </ul>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);

    // ── Configuration ──────────────────────────────────────────────────

    /** Login: 10 attempts per 5-minute window. */
    private static final int LOGIN_MAX_REQUESTS = 10;
    private static final long LOGIN_WINDOW_MS = TimeUnit.MINUTES.toMillis(5);

    /** Registration: 5 attempts per 15-minute window. */
    private static final int REGISTER_MAX_REQUESTS = 5;
    private static final long REGISTER_WINDOW_MS = TimeUnit.MINUTES.toMillis(15);

    /**
     * Forgot-password: 3 attempts per 15-minute window per IP, and
     * 3 attempts per 15-minute window per email address.
     * Two-layer keying prevents a single IP from spamming many emails
     * while still allowing legitimate users behind shared NAT.
     */
    private static final int FORGOT_PASSWORD_MAX_REQUESTS = 10;
    private static final long FORGOT_PASSWORD_WINDOW_MS = TimeUnit.MINUTES.toMillis(15);

    // ── State ─────────────────────────────────────────────────────────

    /**
     * Key = {@code "login:<clientIp>:<email}"} or {@code "register:<clientIp>"}
     * Value = mutable bucket tracking count + window start.
     */
    private final ConcurrentHashMap<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String clientIp = extractClientIp(request);

        // Determine rate-limit policy for this path
        RateLimitPolicy policy = resolvePolicy(path);
        if (policy == null) {
            chain.doFilter(request, response);
            return;
        }

        // Wrap the request so the body can be read multiple times
        // (once by us for email extraction, once by the controller)
        HttpServletRequest wrappedRequest = new CachedBodyHttpServletRequest(request);

        // Build the rate-limit key(s)
        String key = buildKey(policy.type, clientIp, wrappedRequest);

        // For forgot-password, apply two-layer rate limiting: per-IP AND per-email
        if ("forgot-password".equals(policy.type)) {
            String emailKey = buildEmailKey(wrappedRequest);
            if (emailKey != null) {
                TokenBucket emailBucket = buckets.computeIfAbsent(emailKey,
                        k -> new TokenBucket(policy.maxRequests, policy.windowMs));
                BucketResult emailResult = emailBucket.tryAcquire();
                if (!emailResult.allowed) {
                    int retryAfterSeconds = (int) Math.ceil((double) emailResult.retryAfterMs / 1000.0);
                    response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
                    response.setHeader("X-RateLimit-Limit", String.valueOf(policy.maxRequests));
                    response.setHeader("X-RateLimit-Remaining", "0");
                    response.setHeader("X-RateLimit-Reset", String.valueOf(emailResult.windowResetEpoch));

                    logger.warn("[RATE-LIMIT] Blocked {} from IP {} (email key, retryAfter={}s)",
                            policy.name, clientIp, retryAfterSeconds);

                    writeRateLimitResponse(response, policy, retryAfterSeconds);
                    return;
                }
            }
        }

        TokenBucket bucket = buckets.computeIfAbsent(key,
                k -> new TokenBucket(policy.maxRequests, policy.windowMs));

        BucketResult result = bucket.tryAcquire();

        // Always set rate-limit headers
        response.setHeader("X-RateLimit-Limit", String.valueOf(policy.maxRequests));
        response.setHeader("X-RateLimit-Remaining",
                String.valueOf(Math.max(0, policy.maxRequests - result.count)));
        response.setHeader("X-RateLimit-Reset", String.valueOf(result.windowResetEpoch));

        if (!result.allowed) {
            int retryAfterSeconds = (int) Math.ceil((double) result.retryAfterMs / 1000.0);
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));

            logger.warn("[RATE-LIMIT] Blocked {} from IP {} (key={}, count={}/{}, retryAfter={}s)",
                    policy.name, clientIp, key, result.count, policy.maxRequests, retryAfterSeconds);

            writeRateLimitResponse(response, policy, retryAfterSeconds);
            return;
        }

        chain.doFilter(wrappedRequest, response);
    }

    // ── Policy resolution ──────────────────────────────────────────────

    private RateLimitPolicy resolvePolicy(String path) {
        if ("/api/users/login".equals(path)) {
            return new RateLimitPolicy("login", "login", LOGIN_MAX_REQUESTS, LOGIN_WINDOW_MS);
        }
        if ("/api/users".equals(path) || "/api/users/register".equals(path)) {
            return new RateLimitPolicy("register", "registration", REGISTER_MAX_REQUESTS, REGISTER_WINDOW_MS);
        }
        if ("/api/users/forgot-password".equals(path)) {
            return new RateLimitPolicy("forgot-password", "password reset", FORGOT_PASSWORD_MAX_REQUESTS, FORGOT_PASSWORD_WINDOW_MS);
        }
        return null;
    }

    // ── Key building ──────────────────────────────────────────────────

    /**
     * Build a rate-limit key. For forgot-password we use two-layer keying:
     * one bucket per IP, and a separate bucket per email address.
     * Both must pass for the request to proceed.
     *
     * @return the primary key (caller should also check secondary for forgot-password).
     */
    private String buildKey(String type, String clientIp, HttpServletRequest request) {
        if ("login".equals(type)) {
            String email = extractEmailSafely(request);
            return "login:" + clientIp + ":" + (email != null ? email : "unknown");
        }
        if ("forgot-password".equals(type)) {
            // Primary key is IP-based; the filter will also check email-based key
            return "forgot-pw:ip:" + clientIp;
        }
        return "register:" + clientIp;
    }

    /**
     * For forgot-password, build the secondary email-based key.
     * Returns null if email cannot be extracted.
     */
    private String buildEmailKey(HttpServletRequest request) {
        String email = extractEmailSafely(request);
        if (email == null) return null;
        return "forgot-pw:email:" + email;
    }

    /**
     * Extract the user's real IP, accounting for reverse proxies (Render).
     * Checks X-Forwarded-For first, then X-Real-IP, then getRemoteAddr.
     */
    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Extract the email from the cached request body.
     * Only called on the wrapped request, so getBody() is available.
     * Falls back to null (IP-only key) on any error.
     */
    private String extractEmailSafely(HttpServletRequest request) {
        try {
            if (request instanceof CachedBodyHttpServletRequest) {
                String body = ((CachedBodyHttpServletRequest) request).getBody();
                if (body != null && !body.isBlank()) {
                    int idx = body.indexOf("\"email\"");
                    if (idx >= 0) {
                        int colon = body.indexOf(':', idx + 6);
                        int quoteStart = body.indexOf('"', colon + 1);
                        int quoteEnd = body.indexOf('"', quoteStart + 1);
                        if (quoteStart >= 0 && quoteEnd > quoteStart) {
                            return body.substring(quoteStart + 1, quoteEnd).toLowerCase().trim();
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.debug("[RATE-LIMIT] Could not extract email from body: {}", e.getMessage());
        }
        return null;
    }

    // ── Response helper ────────────────────────────────────────────────

    private void writeRateLimitResponse(HttpServletResponse response, RateLimitPolicy policy, int retryAfterSeconds)
            throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String json = String.format(
                "{\"error\":\"Too Many Requests\","
                + "\"message\":\"Rate limit exceeded for %s. Please try again in %d seconds.\","
                + "\"status\":429,"
                + "\"retryAfter\":%d}",
                policy.description, retryAfterSeconds, retryAfterSeconds);
        response.getWriter().write(json);
        response.getWriter().flush();
    }

    // ── Token bucket ──────────────────────────────────────────────────

    private static class BucketResult {
        final boolean allowed;
        final int count;
        final long retryAfterMs;
        final long windowResetEpoch;

        BucketResult(boolean allowed, int count, long retryAfterMs, long windowResetEpoch) {
            this.allowed = allowed;
            this.count = count;
            this.retryAfterMs = retryAfterMs;
            this.windowResetEpoch = windowResetEpoch;
        }
    }

    /**
     * Lightweight token-bucket with a fixed-window approach.
     * Synchronized on the instance for thread safety (one lock per key).
     */
    private static class TokenBucket {
        private final int maxRequests;
        private final long windowMs;
        private long windowStart;
        private int count;

        TokenBucket(int maxRequests, long windowMs) {
            this.maxRequests = maxRequests;
            this.windowMs = windowMs;
            this.windowStart = System.currentTimeMillis();
            this.count = 0;
        }

        synchronized BucketResult tryAcquire() {
            long now = System.currentTimeMillis();

            // Reset window if expired
            if (now - windowStart >= windowMs) {
                windowStart = now;
                count = 0;
            }

            count++;

            if (count > maxRequests) {
                long retryAfterMs = windowStart + windowMs - now;
                long resetEpoch = (windowStart + windowMs) / 1000;
                return new BucketResult(false, count, retryAfterMs, resetEpoch);
            }

            long resetEpoch = (windowStart + windowMs) / 1000;
            return new BucketResult(true, count, 0, resetEpoch);
        }
    }

    // ── Policy descriptor ──────────────────────────────────────────────

    private static class RateLimitPolicy {
        final String type;
        final String name;
        final int maxRequests;
        final long windowMs;
        final String description;

        RateLimitPolicy(String type, String name, int maxRequests, long windowMs) {
            this.type = type;
            this.name = name;
            this.maxRequests = maxRequests;
            this.windowMs = windowMs;
            this.description = name;
        }
    }
}
