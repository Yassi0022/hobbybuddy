package com.example.demo.dto;

import java.time.LocalDateTime;

/**
 * A single comment with enough author info for rendering.
 * Ordered oldest-first within a post thread.
 */
public record CommentDTO(
        Long id,
        Long postId,
        Long authorId,
        String authorName,
        String authorArchetype,
        String authorTagline,
        String content,
        LocalDateTime createdAt) {
}
