package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final com.example.demo.security.JwtUtil jwtUtil;
    private final JwtChannelInterceptor jwtChannelInterceptor;

    public WebSocketConfig(com.example.demo.security.JwtUtil jwtUtil, com.example.demo.config.JwtChannelInterceptor jwtChannelInterceptor) {
        this.jwtUtil = jwtUtil;
        this.jwtChannelInterceptor = jwtChannelInterceptor;
    }


    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Simple broker for topics
        config.enableSimpleBroker("/topic");
        // Application destination prefix for @MessageMapping routes
        config.setApplicationDestinationPrefixes("/app");
    }

    /**
     * Resolve allowed origins from the {@code FRONTEND_ORIGINS} environment variable.
     * Expected format: comma‑separated list of scheme://host[:port] entries.
     * If the variable is missing or empty, defaults to "http://localhost:3000" for local dev.
     */
    private String[] getAllowedOrigins() {
        String env = System.getenv("FRONTEND_ORIGINS");
        if (env == null || env.isBlank()) {
            return new String[]{"http://localhost:3000"};
        }
        return java.util.Arrays.stream(env.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
    }

    @Override
    public void configureClientInboundChannel(org.springframework.messaging.simp.config.ChannelRegistration registration) {
        // Register JWT interceptor for all inbound STOMP frames
        registration.interceptors(jwtChannelInterceptor);
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the STOMP endpoint.
        // Authentication is performed at the SockJS handshake: determineUser() reads the
        // JWT (supplied as a `?token=` query param by the client, falling back to the
        // Authorization header) and binds a Principal to the whole WebSocket session —
        // so every later STOMP frame (CONNECT/SEND/SUBSCRIBE) carries the principal.
        // This is the canonical approach for JWT-over-SockJS: SockJS transports
        // cannot set custom WebSocket headers, so the token travels in the URL.
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns(getAllowedOrigins())
                .setHandshakeHandler(handshakeHandler())
                .withSockJS();
    }

    /**
     * Bind the authenticated Principal to the WebSocket session at handshake time.
     * Returns null when no valid JWT is presented, leaving the session
     * unauthenticated (the channel interceptor then rejects all frames).
     */
    private HandshakeHandler handshakeHandler() {
        return new DefaultHandshakeHandler() {
            @Override
            protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
                String token = extractToken(request);
                if (token != null && jwtUtil.validateToken(token)) {
                    String username = jwtUtil.extractUsername(token);
                    // UsernamePasswordAuthenticationToken with non-empty authorities is
                    // treated as authenticated by Spring's messaging resolvers.
                    return new UsernamePasswordAuthenticationToken(username, null, List.of());
                }
                return null;
            }
        };
    }

    /**
     * Read the JWT from, in order: the `token` query parameter, then the
     * Authorization header. Returns null if neither yields a bearer token.
     */
    private String extractToken(ServerHttpRequest request) {
        String query = request.getURI().getQuery();
        if (query != null) {
            for (String pair : query.split("&")) {
                int idx = pair.indexOf('=');
                String key = idx > 0 ? pair.substring(0, idx) : pair;
                String value = idx > 0 ? pair.substring(idx + 1) : "";
                if ("token".equals(key) && !value.isEmpty()) {
                    return value;
                }
            }
        }
        String auth = request.getHeaders().getFirst("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return auth.substring(7);
        }
        return null;
    }
}
