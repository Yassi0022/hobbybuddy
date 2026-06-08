package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.MatchRequestRepository;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MessageControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private MatchRequestRepository matchRequestRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private final ObjectMapper om = new ObjectMapper();

    private String userAToken;
    private String userBToken;
    private Long userAId;
    private Long userBId;

    @BeforeEach
    void setUp() {
        // Clean up in FK-safe order
        messageRepository.deleteAll();
        matchRequestRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        User a = new User();
        a.setEmail("a@test.com");
        a.setPassword(passwordEncoder.encode("pass123"));
        a.setEmailVerified(true);
        a.setName("Alice");
        a = userRepository.save(a);
        userAId = a.getId();
        userAToken = jwtUtil.generateToken(a.getEmail());

        User b = new User();
        b.setEmail("b@test.com");
        b.setPassword(passwordEncoder.encode("pass456"));
        b.setEmailVerified(true);
        b.setName("Bob");
        b = userRepository.save(b);
        userBId = b.getId();
        userBToken = jwtUtil.generateToken(b.getEmail());
    }

    // ── GET /api/messages/{user1}/{user2} ──

    // 1. Participant A can read conversation
    @Test
    void getConversationAsParticipantA() throws Exception {
        mockMvc.perform(get("/api/messages/{user1}/{user2}", userAId, userBId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // 2. Participant B can read conversation
    @Test
    void getConversationAsParticipantB() throws Exception {
        mockMvc.perform(get("/api/messages/{user1}/{user2}", userAId, userBId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    // 3. Non-participant cannot read conversation -> 403
    @Test
    void getConversationForbiddenForNonParticipant() throws Exception {
        User c = new User();
        c.setEmail("c@test.com");
        c.setPassword(passwordEncoder.encode("pass789"));
        c.setEmailVerified(true);
        c.setName("Charlie");
        c = userRepository.save(c);
        String userCToken = jwtUtil.generateToken(c.getEmail());

        mockMvc.perform(get("/api/messages/{user1}/{user2}", userAId, userBId)
                        .header("Authorization", "Bearer " + userCToken))
                .andExpect(status().isForbidden());
    }

    // 4. Unauthenticated -> 401
    @Test
    void getConversationUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/messages/{user1}/{user2}", userAId, userBId))
                .andExpect(status().isUnauthorized());
    }

    // 5. After sending a message, conversation includes it
    @Test
    void getConversationAfterSendingMessage() throws Exception {
        // A sends a message to B
        String body = "{\"receiverId\": " + userBId + ", \"content\": \"Hello Bob!\"}";
        mockMvc.perform(post("/api/messages")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        // A reads the conversation — should see 1 message
        mockMvc.perform(get("/api/messages/{user1}/{user2}", userAId, userBId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].content").value("Hello Bob!"))
                .andExpect(jsonPath("$[0].senderId").value(userAId.intValue()))
                .andExpect(jsonPath("$[0].receiverId").value(userBId.intValue()));
    }

    // ── POST /api/messages ──

    // 6. Authenticated send -> 201 with saved message
    @Test
    void sendMessageSuccess() throws Exception {
        String body = "{\"receiverId\": " + userBId + ", \"content\": \"Hey there!\"}";

        mockMvc.perform(post("/api/messages")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.senderId").value(userAId.intValue()))
                .andExpect(jsonPath("$.receiverId").value(userBId.intValue()))
                .andExpect(jsonPath("$.content").value("Hey there!"))
                .andExpect(jsonPath("$.timestamp").isString());
    }

    // 7. Unauthenticated send -> 401
    @Test
    void sendMessageUnauthenticated() throws Exception {
        String body = "{\"receiverId\": " + userBId + ", \"content\": \"Hey\"}";

        mockMvc.perform(post("/api/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    // 8. Send to self -> 400
    @Test
    void sendMessageToSelf() throws Exception {
        String body = "{\"receiverId\": " + userAId + ", \"content\": \"To myself\"}";

        mockMvc.perform(post("/api/messages")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Cannot send message to yourself"));
    }

    // 9. Send to nonexistent user -> 400
    @Test
    void sendMessageToNonexistentUser() throws Exception {
        String body = "{\"receiverId\": 99999, \"content\": \"To no one\"}";

        mockMvc.perform(post("/api/messages")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Receiver not found"));
    }

    // 10. Send with null receiver -> 400
    @Test
    void sendMessageNullReceiver() throws Exception {
        String body = "{\"content\": \"No receiver\"}";

        mockMvc.perform(post("/api/messages")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Receiver ID is required"));
    }

    // 11. Sender is derived from auth, not from client input
    @Test
    void senderDerivedFromAuthNotClientInput() throws Exception {
        // Try to spoof senderId as userB, but authenticated as userA
        String body = "{\"receiverId\": " + userBId + ", \"content\": \"Spoofed\", \"senderId\": " + userBId + "}";

        mockMvc.perform(post("/api/messages")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.senderId").value(userAId.intValue()));
    }

    // 12. Conversation is ordered by id (insertion order)
    @Test
    void conversationOrderedById() throws Exception {
        // Send 3 messages
        for (int i = 1; i <= 3; i++) {
            String body = "{\"receiverId\": " + userBId + ", \"content\": \"Message " + i + "\"}";
            mockMvc.perform(post("/api/messages")
                            .header("Authorization", "Bearer " + userAToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk());
        }

        // Read conversation — should be ordered
        mockMvc.perform(get("/api/messages/{user1}/{user2}", userAId, userBId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].content").value("Message 1"))
                .andExpect(jsonPath("$[1].content").value("Message 2"))
                .andExpect(jsonPath("$[2].content").value("Message 3"));
    }
}
