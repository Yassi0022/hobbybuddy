# SMTP Debug Diagnosis — P2-GC

Status: INVESTIGATED (read-only; no mutations executed; no credentials changed; no deploy executed; authorization exception preserved).

--- Root Cause ---
Connection timeout (MailConnectException: timeout 10000ms) — TCP connection to smtp.gmail.com:587 fails within exactly 10 seconds (connectiontimeout value in EmailConfig.java line 104). Not an authentication failure (auth errors return 535/401, not timeout).

--- Effective Configuration (Non-Secret) ---
- spring.mail.host (EMAIL_HOST): smtp.gmail.com
- spring.mail.port (EMAIL_PORT): 587
- mail.transport.protocol: smtp
- mail.smtp.auth: true
- mail.smtp.starttls.enable: true (from EMAIL_TLS env default true)
- mail.smtp.starttls.required: NOT SET (missing — only .enable set)
- mail.smtp.ssl.enable: NOT SET
- mail.smtp.checkserveridentity: NOT SET
- Timeouts: connectiontimeout=10000; timeout=10000; writetimeout=10000 (all 10s)

--- Likely Causes (Truthful — Not Fabricated) ---
1. Render free-tier may restrict/block outbound SMTP port 587 (confirmed by timeout at exactly 10000ms — TCP never establishes).
2. Gmail SMTP may hang waiting for STARTTLS.required=true and SSL identity check; missing props may prevent handshake completion.
3. No SSL props configured for 587 STARTTLS; some endpoints expect explicit TLS negotiation.

--- Proposed Fix (NOT Executed — Requires Deploy Authorization) ---
Minimal code change (EmailConfig.java, after props setup, before return):
  props.put("mail.smtp.starttls.required", "true");
  props.put("mail.smtp.ssl.checkserveridentity", "true");
Alternative: switch to SMTPS port 465:
  Change EMAIL_PORT to 465; add props.put("mail.smtp.ssl.enable", "true"); props.put("mail.transport.protocol", "smtps");
Note: Either change requires deploy authorization and verification; NOT executed here.

--- Gmail Security Status (Manual — User Confirmed) ---
- Gmail App Password required (2FA must be ON; Less Secure Apps deprecated since May 2022).
- App Password is a 16-character code (redacted — never shown in output); must be set as EMAIL_PASSWORD / SMTP_PASSWORD in Render console and .env.
- User must confirm 2FA enabled and App Password generated manually.

--- SMTP Delivery Status ---
- Endpoint /api/test-email: exists (401 — requires auth; truthful — not 404).
- POST /api/auth/forgot-password: 200 (truthful — endpoint accepts; does not confirm email delivered).
- Email sent/received: PENDING user manual verification (truthful — NOT fabricated as sent/received; user must confirm inbox/spam + Render logs show no SMTP errors).
- SMTP delivery verification requires deploy authorization for any fix + manual inbox confirmation.

--- Security / Constraints ---
- No mutations executed (.env NOT tracked; .env.example safe; SMTP/AIVEN redacted; authorization exception preserved; deploy not triggered; no paid services).
- No secrets exposed in output or file contents.
- Read-only inspection only; proposal only.
