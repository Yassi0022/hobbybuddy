package com.example.demo.controller;

import com.example.demo.model.MatchRequest;
import com.example.demo.model.MatchRequestFeedback;
import com.example.demo.model.User;
import com.example.demo.repository.MatchRequestFeedbackRepository;
import com.example.demo.repository.MatchRequestRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.MatchingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/match-requests")
public class MatchRequestController {

    private final MatchRequestRepository matchRequestRepository;
    private final MatchRequestFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final MatchingService matchingService;
    private final SimpMessagingTemplate messagingTemplate;

    public MatchRequestController(MatchRequestRepository matchRequestRepository,
                                  MatchRequestFeedbackRepository feedbackRepository,
                                  UserRepository userRepository,
                                  MatchingService matchingService,
                                  SimpMessagingTemplate messagingTemplate) {
        this.matchRequestRepository = matchRequestRepository;
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
        this.matchingService = matchingService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * List all match requests involving the current user.
     * Returns both incoming (user is candidate) and outgoing (user is requester)
     * so the Matches tab can show CONFIRMED matches with buddy details.
     */
    @GetMapping
    public ResponseEntity<?> listForCurrentUser(Authentication auth) {
        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in database"));

        List<MatchRequest> requests = matchRequestRepository.findAllInvolving(currentUser);

        List<Map<String, Object>> result = new ArrayList<>();
        for (MatchRequest mr : requests) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", mr.getId());
            item.put("status", mr.getStatus().name());
            item.put("createdAt", mr.getCreatedAt().toString());
            item.put("updatedAt", mr.getUpdatedAt().toString());

            // The "other" user — the buddy
            boolean isRequester = mr.getRequester().getId().equals(currentUser.getId());
            User other = isRequester ? mr.getCandidate() : mr.getRequester();
            item.put("role", isRequester ? "requester" : "candidate");
            item.put("buddyId", other.getId());
            item.put("buddyName", other.getName() != null ? other.getName() : "");
            item.put("buddyArchetype", other.getArchetype() != null ? other.getArchetype() : "");
            item.put("buddyCity", other.getCity() != null ? other.getCity() : "");
            item.put("buddyAge", other.getAge());
            item.put("buddyPhotosJson", other.getPhotosJson() != null ? other.getPhotosJson() : "[]");

            result.add(item);
        }

        return ResponseEntity.ok(Map.of("matchRequests", result));
    }

    @PostMapping("/{candidateId}")
    public ResponseEntity<?> create(@PathVariable Long candidateId, Authentication auth) {
        User requester = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in database"));

        if (requester.getId().equals(candidateId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot request a match with yourself"));
        }

        User candidate = userRepository.findById(candidateId).orElse(null);
        if (candidate == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Candidate user not found"));
        }

        if (matchRequestRepository.findPendingBetween(requester, candidate).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "A pending match request already exists"));
        }

