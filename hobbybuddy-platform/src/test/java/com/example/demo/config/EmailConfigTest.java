package com.example.demo.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for {@link EmailConfig} bean creation and startup safety.
 *
 * <p>When EMAIL_HOST is not set (default in test), the fallback NoOpMailSender
 * should be the active JavaMailSender bean and the app should start cleanly.
 */
@SpringBootTest
@ActiveProfiles("test")
class EmailConfigTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private JavaMailSender javaMailSender;

    /**
     * The application context loads successfully with email disabled.
     * This is the core startup-safety test — the app must not crash when
     * EMAIL_HOST is not set.
     */
    @Test
    void contextLoadsWithEmailDisabled() {
        assertNotNull(applicationContext, "ApplicationContext should load");
    }

    /**
     * When EMAIL_HOST is not set, the fallback no-op mail sender should be
     * the active JavaMailSender bean.
     */
    @Test
    void fallbackMailSenderIsActiveWhenEmailHostNotSet() {
        assertNotNull(javaMailSender, "JavaMailSender bean should exist");
        // The NoOpMailSender is a private inner class extending JavaMailSenderImpl,
        // so we verify it's not a real SMTP sender (no host configured).
        if (javaMailSender instanceof JavaMailSenderImpl impl) {
            assertNull(impl.getHost(),
                    "Fallback sender should have no host configured");
        }
    }

    /**
     * Only one JavaMailSender bean should be registered — either SMTP or fallback,
     * never both. This prevents Spring's NoUniqueBeanDefinitionException.
     */
    @Test
    void onlyOneMailSenderBeanExists() {
        String[] beanNames = applicationContext.getBeanNamesForType(JavaMailSender.class);
        assertEquals(1, beanNames.length,
                "Exactly one JavaMailSender bean should exist, found: "
                        + String.join(", ", beanNames));
    }

    /**
     * The fallback bean should be named "fallbackMailSender" (the method name
     * in EmailConfig) when EMAIL_HOST is not set.
     */
    @Test
    void fallbackBeanNameIsCorrect() {
        String[] beanNames = applicationContext.getBeanNamesForType(JavaMailSender.class);
        assertEquals("fallbackMailSender", beanNames[0],
                "Fallback bean should be named 'fallbackMailSender'");
    }
}
