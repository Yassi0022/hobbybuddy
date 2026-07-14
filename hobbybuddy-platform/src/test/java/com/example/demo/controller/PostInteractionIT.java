package com.example.demo.controller;

import com.example.demo.model.Comment;
import com.example.demo.model.Post;
import com.example.demo.model.PostLike;
import com.example.demo.model.User;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.MatchRequestRepository;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.PostLikeRepository;
import com.example.demo.repository.PostRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PostInteractionIT {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PostRepository postRepository;
    @Autowired private PostLikeRepository postLikeRepository;
    @Autowired private CommentRepository commentRepository;
    @Autowired private MatchRequestRepository matchRequestRepository;
    @Autowired private PasswordResetTokenRepository passwordResetTokenRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    private final ObjectMapper om = new ObjectMapper();

    private Long userAId;
    private Long userBId;
    private String userAToken;
    private String userBToken;

    @BeforeEach
    void setUp() {
        // FK-safe delete order (child tables first)
        commentRepository.deleteAll();
        postLikeRepository.deleteAll();
        postRepository.deleteAll();
        matchRequestRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        User a = new User();
        a.setEmail("a@test.com");
        a.setPassword(passwordEncoder.encode("pass123"));
        a.setName("Alice");
        a.setEmailVerified(true);
        a = userRepository.save(a);
        userAId = a.getId();
        userAToken = jwtUtil.generateToken(a.getEmail());

        User b = new User();
        b.setEmail("b@test.com");
        b.setPassword(passwordEncoder.encode("pass456"));
        b.setName("Bob");
        b.setEmailVerified(true);
        b = userRepository.save(b);
        userBId = b.getId();
        userBToken = jwtUtil.generateToken(b.getEmail());
    }

    private Long createPost(Long authorId, String content) {
        User author = userRepository.findById(authorId).orElseThrow();
        Post p = new Post();
        p.setAuthor(author);
        p.setContent(content);
        return postRepository.save(p).getId();
    }

    // ── Likes ──────────────────────────────────────────────

    @Test
    void likeToggleAddsAndRemoves() throws Exception {
        Long postId = createPost(userAId, "hello from A");

        // First like
        mockMvc.perform(post("/api/posts/{id}/like", postId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likesCount").value(1))
                .andExpect(jsonPath("$.viewerHasLiked").value(true));

        // Toggle off
        mockMvc.perform(post("/api/posts/{id}/like", postId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likesCount").value(0))
                .andExpect(jsonPath("$.viewerHasLiked").value(false));
    }

    @Test
    void likeIsIdempotentAndCannotDuplicate() throws Exception {
        Long postId = createPost(userAId, "liked post");

        // Like
        mockMvc.perform(post("/api/posts/{id}/like", postId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likesCount").value(1));

        // A user can never have more than one like on the same post:
        // the unique constraint means a second row is impossible, and the
        // repository reports exactly one.
        long count = postLikeRepository.countByPostId(postId);
        org.junit.jupiter.api.Assertions.assertEquals(1, count);
        org.junit.jupiter.api.Assertions.assertTrue(
                postLikeRepository.existsByPostIdAndUserId(postId, userAId));

        // A second like by the same user toggles off (never accumulates)
        mockMvc.perform(post("/api/posts/{id}/like", postId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likesCount").value(0));
        org.junit.jupiter.api.Assertions.assertEquals(0, postLikeRepository.countByPostId(postId));
    }

    @Test
    void unauthorizedLikeRejected() throws Exception {
        Long postId = createPost(userAId, "secure post");
        mockMvc.perform(post("/api/posts/{id}/like", postId))
                .andExpect(status().isUnauthorized());
    }

    // ── Comments ────────────────────────────────────────────

    @Test
    void commentCreateAndList() throws Exception {
        Long postId = createPost(userAId, "post with comments");

        // A comments
        mockMvc.perform(post("/api/posts/{id}/comments", postId)
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(java.util.Map.of("content", "first comment"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.authorId").value(userAId.intValue()))
                .andExpect(jsonPath("$.authorName").value("Alice"))
                .andExpect(jsonPath("$.content").value("first comment"))
                .andExpect(jsonPath("$.createdAt").exists());

        // B comments
        mockMvc.perform(post("/api/posts/{id}/comments", postId)
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(java.util.Map.of("content", "second comment"))))
                .andExpect(status().isCreated());

        // List is oldest-first and includes both
        mockMvc.perform(get("/api/posts/{id}/comments", postId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].content").value("first comment"))
                .andExpect(jsonPath("$[1].content").value("second comment"));

        // Feed DTO reflects the real comment count
        mockMvc.perform(get("/api/posts").header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.posts[0].commentsCount").value(2));
    }

    @Test
    void unauthorizedCommentRejected() throws Exception {
        Long postId = createPost(userAId, "secure post");
        mockMvc.perform(post("/api/posts/{id}/comments", postId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(java.util.Map.of("content", "hi"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void emptyCommentRejected() throws Exception {
        Long postId = createPost(userAId, "secure post");
        mockMvc.perform(post("/api/posts/{id}/comments", postId)
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(java.util.Map.of("content", "   "))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unauthorizedFeedRejected() throws Exception {
        mockMvc.perform(get("/api/posts")).andExpect(status().isUnauthorized());
        Long postId = createPost(userAId, "secure post");
        mockMvc.perform(get("/api/posts/{id}/comments", postId))
                .andExpect(status().isUnauthorized());
    }

    // ── Pagination ──────────────────────────────────────────

    @Test
    void feedPaginationNewestFirstWithHasMore() throws Exception {
        // Create 5 posts with strictly increasing timestamps so ordering is deterministic.
        java.time.LocalDateTime base = java.time.LocalDateTime.now();
        for (int i = 0; i < 5; i++) {
            User author = userRepository.findById(userAId).orElseThrow();
            Post p = new Post();
            p.setAuthor(author);
            p.setContent("post #" + (i + 1));
            p.setCreatedAt(base.minusSeconds(1000 - i));
            postRepository.save(p);
        }

        // First page: limit=2 → newest first, hasMore true
        mockMvc.perform(get("/api/posts?limit=2&offset=0").header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.posts.length()").value(2))
                .andExpect(jsonPath("$.hasMore").value(true))
                .andExpect(jsonPath("$.posts[0].content").value("post #5"))
                .andExpect(jsonPath("$.posts[1].content").value("post #4"))
                .andExpect(jsonPath("$.posts[0].likesCount").exists())
                .andExpect(jsonPath("$.posts[0].viewerHasLiked").exists());

        // Last page: offset=4 → 1 post, hasMore false
        mockMvc.perform(get("/api/posts?limit=2&offset=4").header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.posts.length()").value(1))
                .andExpect(jsonPath("$.hasMore").value(false))
                .andExpect(jsonPath("$.posts[0].content").value("post #1"));
    }

    @Test
    void feedReflectsViewerLikeState() throws Exception {
        Long postId = createPost(userAId, "post to like");
        // A likes it
        mockMvc.perform(post("/api/posts/{id}/like", postId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk());

        // Feed shows viewerHasLiked=true for that post
        mockMvc.perform(get("/api/posts").header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.posts[0].id").value(postId.intValue()))
                .andExpect(jsonPath("$.posts[0].likesCount").value(1))
                .andExpect(jsonPath("$.posts[0].viewerHasLiked").value(true));
    }
}
