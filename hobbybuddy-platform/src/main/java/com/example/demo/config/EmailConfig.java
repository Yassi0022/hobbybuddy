package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Email configuration driven entirely by environment variables.
 *
 * <p>Two beans are defined:
 * <ul>
 *   <li><b>smtp</b> — real SMTP sender, active only when EMAIL_HOST is set (any profile).
 *       Uses ENV vars for host, port, username, password, TLS.</li>
 *   <li><b>fallback</b> ({@link NoOpMailSender}) — a no-op sender that
 *       silently discards every message. Active when EMAIL_HOST is <b>not</b> set.
 *       This ensures the app always boots, even without SMTP configured.</li>
 * </ul>
 *
 * <h3>Master switch</h3>
 * <ul>
 *   <li>{@code app.email.enabled=false} (default) — missing SMTP env vars are fine,
 *       NoOpMailSender is used. If SMTP env vars are present but invalid, a warning
 *       is logged and the app still starts.</li>
 *   <li>{@code app.email.enabled=true} — SMTP is expected to work. If EMAIL_HOST is
 *       missing, a startup warning is logged. The app still starts (non-fatal) but
 *       the operator is alerted.</li>
 * </ul>
 *
 * <h3>Required env vars for real email</h3>
 * <pre>
 *   EMAIL_HOST       — SMTP hostname, e.g. smtp.gmail.com
 *   EMAIL_PORT       — SMTP port (default 587)
 *   EMAIL_USERNAME   — SMTP login (your Gmail address)
 *   EMAIL_PASSWORD   — Gmail App Password (NOT your normal password)
 *   EMAIL_FROM       — Envelope "From" address (e.g. noreply@hobbybuddy.com)
 *   EMAIL_TLS        — true/false (default true)
 * </pre>
 *
 * <h3>Gmail setup</h3>
 * <ol>
 *   <li>Enable 2-Factor Authentication on your Google Account</li>
 *   <li>Generate an App Password at: https://myaccount.google.com/apppasswords</li>
 *   <li>Use that 16-char password as EMAIL_PASSWORD (not your real password)</li>
 *   <li>Set EMAIL_HOST=smtp.gmail.com, EMAIL_PORT=587</li>
 *   <li>Set EMAIL_FROM to any valid sender address</li>
 * </ol>
 *
 * <h3>Enabling SMTP in production</h3>
 * Set the above env vars in the Render dashboard, then flip
 * {@code app.email.enabled=true} (or set {@code EMAIL_ENABLED=true}).
 */
@Configuration
public class EmailConfig {

    private static final Logger logger = LoggerFactory.getLogger(EmailConfig.class);

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    /**
     * Real SMTP mail sender — active when EMAIL_HOST env var is set and non-blank.
     * Includes sensible timeouts so email never hangs the calling thread forever.
     *
     * <p>All SMTP settings come directly from environment variables — no dependency
     * on Spring Boot's MailProperties. Only one bean (SMTP or NoOp) is active at runtime
     * thanks to @ConditionalOnExpression guards.
     */
    @Bean
    @ConditionalOnExpression("#{systemEnvironment['EMAIL_HOST'] != null && !systemEnvironment['EMAIL_HOST'].trim().isEmpty()}")
    public JavaMailSender smtpMailSender() {
        String host = System.getenv("EMAIL_HOST").trim();
        String portStr = System.getenv().getOrDefault("EMAIL_PORT", "587");
        String username = System.getenv("EMAIL_USERNAME");
        String password = System.getenv("EMAIL_PASSWORD");

        int port;
        try {
            port = Integer.parseInt(portStr.trim());
        } catch (NumberFormatException e) {
            logger.warn("[EmailConfig] EMAIL_PORT invalid ({}), defaulting to 587", portStr);
            port = 587;
        }

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", System.getenv().getOrDefault("EMAIL_TLS", "true"));
        props.put("mail.debug", "false");

        // ── Timeouts: never hang forever waiting for SMTP ──
        props.put("mail.smtp.connectiontimeout", "10000");  // 10s to establish TCP
        props.put("mail.smtp.timeout", "10000");            // 10s to read/write
        props.put("mail.smtp.writetimeout", "10000");       // 10s to write

        logger.info("[EmailConfig] Real SMTP sender initialised — host={} port={} user={} timeouts=10s",
                host, port, username);
        return mailSender;
    }

    /**
     * Fallback no-op mail sender — active when EMAIL_HOST is missing or blank.
     * Silently discards every message so the app boots without SMTP.
     */
    @Bean
    @ConditionalOnExpression("#{systemEnvironment['EMAIL_HOST'] == null || systemEnvironment['EMAIL_HOST'].trim().isEmpty()}")
    public JavaMailSender fallbackMailSender() {
        if (emailEnabled) {
            // Operator said email should be working, but we have no SMTP config
            logger.warn("[EmailConfig] app.email.enabled=true but EMAIL_HOST is not set. "
                    + "Email will NOT work. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, EMAIL_PASSWORD "
                    + "in the Render dashboard, or set app.email.enabled=false to suppress this warning.");
        } else {
            logger.info("[EmailConfig] EMAIL_HOST not set — using no-op mail sender. "
                    + "Email delivery is disabled. Set EMAIL_HOST + app.email.enabled=true to enable.");
        }
        return new NoOpMailSender();
    }

    /**
     * A {@link JavaMailSender} implementation that silently discards every message.
     * Used when SMTP env vars are not configured.
     */
    private static class NoOpMailSender extends JavaMailSenderImpl {
        @Override
        public void send(org.springframework.mail.SimpleMailMessage simpleMessage) {
            logger.debug("[NoOpMailSender] Email silently discarded: {}", simpleMessage.getSubject());
        }

        @Override
        public void send(org.springframework.mail.SimpleMailMessage... simpleMessages) {
            logger.debug("[NoOpMailSender] {} email(s) silently discarded", simpleMessages.length);
        }
    }
}
