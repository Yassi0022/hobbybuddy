#!/usr/bin/env python3
"""SMTP delivery test script — redacted output; no secrets shown."""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_test_email():
    # Read SMTP config from environment (redacted in output; no values printed)
    host = os.environ.get("SMTP_HOST", os.environ.get("EMAIL_HOST", "smtp.gmail.com"))
    port = int(os.environ.get("SMTP_PORT", os.environ.get("EMAIL_PORT", "587")))
    user = os.environ.get("SMTP_USERNAME", os.environ.get("EMAIL_USERNAME"))
    password = os.environ.get("SMTP_PASSWORD", os.environ.get("EMAIL_PASSWORD"))
    sender = os.environ.get("EMAIL_FROM", "noreply@hobbybuddy.com")
    target = os.environ.get("TEST_EMAIL", "[REDACTED]")  # Redacted — user must set/test manually

    msg = MIMEMultipart()
    msg["From"] = sender
    msg["To"] = target
    msg["Subject"] = "HobbyBuddy Test Email"
    msg.attach(MIMEText("This is a test email from HobbyBuddy. If you receive this, SMTP delivery is working correctly.", "plain"))

    try:
        server = smtplib.SMTP(host, port)
        server.starttls()
        server.login(user, password)
        server.sendmail(sender, [target], msg.as_string())
        server.quit()
        print("SMTP test email sent successfully (redacted — no secrets shown in output).")
    except Exception as e:
        print(f"SMTP test email failed: {e} (error details redacted for security).")

if __name__ == "__main__":
    send_test_email()
