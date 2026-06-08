package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.MatchRequestFeedbackRepository;
import com.example.demo.repository.MatchRequestRepository;
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
class MatchRequestControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MatchRequestRepository matchRequestRepository;

    @Autowired
    private MatchRequestFeedbackRepository feedbackRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private final ObjectMapper om = new ObjectMapper();

    private String userAToken;
    private String userBToken;
    private Long userAId;
    private Long userBId;

    @BeforeEach
    void setUp() {
        // Clean up in FK-safe order (child tables first)
        feedbackRepository.deleteAll();
        matchRequestRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        // Create two verified users
        User a = new User();
        a.setEmail("a@test.com");
        a.setPassword(passwordEncoder.encode("pass123"));
        a.setEmailVerified(true);
        a = userRepository.save(a);
        userAId = a.getId();
        userAToken = jwtUtil.generateToken(a.getEmail());

        User b = new User();
        b.setEmail("b@test.com");
        b.setPassword(passwordEncoder.encode("pass456"));
        b.setEmailVerified(true);
        b = userRepository.save(b);
        userBId = b.getId();
        userBToken = jwtUtil.generateToken(b.getEmail());
    }

    // A. Unauthenticated list -> 401
    @Test
    void listMatchRequestsUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/match-requests"))
                .andExpect(status().isUnauthorized());
    }

    // B. Authenticated with no requests -> 200 empty list
    @Test
    void listMatchRequestsEmpty() throws Exception {
        mockMvc.perform(get("/api/match-requests")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matchRequests").isArray())
                .andExpect(jsonPath("$.matchRequests.length()").value(0));
    }

    // C. Authenticated with a confirmed request -> includes buddy details
    @Test
    void listMatchRequestsWithConfirmed() throws Exception {
        // Create request from A to B, then B confirms
        Long requestId = createPendingRequest();
        mockMvc.perform(patch("/api/match-requests/{id}/confirm", requestId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk());

        // A sees the confirmed request with buddy info
        mockMvc.perform(get("/api/match-requests")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matchRequests").isArray())
                .andExpect(jsonPath("$.matchRequests.length()").value(1))
                .andExpect(jsonPath("$.matchRequests[0].id").value(requestId))
                .andExpect(jsonPath("$.matchRequests[0].status").value("CONFIRMED"))
                .andExpect(jsonPath("$.matchRequests[0].role").value("requester"))
                .andExpect(jsonPath("$.matchRequests[0].buddyId").value(userBId))
                .andExpect(jsonPath("$.matchRequests[0].buddyName").value(""));
    }

    // D. B sees the same request as candidate
    @Test
    void listMatchRequestsFromCandidatePerspective() throws Exception {
        Long requestId = createPendingRequest();
        mockMvc.perform(patch("/api/match-requests/{id}/confirm", requestId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/match-requests")
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matchRequests.length()").value(1))
                .andExpect(jsonPath("$.matchRequests[0].role").value("candidate"))
                .andExpect(jsonPath("$.matchRequests[0].buddyId").value(userAId));
    }

    // 1. Authenticated user creates a match request -> 201 PENDING
    @Test
    void createMatchRequestSuccess() throws Exception {
        mockMvc.perform(post("/api/match-requests/{candidateId}", userBId)
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.requesterId").value(userAId))
                .andExpect(jsonPath("$.candidateId").value(userBId));
    }

    // 2. Unauthenticated request -> 401
    @Test
    void createMatchRequestUnauthenticated() throws Exception {
        mockMvc.perform(post("/api/match-requests/{candidateId}", userBId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // 3. Self-request -> 400
    @Test
    void createMatchRequestSelf() throws Exception {
        mockMvc.perform(post("/api/match-requests/{candidateId}", userAId)
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Cannot request a match with yourself"));
    }

    // 4. Candidate not found -> 404
    @Test
    void createMatchRequestCandidateNotFound() throws Exception {
        mockMvc.perform(post("/api/match-requests/{candidateId}", 99999L)
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Candidate user not found"));
    }

    // 5. Duplicate pending request -> 409
    @Test
    void createMatchRequestDuplicate() throws Exception {
        // First request – should succeed
        mockMvc.perform(post("/api/match-requests/{candidateId}", userBId)
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        // Duplicate – should conflict
        mockMvc.perform(post("/api/match-requests/{candidateId}", userBId)
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("A pending match request already exists"));
    }

    // Helper: create a pending match request and return its id
    private Long createPendingRequest() throws Exception {
        var resultActions = mockMvc.perform(post("/api/match-requests/{candidateId}", userBId)
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());
        var content = resultActions.andReturn().getResponse().getContentAsString();
        return om.readTree(content).get("id").asLong();
    }

    // 6. Candidate confirms a pending request -> 200 CONFIRMED
    @Test
    void confirmMatchRequestSuccess() throws Exception {
        Long requestId = createPendingRequest();

        mockMvc.perform(patch("/api/match-requests/{id}/confirm", requestId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(requestId))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.requesterId").value(userAId))
                .andExpect(jsonPath("$.candidateId").value(userBId));
    }

    // 7. Requester tries to confirm -> 403
    @Test
    void confirmMatchRequestForbiddenForRequester() throws Exception {
        Long requestId = createPendingRequest();

        mockMvc.perform(patch("/api/match-requests/{id}/confirm", requestId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Only the candidate can confirm this request"));
    }

    // 8. Unauthenticated confirm -> 401
    @Test
    void confirmMatchRequestUnauthenticated() throws Exception {
        Long requestId = createPendingRequest();

        mockMvc.perform(patch("/api/match-requests/{id}/confirm", requestId))
                .andExpect(status().isUnauthorized());
    }

    // 9. Missing request id -> 404
    @Test
    void confirmMatchRequestNotFound() throws Exception {
        mockMvc.perform(patch("/api/match-requests/{id}/confirm", 99999L)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Match request not found"));
    }

    // 10. Already confirmed request -> 409
    @Test
    void confirmMatchRequestAlreadyConfirmed() throws Exception {
        Long requestId = createPendingRequest();

        // Confirm once
        mockMvc.perform(patch("/api/match-requests/{id}/confirm", requestId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk());

        // Try to confirm again
        mockMvc.perform(patch("/api/match-requests/{id}/confirm", requestId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Match request is already confirmed"));
    }

    // Helper: create a pending request and confirm it, return the confirmed request id
    private Long createConfirmedRequest() throws Exception {
        Long requestId = createPendingRequest();
        mockMvc.perform(patch("/api/match-requests/{id}/confirm", requestId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk());
        return requestId;
    }

    // 11. Candidate submits feedback on confirmed match -> 201
    @Test
    void submitFeedbackSuccess() throws Exception {
        Long requestId = createConfirmedRequest();

        String feedbackJson = "{\"rating\": 5, \"comment\": \"Great buddy!\"}";

        mockMvc.perform(post("/api/match-requests/{id}/feedback", requestId)
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(feedbackJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.matchRequestId").value(requestId))
                .andExpect(jsonPath("$.authorId").value(userBId))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("Great buddy!"));
    }

    // 12. Requester submits feedback on confirmed match -> 201
    @Test
    void submitFeedbackRequesterSuccess() throws Exception {
        Long requestId = createConfirmedRequest();

        String feedbackJson = "{\"rating\": 4}";

        mockMvc.perform(post("/api/match-requests/{id}/feedback", requestId)
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(feedbackJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(4));
    }

    // 13. Unauthenticated feedback -> 401
    @Test
    void submitFeedbackUnauthenticated() throws Exception {
        Long requestId = createConfirmedRequest();

        String feedbackJson = "{\"rating\": 5}";

        mockMvc.perform(post("/api/match-requests/{id}/feedback", requestId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(feedbackJson))
                .andExpect(status().isUnauthorized());
    }

    // 14. Feedback on non-existent request -> 404
    @Test
    void submitFeedbackRequestNotFound() throws Exception {
        String feedbackJson = "{\"rating\": 5}";

        mockMvc.perform(post("/api/match-requests/{id}/feedback", 99999L)
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(feedbackJson))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Match request not found"));
    }

    // 15. Feedback on pending (not confirmed) request -> 409
    @Test
    void submitFeedbackOnPendingRequest() throws Exception {
        Long requestId = createPendingRequest(); // not confirmed

        String feedbackJson = "{\"rating\": 5}";

        mockMvc.perform(post("/api/match-requests/{id}/feedback", requestId)
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(feedbackJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Feedback is only allowed after the match is confirmed"));
    }

    // 16. Non-participant tries to submit feedback -> 403
    @Test
    void submitFeedbackForbiddenForNonParticipant() throws Exception {
        // Create a third user
        User c = new User();
        c.setEmail("c@test.com");
        c.setPassword(passwordEncoder.encode("pass789"));
        c.setEmailVerified(true);
        c = userRepository.save(c);
        String userCToken = jwtUtil.generateToken(c.getEmail());

        Long requestId = createConfirmedRequest();

        String feedbackJson = "{\"rating\": 5}";

        mockMvc.perform(post("/api/match-requests/{id}/feedback", requestId)
                        .header("Authorization", "Bearer " + userCToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(feedbackJson))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Only participants of this match can submit feedback"));
    }

    // 17. Duplicate feedback from same user -> 409
    @Test
    void submitFeedbackDuplicate() throws Exception {
        Long requestId = createConfirmedRequest();

        String feedbackJson = "{\"rating\": 5}";

        // First submission
        mockMvc.perform(post("/api/match-requests/{id}/feedback", requestId)
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(feedbackJson))
                .andExpect(status().isCreated());

        // Duplicate
        mockMvc.perform(post("/api/match-requests/{id}/feedback", requestId)
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(feedbackJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("You have already submitted feedback for this match"));
    }

    // 18. Missing rating -> 400
    @Test
    void submitFeedbackMissingRating() throws Exception {
        Long requestId = createConfirmedRequest();

        String feedbackJson = "{\"comment\": \"No rating\"}";

        mockMvc.perform(post("/api/match-requests/{id}/feedback", requestId)
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(feedbackJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Rating is required"));
    }

    // 19. Invalid rating (out of range) -> 400
    @Test
    void submitFeedbackInvalidRating() throws Exception {
        Long requestId = createConfirmedRequest();

        String feedbackJson = "{\"rating\": 6}";

        mockMvc.perform(post("/api/match-requests/{id}/feedback", requestId)
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(feedbackJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Rating must be between 1 and 5"));
    }
}
