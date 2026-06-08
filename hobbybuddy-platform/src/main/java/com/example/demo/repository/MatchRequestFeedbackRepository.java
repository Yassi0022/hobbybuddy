package com.example.demo.repository;

import com.example.demo.model.MatchRequest;
import com.example.demo.model.MatchRequestFeedback;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MatchRequestFeedbackRepository extends JpaRepository<MatchRequestFeedback, Long> {

    /** Check if a user already submitted feedback for a given match request. */
    boolean existsByMatchRequestAndAuthor(MatchRequest matchRequest, User author);

    /** All feedback for a given match request (both participants). */
    List<MatchRequestFeedback> findByMatchRequest(MatchRequest matchRequest);

    /** Find a specific user's feedback for a match request. */
    Optional<MatchRequestFeedback> findByMatchRequestAndAuthor(MatchRequest matchRequest, User author);
}
