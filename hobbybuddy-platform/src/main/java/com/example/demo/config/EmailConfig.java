package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Email configuration driven entirely by environment variables.
 *
 * <p>Two beans are defined:
 * <ul>
 *   <li><b>prod</b> ({@code EmailConfig.ProdMailSender}) — real SMTP sender that validates
 *       required env vars at construction time.  Missing or blank variables cause an
 *       {@link IllegalStateException} at startup so the app never boots with silent
 *       email failure.</li>
 *   <li><b>default / test</b> ({@code EmailConfig.DevMailSender}) — a no-op sender that
 *       silently discards every message.  No SMTP env vars needed.  This is active for
 *       the {@code test} profile and any local-dev scenario where SMTP is unavailable.</li>
 * </ul>
 *
 * <h3>Required env vars (prod only)</h3>
 * <pre>
 *   EMAIL_HOST       — SMTP hostname, e.g. smtp.gmail.com
 *   EMAIL_PORT       — SMTP port (default 587)
 *   EMAIL_USERNAME   ─ SMTP login
 *   EMAIL_PASSWORD   — SMTP password or app-specific token
 *   EMAIL_FROM       — Envelope "From" address (e.g. no-reply@hobbybuddy.com)
 *   EMAIL_TLS        — true/false (default true)
 * </pre>
 */
@Configuration
public class EmailConfig {

    private static final Logger logger = LoggerFactory.getLogger(EmailConfig.class);

    /**
     * Real SMTP mail sender — active only in the {@code prod} profile.
     * Validates every required env var at bean-creation time so an invalid
     * configuration fails fast at startup rather than silently at first send.
     */
    @Bean
    @Profile("prod")
    public JavaMailSender javaMailSender() {
        String host = requireEnv("EMAIL_HOST");
        String portStr = System.getenv().getOrDefault("EMAIL_PORT", "587");
        String username = requireEnv("EMAIL_USERNAME");
        String password = requireEnv("EMAIL_PASSWORD");

        int port;
        try {
            port = Integer.parseInt(portStr);
        } catch (NumberFormatException e) {
            throw new IllegalStateException(
                    "[EmailConfig] EMAIL_PORT must be a valid integer, got: " + portStr);
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

        logger.info("[EmailConfig] Prod SMTP sender initialised — host={} port={} user={}",
                host, port, username);
        return mailSender;
    }

    /**
     * No-op mail sender — active for every profile <b>except</b> {@code prod}.
     * Silently discards every message so tests and local dev work without SMTP.
     */
    @Bean
    @Profile("!prod")
    public JavaMailSender devMailSender() {
        logger.info("[EmailConfig] Dev/test no-op mail sender active — emails are not sent");
        return new NoOpMailSender();
    }

    /**
     * A {@link JavaMailSender} implementation that silently discards every message.
     * Used in dev/test profiles where no SMTP server is available.
     */
    private static class NoOpMailSender extends JavaMailSenderImpl {
        @Override
        public void send(org.springframework.mail.SimpleMailMessage simpleMessage) {
            // silently discard
        }

        @Override
        public void send(org.springframework.mail.SimpleMailMessage... simpleMessages) {
            // silently discard
        }
    }

    /**
     * Returns the value for the given environment variable name,
     * throwing {@link IllegalStateException} if it is missing or blank.
     */
    private static String requireEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "[EmailConfig] Missing required env var: " + name
                            + ". Email will not work without it.");
        }
        return value;
    }
}
