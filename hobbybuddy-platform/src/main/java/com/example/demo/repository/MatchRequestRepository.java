package com.example.demo.repository;

import com.example.demo.model.MatchRequest;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MatchRequestRepository extends JpaRepository<MatchRequest, Long> {

    /** Find a specific pending request between two users (either direction). */
    @Query("SELECT mr FROM MatchRequest mr WHERE mr.requester = :a AND mr.candidate = :b AND mr.status = com.example.demo.model.MatchRequest.Status.PENDING")
    Optional<MatchRequest> findPendingBetween(@Param("a") User a, @Param("b") User b);

    /** All requests where the given user is either requester or candidate. */
    @Query("SELECT mr FROM MatchRequest mr WHERE mr.requester = :user OR mr.candidate = :user ORDER BY mr.updatedAt DESC")
    List<MatchRequest> findAllInvolving(@Param("user") User user);

    /** All pending requests where the given user is the candidate (incoming requests). */
    @Query("SELECT mr FROM MatchRequest mr WHERE mr.candidate = :user AND mr.status = com.example.demo.model.MatchRequest.Status.PENDING ORDER BY mr.createdAt DESC")
    List<MatchRequest> findPendingForCandidate(@Param("user") User user);

    /** IDs of users with whom the given user has an active (PENDING or CONFIRMED) match request, in either direction. */
    @Query("SELECT CASE WHEN mr.requester = :user THEN mr.candidate.id ELSE mr.requester.id END " +
           "FROM MatchRequest mr " +
           "WHERE (mr.requester = :user OR mr.candidate = :user) " +
           "AND mr.status IN (com.example.demo.model.MatchRequest.Status.PENDING, com.example.demo.model.MatchRequest.Status.CONFIRMED)")
    List<Long> findActiveMatchUserIds(@Param("user") User user);

    /** The single request between two users in EITHER direction, regardless of status, or empty. */
    @Query("SELECT mr FROM MatchRequest mr " +
           "WHERE (mr.requester = :a AND mr.candidate = :b) OR (mr.requester = :b AND mr.candidate = :a)")
    Optional<MatchRequest> findBetween(@Param("a") User a, @Param("b") User b);

    /**
     * True when a messaging-eligible match exists between the two users in either direction.
     * Both CONFIRMED (active connection) and DONE (finalized connection) authorize messaging;
     * DONE is a superset of CONFIRMED and must not block an already-connected pair.
     */
    @Query("SELECT CASE WHEN COUNT(mr) > 0 THEN true ELSE false END FROM MatchRequest mr " +
           "WHERE ((mr.requester = :a AND mr.candidate = :b) OR (mr.requester = :b AND mr.candidate = :a)) " +
           "AND mr.status IN (com.example.demo.model.MatchRequest.Status.CONFIRMED, com.example.demo.model.MatchRequest.Status.DONE)")
    boolean existsConfirmedMatchBetween(@Param("a") User a, @Param("b") User b);
}
