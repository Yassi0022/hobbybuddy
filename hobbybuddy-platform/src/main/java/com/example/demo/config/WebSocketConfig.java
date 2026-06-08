package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

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
        // Register the STOMP endpoint
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns(getAllowedOrigins())
                .withSockJS();
    }
}
