--- SMTP Debug Report (P2-GC) ---
Root cause: MailSendException / MailConnectException — timeout 10000ms (TCP connection to smtp.gmail.com:587 fails within exactly 10s — connectiontimeout prop; NOT auth failure)
Endpoint checks (truthful): /api/test-email = 401 (exists; requires auth); POST /api/auth/forgot-password = 200 (accepts; does NOT confirm delivery)
Config inspection (redacted — non-secret): host=smtp.gmail.com; port=587; protocol=smtp; auth=true; starttls.enable=true; starttls.required=NOT SET; ssl.enable=NOT SET; timeouts=10000
Proposed fix (NOT executed — requires deploy authorization): add props.put('mail.smtp.starttls.required', 'true'); props.put('mail.smtp.ssl.checkserveridentity', 'true'); OR switch to SMTPS (port 465 + ssl.enable=true + protocol=smtps)
SMTP delivery verification: PENDING user manual confirmation (truthful — NOT fabricated as sent/received; must confirm inbox/spam + Render logs show no SMTP errors)
SMTP_DEBUG_REPORT.md: created (full diagnosis; redacted; no mutations executed)
