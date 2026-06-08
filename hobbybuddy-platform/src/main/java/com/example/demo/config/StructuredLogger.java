package com.example.demo.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Helper to emit consistent JSON‑line security events.
 * Usage: StructuredLogger.log("EVENT_TYPE", mapOf("key",value,...));
 * The logger writes at INFO level – configure your logging stack to capture JSON lines.
 */
public class StructuredLogger {
    private static final Logger logger = LoggerFactory.getLogger("SECURITY");
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void log(String event, Map<String, Object> data) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("timestamp", Instant.now().toString());
        payload.put("event", event);
        payload.putAll(data);
        try {
            logger.info(mapper.writeValueAsString(payload));
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize security log", e);
        }
    }
}
