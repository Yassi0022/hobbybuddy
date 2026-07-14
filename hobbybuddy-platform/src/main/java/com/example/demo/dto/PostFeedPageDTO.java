package com.example.demo.dto;

import java.util.List;

/**
 * Paginated feed envelope.
 * hasMore lets the client render a "Load more" control without
 * having fetched the entire post table.
 */
public record PostFeedPageDTO(List<PostFeedDTO> posts, boolean hasMore) {
}
