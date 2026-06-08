package com.example.demo.controller;

import com.example.demo.model.InviteToken;
import com.example.demo.model.User;
import com.example.demo.repository.InviteTokenRepository;
import com.example.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Minimal referral / invite flow.
 * Verified users can generate a one-time invite token.
 * When a new user registers with that token and verifies their email,
 * the inviter receives a priority-match credit.
 */
@RestController
@RequestMapping("/api/invites")
public class InviteController {

    private static final Logger logger = LoggerFactory.getLogger(InviteController.class);

    private final InviteTokenRepository inviteTokenRepository;
    private final UserRepository userRepository;

    /** Base URL for constructing invite links (e.g. https://hobbybuddy.app). */
    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public InviteController(InviteTokenRepository inviteTokenRepository,
                            UserRepository userRepository) {
        this.inviteTokenRepository = inviteTokenRepository;
        this.userRepository = userRepository;
    }

    /**
     * Generate a one-time invite token for the authenticated user.
     * Returns a shareable link the inviter can send to friends.
     */
    @PostMapping
    public ResponseEntity<?> generate(Authentication auth) {
        User inviter = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));

        // Generate a random UUID as the raw token
        String rawToken = UUID.randomUUID().toString();

        // For simplicity, store the raw token directly (not hashed) since it's single-use
        // and expires. In production, consider hashing.
        InviteToken invite = new InviteToken();
        invite.setTokenHash(rawToken);
        invite.setInviter(inviter);
        invite.setExpiry(LocalDateTime.now().plusDays(7));
        invite.setUsed(false);
        inviteTokenRepository.save(invite);

        String inviteLink = frontendUrl + "/register?token=" + rawToken;

        logger.info("[REFERRAL] User {} generated invite token {}", inviter.getId(), invite.getId());

        return ResponseEntity.ok(Map.of(
                "inviteLink", inviteLink,
                "token", rawToken,
                "expiresAt", invite.getExpiry().toString()
        ));
    }
}
