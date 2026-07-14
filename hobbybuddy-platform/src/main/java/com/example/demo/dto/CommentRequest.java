package com.example.demo.dto;

/**
 * Body for POST /api/posts/{postId}/comments.
 */
public record CommentRequest(String content) {
}
