package com.example.demo.dto;

import java.time.LocalDateTime;

/**
 * Feed item as returned by the paginated GET /api/posts.
 * Counts are computed from the real like/comment tables (never the
 * dead posts.likes_count / posts.comments_count columns).
 */
public record PostFeedDTO(
        Long id,
        String content,
        String imageUrl,
        String hobbyCategory,
        LocalDateTime createdAt,
        PostAuthorDTO author,
        long likesCount,
        long commentsCount,
        boolean viewerHasLiked) {

    /**
     * Author metadata carried on a feed post — aligned with the existing
     * feed card design (initial avatar + name; archetype/tagline optional).
     */
    public record PostAuthorDTO(
            Long id,
            String name,
            String archetype,
            String personalityTagline) {
    }
}
