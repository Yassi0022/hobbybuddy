package com.example.demo.controller;

import com.example.demo.dto.CommentDTO;
import com.example.demo.dto.CommentRequest;
import com.example.demo.dto.LikeResponseDTO;
import com.example.demo.dto.PostFeedDTO;
import com.example.demo.dto.PostFeedPageDTO;
import com.example.demo.model.Comment;
import com.example.demo.model.Post;
import com.example.demo.model.PostLike;
import com.example.demo.model.User;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.PostLikeRepository;
import com.example.demo.repository.PostRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private PostLikeRepository postLikeRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
    }

    /**
     * Paginated feed, newest-first.
     * Fetch limit+1 rows; if more than limit came back, there is a next page.
     * Counts are real (from post_likes / comments), viewerHasLiked reflects the caller.
     */
    @GetMapping
    public ResponseEntity<PostFeedPageDTO> getPosts(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "0") int offset,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
        if (limit < 1) limit = 1;
        if (limit > 50) limit = 50;
        if (offset < 0) offset = 0;

        List<Post> rows = postRepository.findFeedPage(limit + 1, offset);
        boolean hasMore = rows.size() > limit;
        if (hasMore) {
            rows = rows.subList(0, limit);
        }

        List<PostFeedDTO> dtos = rows.stream().map(p -> toFeedDto(p, user)).toList();
        return ResponseEntity.ok(new PostFeedPageDTO(dtos, hasMore));
    }

    /**
     * Create a post. Returns a feed DTO (not the raw entity) so the new
     * post can be prepended to the feed without a full reload and without
     * corrupting pagination state.
     */
    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Post post, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return unauthorized();
        }

        if (post.getContent() == null || post.getContent().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Content cannot be empty"));
        }

        post.setId(null);
        post.setAuthor(user);
        Post savedPost = postRepository.save(post);
        return ResponseEntity.status(HttpStatus.CREATED).body(toFeedDto(savedPost, user));
    }

    /**
     * Toggle the caller's like on a post.
     * Idempotent: liking an already-liked post removes the like (and vice-versa
     * is impossible — a user can only ever have one like per post). The
     * (post_id, user_id) unique constraint makes this safe under races.
     * Returns the authoritative server state.
     */
    @PostMapping("/{postId}/like")
    @Transactional
    public ResponseEntity<?> toggleLike(@PathVariable Long postId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return unauthorized();
        }
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }

        if (postLikeRepository.existsByPostIdAndUserId(postId, user.getId())) {
            postLikeRepository.deleteByPostIdAndUserId(postId, user.getId());
        } else {
            PostLike like = new PostLike();
            like.setPost(post);
            like.setUser(user);
            postLikeRepository.save(like);
        }

        long likes = postLikeRepository.countByPostId(postId);
        boolean liked = postLikeRepository.existsByPostIdAndUserId(postId, user.getId());
        return ResponseEntity.ok(new LikeResponseDTO(likes, liked));
    }

    /** List a post's comments, oldest-first. */
    @GetMapping("/{postId}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long postId, Authentication authentication) {
        if (getAuthenticatedUser(authentication) == null) {
            return unauthorized();
        }
        if (!postRepository.existsById(postId)) {
            return ResponseEntity.notFound().build();
        }
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        List<CommentDTO> dtos = comments.stream().map(this::toCommentDto).toList();
        return ResponseEntity.ok(dtos);
    }

    /** Create a comment on a post. */
    @PostMapping("/{postId}/comments")
    public ResponseEntity<?> createComment(@PathVariable Long postId, @RequestBody CommentRequest req,
                                     Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return unauthorized();
        }
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }
        String content = req != null && req.content() != null ? req.content().trim() : "";
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Comment cannot be empty"));
        }

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setAuthor(user);
        comment.setContent(content);
        Comment saved = commentRepository.save(comment);
        return ResponseEntity.status(HttpStatus.CREATED).body(toCommentDto(saved));
    }

    private PostFeedDTO toFeedDto(Post p, User viewer) {
        long likes = postLikeRepository.countByPostId(p.getId());
        long comments = commentRepository.countByPostId(p.getId());
        boolean liked = postLikeRepository.existsByPostIdAndUserId(p.getId(), viewer.getId());
        PostFeedDTO.PostAuthorDTO author = new PostFeedDTO.PostAuthorDTO(
                p.getAuthor() != null ? p.getAuthor().getId() : null,
                p.getAuthor() != null ? p.getAuthor().getName() : null,
                p.getAuthor() != null ? p.getAuthor().getArchetype() : null,
                p.getAuthor() != null ? p.getAuthor().getPersonalityTagline() : null);
        return new PostFeedDTO(
                p.getId(), p.getContent(), p.getImageUrl(), p.getHobbyCategory(),
                p.getCreatedAt(), author, likes, comments, liked);
    }

    private CommentDTO toCommentDto(Comment c) {
        return new CommentDTO(
                c.getId(),
                c.getPost().getId(),
                c.getAuthor().getId(),
                c.getAuthor().getName(),
                c.getAuthor().getArchetype(),
                c.getAuthor().getPersonalityTagline(),
                c.getContent(),
                c.getCreatedAt());
    }
}
