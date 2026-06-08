package com.example.demo.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifies that the email configuration behaves correctly in the test profile.
 *
 * <p>In {@code test} profile the no-op {@link JavaMailSenderImpl} bean is created —
 * it should be possible to send through it without any SMTP env vars and without
 * exceptions.
 */
@SpringBootTest
@ActiveProfiles("test")
class EmailConfigIT {

    @Test
    @DisplayName("test profile provides a no-op JavaMailSender bean")
    void testProfileProvidesNoOpMailSender(ApplicationContext ctx) {
        JavaMailSender sender = ctx.getBean(JavaMailSender.class);
        assertNotNull(sender);
        assertInstanceOf(JavaMailSenderImpl.class, sender);

        // The dev/test sender has no host set — confirming it's the no-op bean,
        // not the prod bean that would have validated env vars.
        JavaMailSenderImpl impl = (JavaMailSenderImpl) sender;
        assertNull(impl.getHost(), "Dev/test mail sender should have no host");
    }

    @Test
    @DisplayName("registration works without SMTP — email is silently discarded")
    void registrationSucceedsWithoutSmtp(ApplicationContext ctx) {
        JavaMailSender sender = ctx.getBean(JavaMailSender.class);
        // The no-op sender accepts send without error
        org.springframework.mail.SimpleMailMessage msg = new org.springframework.mail.SimpleMailMessage();
        msg.setTo("test@example.com");
        msg.setSubject("Test");
        msg.setText("Hello");
        assertDoesNotThrow(() -> sender.send(msg),
                "No-op sender should never throw");
    }

    @Test
    @DisplayName("prod EmailStartupValidator bean is NOT loaded in test profile")
    void prodValidatorNotLoadedInTest(ApplicationContext ctx) {
        assertThrows(NoSuchBeanDefinitionException.class,
                () -> ctx.getBean(EmailStartupValidator.class),
                "EmailStartupValidator should not be loaded in test profile");
    }
}