        MatchRequest mr = new MatchRequest();
        mr.setRequester(requester);
        mr.setCandidate(candidate);
        mr.setStatus(MatchRequest.Status.PENDING);
        matchRequestRepository.save(mr);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", mr.getId(),
                "status", mr.getStatus().name(),
                "requesterId", requester.getId(),
                "candidateId", candidate.getId()
        ));
    }

    @PatchMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(@PathVariable Long id, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in database"));

        MatchRequest mr = matchRequestRepository.findById(id).orElse(null);
        if (mr == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Match request not found"));
        }

        if (!mr.getCandidate().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only the candidate can confirm this request"));
        }

        if (mr.getStatus() != MatchRequest.Status.PENDING) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Match request is already " + mr.getStatus().name().toLowerCase()));
        }

        mr.setStatus(MatchRequest.Status.CONFIRMED);
        matchRequestRepository.save(mr);

        // Notify the requester via WebSocket that their match was confirmed
        try {
            Map<String, Object> notification = new LinkedHashMap<>();
            notification.put("type", "MATCH_CONFIRMED");
            notification.put("matchRequestId", mr.getId());
            notification.put("candidateId", mr.getCandidate().getId());
            notification.put("candidateName", mr.getCandidate().getName() != null ? mr.getCandidate().getName() : "Your buddy");
            notification.put("message", mr.getCandidate().getName() != null
                    ? mr.getCandidate().getName() + " accepted your match request!"
                    : "Your match request was accepted!");
            messagingTemplate.convertAndSend("/topic/matches/" + mr.getRequester().getId(), notification);
        } catch (Exception e) {
            // Notification is best-effort; never fail the confirm operation
            org.slf4j.LoggerFactory.getLogger(MatchRequestController.class)
                    .warn("[MatchNotify] Failed to send WebSocket notification for match {}: {}", mr.getId(), e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "id", mr.getId(),
                "status", mr.getStatus().name(),
                "requesterId", mr.getRequester().getId(),
                "candidateId", mr.getCandidate().getId()
        ));
    }

    @PostMapping("/{id}/decline")
    public ResponseEntity<?> decline(@PathVariable Long id, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in database"));

        MatchRequest mr = matchRequestRepository.findById(id).orElse(null);
        if (mr == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Match request not found"));
        }

        if (!mr.getCandidate().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only the candidate can decline this request"));
        }

        if (mr.getStatus() != MatchRequest.Status.PENDING) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Match request is already " + mr.getStatus().name().toLowerCase()));
        }

        mr.setStatus(MatchRequest.Status.DECLINED);
        matchRequestRepository.save(mr);

        return ResponseEntity.ok(Map.of(
                "id", mr.getId(),
                "status", mr.getStatus().name(),
                "requesterId", mr.getRequester().getId(),
                "candidateId", mr.getCandidate().getId()
        ));
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<?> submitFeedback(@PathVariable Long id,
                                            @RequestBody Map<String, Object> body,
                                            Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in database"));

        MatchRequest mr = matchRequestRepository.findById(id).orElse(null);
        if (mr == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Match request not found"));
        }

        // Only requester or candidate can submit feedback
        if (!mr.getRequester().getId().equals(user.getId()) && !mr.getCandidate().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only participants of this match can submit feedback"));
        }

        // Feedback only allowed after confirmation
        if (mr.getStatus() != MatchRequest.Status.CONFIRMED && mr.getStatus() != MatchRequest.Status.DONE) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Feedback is only allowed after the match is confirmed"));
        }

        // Prevent duplicate feedback from same user
        if (feedbackRepository.existsByMatchRequestAndAuthor(mr, user)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "You have already submitted feedback for this match"));
        }

        // Validate rating
        Object ratingObj = body.get("rating");
        if (ratingObj == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rating is required"));
        }
        int rating;
        try {
            rating = Integer.parseInt(ratingObj.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rating must be an integer"));
        }
        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 1 and 5"));
        }

        String comment = body.containsKey("comment") ? body.get("comment").toString() : null;

        MatchRequestFeedback feedback = new MatchRequestFeedback();
        feedback.setMatchRequest(mr);
        feedback.setAuthor(user);
        feedback.setRating(rating);
        feedback.setComment(comment);
        feedbackRepository.save(feedback);

        // Build next-step payload: fresh matches for the user
        List<User> allUsers = userRepository.findAll();
        List<?> freshMatches = matchingService.calculateMatches(user, allUsers);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", feedback.getId(),
                "matchRequestId", mr.getId(),
                "authorId", user.getId(),
                "rating", feedback.getRating(),
                "comment", feedback.getComment() != null ? feedback.getComment() : "",
                "nextMatchAvailable", !freshMatches.isEmpty(),
                "nextStepMessage", "Great! Ready for your new hobby adventure? Check out your fresh matches!",
                "freshMatches", freshMatches
        ));
    }
}
