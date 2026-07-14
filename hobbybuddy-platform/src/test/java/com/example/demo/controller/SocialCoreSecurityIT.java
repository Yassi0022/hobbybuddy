package com.example.demo.controller;

import com.example.demo.model.MatchRequest;
import com.example.demo.model.User;
import com.example.demo.repository.MatchRequestRepository;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SocialCoreSecurityIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private MatchRequestRepository matchRequestRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private PasswordResetTokenRepository passwordResetTokenRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    private final ObjectMapper om = new ObjectMapper();

    private String userAToken, userBToken, userCToken;
    private Long userAId, userBId, userCId;

    @BeforeEach
    void setUp() {
        messageRepository.deleteAll();
        matchRequestRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        User a = new User();
        a.setEmail("a@test.com");
        a.setPassword(passwordEncoder.encode("pass123"));
        a.setEmailVerified(true);
        a.setName("Alice");
        a.setArchetype("The Champion");
        a.setHobbies("hiking,reading");
        a.setCity("Rome");
        a.setAge(28);
        a = userRepository.save(a);
        userAId = a.getId();
        userAToken = jwtUtil.generateToken(a.getEmail());

        User b = new User();
        b.setEmail("b@test.com");
        b.setPassword(passwordEncoder.encode("pass456"));
        b.setEmailVerified(true);
        b.setName("Bob");
        b.setArchetype("The Explorer");
        b.setCity("Milan");
        b.setAge(31);
        b = userRepository.save(b);
        userBId = b.getId();
        userBToken = jwtUtil.generateToken(b.getEmail());

        User c = new User();
        c.setEmail("c@test.com");
        c.setPassword(passwordEncoder.encode("pass789"));
        c.setEmailVerified(true);
        c.setName("Charlie");
        c = userRepository.save(c);
        userCId = c.getId();
        userCToken = jwtUtil.generateToken(c.getEmail());
    }

    // ── P1: Public profile sanitization ──

    @Test
    void publicProfileReturnsSanitizedFieldsAndNoSecrets() throws Exception {
        String body = mockMvc.perform(get("/api/users/{id}/public", userBId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userBId.intValue()))
                .andExpect(jsonPath("$.name").value("Bob"))
                .andExpect(jsonPath("$.archetypeEmoji").exists())
                .andExpect(jsonPath("$.connectionStatus").value("none"))
                .andReturn().getResponse().getContentAsString();

        JsonNode node = om.readTree(body);
        // Private / internal fields must never be present
        String[] forbidden = {"email", "traits", "authVersion", "openness", "conscientiousness",
                "extraversion", "agreeableness", "neuroticism", "password", "token", "priorityMatchAvailable"};
        for (String f : forbidden) {
            if (node.has(f)) {
                throw new AssertionError("Public profile leaked forbidden field: " + f);
            }
        }
    }

    @Test
    void publicProfileRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/users/{id}/public", userBId))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicProfileNotFoundForUnknownUser() throws Exception {
        mockMvc.perform(get("/api/users/{id}/public", 99999L)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void publicProfileShowsPendingReceivedWhenOtherRequested() throws Exception {
        // A requests B; B viewing A sees pending_received
        String created = mockMvc.perform(post("/api/match-requests/{candidateId}", userBId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long mrId = om.readTree(created).get("id").asLong();

        mockMvc.perform(get("/api/users/{id}/public", userAId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.connectionStatus").value("pending_received"))
                .andExpect(jsonPath("$.matchRequestId").value(mrId.intValue()))
                .andExpect(jsonPath("$.matchRole").value("candidate"));
    }

    // ── P2: Decline authorization ──

    @Test
    void candidateCanDeclinePendingRequest() throws Exception {
        Long mrId = createRequest(userAToken, userBId);

        mockMvc.perform(post("/api/match-requests/{id}/decline", mrId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DECLINED"))
                .andExpect(jsonPath("$.candidateId").value(userBId.intValue()));
    }

    @Test
    void nonCandidateCannotDecline() throws Exception {
        Long mrId = createRequest(userAToken, userBId);

        // C is not the candidate -> 403
        mockMvc.perform(post("/api/match-requests/{id}/decline", mrId)
                        .header("Authorization", "Bearer " + userCToken))
                .andExpect(status().isForbidden());

        // Requester A is not the candidate -> 403
        mockMvc.perform(post("/api/match-requests/{id}/decline", mrId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void declinePersistsAndHidesMessageCta() throws Exception {
        Long mrId = createRequest(userAToken, userBId);
        mockMvc.perform(post("/api/match-requests/{id}/decline", mrId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DECLINED"));

        // Declined request -> connectionStatus none, no matchRequestId (no Message CTA)
        mockMvc.perform(get("/api/users/{id}/public", userAId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.connectionStatus").value("none"));
    }

    @Test
    void declineOnNonPendingIsConflict() throws Exception {
        Long mrId = createRequest(userAToken, userBId);
        // Confirm first
        mockMvc.perform(patch("/api/match-requests/{id}/confirm", mrId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk());
        // Now decline -> 409 (already confirmed)
        mockMvc.perform(post("/api/match-requests/{id}/decline", mrId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isConflict());
    }

    @Test
    void nonCandidateCannotConfirm() throws Exception {
        Long mrId = createRequest(userAToken, userBId);
        // C is not the candidate -> 403
        mockMvc.perform(patch("/api/match-requests/{id}/confirm", mrId)
                        .header("Authorization", "Bearer " + userCToken))
                .andExpect(status().isForbidden());
    }

    // ── P3: Messaging gating ──

    @Test
    void messageForbiddenWithoutConfirmedMatch() throws Exception {
        // A and B are NOT matched; A attempts to message B -> 403
        String body = "{\"receiverId\": " + userBId + ", \"content\": \"Hi\"}";
        mockMvc.perform(post("/api/messages")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    void conversationForbiddenWithoutConfirmedMatch() throws Exception {
        mockMvc.perform(get("/api/messages/{u1}/{u2}", userAId, userBId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void unmatchedUserCForbiddenToReadOrSend() throws Exception {
        // Establish a confirmed match A<->B first
        Long mrId = createRequest(userAToken, userBId);
        mockMvc.perform(patch("/api/match-requests/{id}/confirm", mrId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk());

        // C tries to read A<->B conversation -> 403 (not a participant)
        mockMvc.perform(get("/api/messages/{u1}/{u2}", userAId, userBId)
                        .header("Authorization", "Bearer " + userCToken))
                .andExpect(status().isForbidden());

        // C tries to message A -> 403 (no confirmed match)
        String body = "{\"receiverId\": " + userAId + ", \"content\": \"Hi from C\"}";
        mockMvc.perform(post("/api/messages")
                        .header("Authorization", "Bearer " + userCToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    void confirmedMatchAllowsMessagingAndConversation() throws Exception {
        Long mrId = createRequest(userAToken, userBId);
        mockMvc.perform(patch("/api/match-requests/{id}/confirm", mrId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk());

        String send = "{\"receiverId\": " + userBId + ", \"content\": \"Hey Bob!\"}";
        mockMvc.perform(post("/api/messages")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(send))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/messages/{u1}/{u2}", userAId, userBId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].content").value("Hey Bob!"));
    }

    @Test
    void conversationsOnlySurfacesConfirmedPartners() throws Exception {
        // No match -> empty inbox
        mockMvc.perform(get("/api/messages/conversations")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        // Confirm A<->B
        Long mrId = createRequest(userAToken, userBId);
        mockMvc.perform(patch("/api/match-requests/{id}/confirm", mrId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk());

        String send = "{\"receiverId\": " + userBId + ", \"content\": \"Hello\"}";
        mockMvc.perform(post("/api/messages")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(send))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/messages/conversations")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].partnerId").value(userBId.intValue()))
                .andExpect(jsonPath("$[0].lastMessage.content").value("Hello"));
    }

    private Long createRequest(String requesterToken, Long candidateId) throws Exception {
        String created = mockMvc.perform(post("/api/match-requests/{candidateId}", candidateId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return om.readTree(created).get("id").asLong();
    }
}
