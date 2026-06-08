package com.example.demo.config;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Actuator configuration – exposes health checks and metrics.
 * Includes a lightweight {@code dbBackupHealth} indicator that runs a simple
 * {@code SELECT 1} against the primary DataSource. This lets ops verify that the
 * database is reachable (and thus backup‑ready) without performing any data
 * mutation.
 */
@Configuration
public class ActuatorConfig {

    /**
     * Simple health indicator used by the backup‑restore SOP.
     * Returns {@code UP} when a {@code SELECT 1} succeeds, {@code DOWN} otherwise.
     * Exposed at {@code /actuator/health/backup} (included via the generic
     * actuator endpoint exposure configuration).
     */
    @Bean
    public HealthIndicator dbBackupHealth(DataSource dataSource) {
        return () -> {
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                stmt.execute("SELECT 1");
                return Health.up().withDetail("backupReady", true).build();
            } catch (Exception e) {
                return Health.down(e).withDetail("backupReady", false).build();
            }
        };
    }
}
