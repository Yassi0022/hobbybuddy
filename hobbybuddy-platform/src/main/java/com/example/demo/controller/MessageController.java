package com.example.demo.controller;

import com.example.demo.model.Message;
import com.example.demo.model.User;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.MatchRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private static final Logger logger = LoggerFactory.getLogger(MessageController.class);

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MatchRequestRepository matchRequestRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Get conversation between two users.
     * Only the two participants can read their conversation.
     */
    @GetMapping("/{user1}/{user2}")
    public ResponseEntity<?> getConversation(
            @PathVariable Long user1,
            @PathVariable Long user2,
            Authentication authentication) {

        User currentUser = getAuthenticatedUser(authentication);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Verify authenticated user is one of the two participants
        Long currentUserId = currentUser.getId();
        if (!currentUserId.equals(user1) && !currentUserId.equals(user2)) {
            logger.warn("[Messages] User {} attempted to read conversation between {} and {}",
                    currentUserId, user1, user2);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Require a CONFIRMED match between the authenticated user and the other participant
        Long otherId = currentUserId.equals(user1) ? user2 : user1;
        User other = userRepository.findById(otherId).orElse(null);
        if (other == null || !matchRequestRepository.existsConfirmedMatchBetween(currentUser, other)) {
            logger.warn("[Messages] User {} attempted to read conversation with non-match {}",
                    currentUserId, otherId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only view conversations with people you're matched with"));
        }

        List<Message> conversation = messageRepository.findConversation(user1, user2);
        return ResponseEntity.ok(conversation);
    }

    /**
     * Send a message via REST.
     * senderId is derived from the authenticated principal — never trusted from client input.
     */
    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody Message message, Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        // Derive sender from authentication — ignore any client-provided senderId
        message.setSenderId(currentUser.getId());

        if (message.getReceiverId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Receiver ID is required"));
        }

        // Prevent sending to self
        if (message.getSenderId().equals(message.getReceiverId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot send message to yourself"));
        }

        // Verify receiver exists
        if (message.getReceiverId() != null && !userRepository.existsById(message.getReceiverId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Receiver not found"));
        }

        // Require a CONFIRMED match before allowing a message
        User receiver = userRepository.findById(message.getReceiverId()).orElse(null);
        if (receiver == null || !matchRequestRepository.existsConfirmedMatchBetween(currentUser, receiver)) {
            logger.warn("[Messages] User {} attempted to message non-match {}", currentUser.getId(), message.getReceiverId());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only message people you're matched with"));
        }

        if (message.getTimestamp() == null) {
            message.setTimestamp(java.time.LocalDateTime.now());
        }

        Message savedMessage = messageRepository.save(message);
        messagingTemplate.convertAndSend("/topic/chat/" + message.getReceiverId(), savedMessage);
        return ResponseEntity.ok(savedMessage);
    }

    /**
     * WebSocket STOMP endpoint.
     * Sender is derived from the authenticated principal via Spring Security's
     * WebSocket authentication (the user must be authenticated to connect).
     *
     * NOTE: Full WebSocket auth requires a channel interceptor that validates
     * the JWT token on STOMP CONNECT. See WebSocketSecurityConfig.
     * For now, this endpoint derives the sender from the message principal
     * set by Spring Security's built-in WebSocket authentication.
     */
    @MessageMapping("/chat.send")
    public void handleWebSocketMessage(Message message, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            logger.warn("[Messages] Unauthenticated WebSocket message attempt — ignored");
            return;
        }

        User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (currentUser == null) {
            logger.warn("[Messages] WebSocket message from unknown user — ignored");
            return;
        }

        // Derive sender from authentication — ignore client-provided senderId
        message.setSenderId(currentUser.getId());

        if (message.getReceiverId() == null || message.getSenderId().equals(message.getReceiverId())) {
            logger.warn("[Messages] Invalid WebSocket message from user {} — ignored", currentUser.getId());
            return;
        }

        // Require a CONFIRMED match before persisting or broadcasting
        User receiver = userRepository.findById(message.getReceiverId()).orElse(null);
        if (receiver == null || !matchRequestRepository.existsConfirmedMatchBetween(currentUser, receiver)) {
            logger.warn("[Messages] Blocked WebSocket message from {} to {} — no confirmed match",
                    currentUser.getId(), message.getReceiverId());
            return;
        }

        if (message.getTimestamp() == null) {
            message.setTimestamp(java.time.LocalDateTime.now());
        }

        Message savedMessage = messageRepository.save(message);
        messagingTemplate.convertAndSend("/topic/chat/" + message.getReceiverId(), savedMessage);
    }

    /**
     * Inbox: all distinct conversations for the current user, ordered by the
     * latest message (newest first). Only surfaces partners with a confirmed match.
     */
    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }

        List<Message> all = messageRepository.findAllForUser(currentUser.getId());
        // newest-first ordering means the first message seen per partner is the latest
        Map<Long, Message> latestByPartner = new LinkedHashMap<>();
        for (Message m : all) {
            Long partnerId = m.getSenderId().equals(currentUser.getId()) ? m.getReceiverId() : m.getSenderId();
            latestByPartner.putIfAbsent(partnerId, m);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<Long, Message> entry : latestByPartner.entrySet()) {
            Long partnerId = entry.getKey();
            Message m = entry.getValue();
            User partner = userRepository.findById(partnerId).orElse(null);
            if (partner == null) continue;
            if (!matchRequestRepository.existsConfirmedMatchBetween(currentUser, partner)) continue;

            Map<String, Object> conv = new LinkedHashMap<>();
            conv.put("partnerId", partnerId);
            conv.put("partnerName", partner.getName() != null ? partner.getName() : "");
            conv.put("partnerArchetype", partner.getArchetype() != null ? partner.getArchetype() : "");
            conv.put("partnerCity", partner.getCity() != null ? partner.getCity() : "");

            Map<String, Object> last = new LinkedHashMap<>();
            last.put("content", m.getContent());
            last.put("timestamp", m.getTimestamp() != null ? m.getTimestamp().toString() : null);
            last.put("senderId", m.getSenderId());
            conv.put("lastMessage", last);
            conv.put("lastMessageAt", m.getTimestamp() != null ? m.getTimestamp().toString() : null);

            result.add(conv);
        }
        return ResponseEntity.ok(result);
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }
}

