package com.example.demo.config;

import com.example.demo.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

/**
 * Interceptor that enforces JWT authentication on all STOMP frames.
 * For CONNECT frames it validates the token provided via the "Authorization" header.
 * For all other frames it requires a non‑null user principal (set by the CONNECT handling).
 */
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(JwtChannelInterceptor.class);
    private final JwtUtil jwtUtil;

    public JwtChannelInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        StompCommand command = accessor.getCommand();
        if (command == null) {
            return message;
        }
        // CONNECT: validate token and set principal
        if (StompCommand.CONNECT.equals(command)) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                logger.warn("WebSocket CONNECT without valid Authorization header");
                return null; // reject
            }
            String token = authHeader.substring(7);
            if (!jwtUtil.validateToken(token)) {
                logger.warn("WebSocket CONNECT with invalid JWT");
                return null;
            }
            try {
                String username = jwtUtil.extractUsername(token);
                accessor.setUser(() -> username);
            } catch (Exception e) {
                logger.warn("WebSocket CONNECT token parsing failed", e);
                return null;
            }
        } else {
            // For any other frame, ensure authentication was set during CONNECT
            if (accessor.getUser() == null) {
                logger.warn("WebSocket {} without authenticated user", command);
                return null;
            }
        }
        return message;
    }
}
