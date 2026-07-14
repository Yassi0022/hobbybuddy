package com.example.demo.repository;

import com.example.demo.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    /**
     * Feed page: newest-first, with explicit LIMIT/OFFSET so the client
     * never fetches the whole post table. Return limit+1 rows and
     * let the caller decide hasMore.
     */
    @org.springframework.data.jpa.repository.Query(
            value = "SELECT * FROM posts ORDER BY created_at DESC LIMIT :limit OFFSET :offset",
            nativeQuery = true)
    List<Post> findFeedPage(@org.springframework.data.repository.query.Param("limit") int limit,
                            @org.springframework.data.repository.query.Param("offset") int offset);

    void deleteByAuthor(com.example.demo.model.User author);
}
