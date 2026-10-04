--- SMTP Debug (P2-GC) ---
Endpoint /api/test-email: 401 (exists; requires auth — truthful).
POST /api/auth/forgot-password: 200 (truthful — does NOT confirm delivery).
SMTP root cause: timeout 10000ms (MailConnectException — TCP to smtp.gmail.com:587 fails; NOT auth failure; missing starttls.required prop).
Proposed fix (NOT executed — requires deploy authorization): add props.put('mail.smtp.starttls.required', 'true'); props.put('mail.smtp.ssl.checkserveridentity', 'true'); OR SMTPS port 465 + ssl.enable=true.
SMTP delivery verification: PENDING user manual confirmation (truthful — NOT fabricated as sent/received).
SMTP_DEBUG_REPORT.md: created (redacted; full diagnosis; no mutations executed).
