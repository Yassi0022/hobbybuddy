package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
 *   <li><b>fallback</b> ({@code EmailConfig.FallbackMailSender}) — a no-op sender that
 *       silently discards every message.  Active when EMAIL_HOST is <b>not</b> set.
 *       This ensures the app always boots, even without SMTP configured.</li>
 * </ul>
 *
 * <h3>Required env vars for real email</h3>
 * <pre>
 *   EMAIL_HOST       — SMTP hostname, e.g. smtp.gmail.com
 *   EMAIL_PORT       — SMTP port (default 587)
 *   EMAIL_USERNAME   — SMTP login
 *   EMAIL_PASSWORD   — SMTP password or app-specific token
 *   EMAIL_FROM       — Envelope "From" address (e.g. no-reply@hobbybuddy.com)
 *   EMAIL_TLS        — true/false (default true)
 * </pre>
 */
@Configuration
public class EmailConfig {

    private static final Logger logger = LoggerFactory.getLogger(EmailConfig.class);

    /**
     * Real SMTP mail sender — active when EMAIL_HOST env var is set and non-blank.
     * No @Profile guard: condition is purely env-driven so it works in any profile
     * (prod, test, dev) as long as SMTP credentials are provided.
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

        logger.info("[EmailConfig] Real SMTP sender initialised — host={} port={} user={}",
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
        logger.warn("[EmailConfig] EMAIL_HOST not set — using no-op mail sender. " +
                "Email will not work until EMAIL_HOST, EMAIL_USERNAME, EMAIL_PASSWORD are configured.");
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
