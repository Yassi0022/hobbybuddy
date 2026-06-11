package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.Map;

/**
 * Health endpoint for Render health checks and uptime monitors.
 *
 * <p>Render pings this endpoint periodically. A 200 response means the app is alive.
 * Returns basic runtime info (uptime, version) without exposing sensitive details.
 */
@RestController
public class HealthController {

    private static final long STARTUP_TIME = System.currentTimeMillis();

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        long uptimeMs = System.currentTimeMillis() - STARTUP_TIME;
        return Map.of(
                "status", "ok",
                "uptime", uptimeMs + "ms",
                "timestamp", Instant.now().toString()
        );
    }
}
