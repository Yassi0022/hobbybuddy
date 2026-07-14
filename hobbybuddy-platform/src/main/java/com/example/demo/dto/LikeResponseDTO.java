package com.example.demo.dto;

/**
 * Result of a like toggle — the authoritative server state.
 * The client must reconcile its UI to these values (no optimistic desync).
 */
public record LikeResponseDTO(long likesCount, boolean viewerHasLiked) {
}
