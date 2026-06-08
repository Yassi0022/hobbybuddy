package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Post-activity feedback submitted by one participant of a confirmed match.
 * Each user can submit at most one feedback per MatchRequest.
 */
@Entity
@Table(name = "match_request_feedback",
       uniqueConstraints = @UniqueConstraint(columnNames = {"match_request_id", "author_id"},
                                            name = "uq_feedback_per_user"))
public class MatchRequestFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "match_request_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_feedback_match_request"))
    private MatchRequest matchRequest;

    /** The user who wrote this feedback (either requester or candidate). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_feedback_author"))
    private User author;

    @Column(nullable = false)
    private int rating; // 1-5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public MatchRequestFeedback() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public MatchRequest getMatchRequest() { return matchRequest; }
    public void setMatchRequest(MatchRequest matchRequest) { this.matchRequest = matchRequest; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
