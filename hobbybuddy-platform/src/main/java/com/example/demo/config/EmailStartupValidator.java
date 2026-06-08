package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

/**
 * Validates SMTP connectivity at startup — only when EMAIL_HOST is configured.
 *
 * <p>Runs a lightweight {@code transport.connect()} against the configured SMTP
 * host.  If the connection fails the application refuses to start, preventing
 * a situation where users register but never receive verification emails.
 *
 * <p>When EMAIL_HOST is not set this bean is skipped entirely — the no-op
 * {@link JavaMailSender} requires no connectivity.
 */
@Component
@ConditionalOnExpression("#{systemEnvironment['EMAIL_HOST'] != null && !systemEnvironment['EMAIL_HOST'].trim().isEmpty()}")
public class EmailStartupValidator implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(EmailStartupValidator.class);

    private final JavaMailSender javaMailSender;

    public EmailStartupValidator(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    @Override
    public void run(String... args) {
        if (!(javaMailSender instanceof JavaMailSenderImpl impl)) {
            logger.warn("[EmailStartupValidator] JavaMailSender is not JavaMailSenderImpl — skipping connectivity check");
            return;
        }

        String host = impl.getHost();
        int port = impl.getPort();
        String username = impl.getUsername();

        logger.info("[EmailStartupValidator] Verifying SMTP connectivity to {}:{} …", host, port);

        try {
            // transport.connect() validates host/port/auth without sending a message
            jakarta.mail.Transport transport = impl.getSession().getTransport("smtp");
            transport.connect(host, port, username, impl.getPassword());
            transport.close();
            logger.info("[EmailStartupValidator] SMTP connectivity OK — host={} port={} user={}",
                    host, port, username);
        } catch (Exception e) {
            logger.error("[EmailStartupValidator] SMTP connectivity check FAILED — host={} port={} user={}: {}",
                    host, port, username, e.getMessage());
            throw new IllegalStateException(
                    "[EmailStartupValidator] Cannot connect to SMTP at " + host + ":" + port
                            + ". Fix EMAIL_HOST / EMAIL_PORT / EMAIL_USERNAME / EMAIL_PASSWORD.", e);
        }
    }
}
