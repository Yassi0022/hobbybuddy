package com.example.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

/**
 * Defense-in-depth guard on the client inbound channel.
 *
 * The authenticated {@link java.security.Principal} is bound to the whole
 * WebSocket session at the SockJS handshake (see {@link WebSocketConfig#determineUser}).
 * Because of how Spring's STOMP sub-protocol handler binds that principal, it
 * is NOT something a ChannelInterceptor can set after the fact — the interceptor
 * here therefore only enforces the contract: every frame (including CONNECT)
 * must carry a non-null user, otherwise it is rejected before reaching a controller.
 */
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(JwtChannelInterceptor.class);

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        StompCommand command = accessor.getCommand();
        if (command == null) {
            return message;
        }
        if (accessor.getUser() == null) {
            if (StompCommand.CONNECT.equals(command)) {
                logger.warn("WebSocket CONNECT rejected: no authenticated principal (handshake failed)");
            } else {
                logger.warn("WebSocket {} rejected: no authenticated user", command);
            }
            return null;
        }
        return message;
    }
}
