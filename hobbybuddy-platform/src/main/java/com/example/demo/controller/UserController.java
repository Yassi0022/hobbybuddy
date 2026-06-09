package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.dao.DataIntegrityViolationException;

import com.example.demo.dto.LoginRequestDTO;
import com.example.demo.dto.MatchResponseDTO;
import com.example.demo.dto.UserResponseDTO;
import com.example.demo.model.InviteToken;
import com.example.demo.model.PasswordResetToken;
import com.example.demo.model.User;
import com.example.demo.repository.InviteTokenRepository;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.MatchingService;
import com.example.demo.service.PasswordResetService;
import com.example.demo.service.UserService;
import com.example.demo.security.JwtUtil;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.validation.annotation.Validated;

@RestController
@Validated
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private com.example.demo.service.ArchetypeService archetypeService;

    @Autowired
    private MatchingService matchingService;

    @Autowired
    private InviteTokenRepository inviteTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /** Base URL for constructing verification links. */
    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    /** Envelope "From" address for all outgoing emails. */
    @Value("${EMAIL_FROM:noreply@hobbybuddy.com}")
    private String emailFrom;

    private void addJwtCookie(HttpServletResponse response, String token) {
        jakarta.servlet.http.HttpServletRequest req =
                ((org.springframework.web.context.request.ServletRequestAttributes)
                        org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes())
                        .getRequest();
        String forwardedProto = req.getHeader("X-Forwarded-Proto");
        boolean isSecure = "https".equalsIgnoreCase(forwardedProto) || req.isSecure();
        String value = "jwt=" + token
                + "; Path=/; HttpOnly; Max-Age=86400; SameSite=None"
                + (isSecure ? "; Secure" : "");
        response.addHeader("Set-Cookie", value);
    }

    /**
     * Send an email, swallowing exceptions so the caller's flow is never broken.
     */
    private void sendMailSafely(String to, String subject, String text, String tag) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(emailFrom);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(text);
            javaMailSender.send(msg);
        } catch (Exception e) {
            logger.error("[EMAIL_FAILURE][{}] Failed to send {} email — {}: {}",
                    tag, tag, e.getClass().getSimpleName(), e.getMessage());
        }
    }

    // ── Registration ───────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user, HttpServletResponse response) {
        logger.info("Registration attempt: {}", user.getEmail());
        try {
            // Resolve invite token before saving (token -> inviter mapping)
            User resolvedInviter = null;
            if (user.getInviteToken() != null && !user.getInviteToken().isBlank()) {
                InviteToken invite = inviteTokenRepository.findByTokenHash(user.getInviteToken()).orElse(null);
                if (invite != null && !invite.isUsed() && invite.getExpiry().isAfter(LocalDateTime.now())) {
                    resolvedInviter = invite.getInviter();
                    user.setReferredBy(resolvedInviter.getId());
                }
            }

            userService.saveUser(user);

            // Handle referral: increment count and mark token as used
            if (user.getReferredBy() != null) {
                final User inviter = resolvedInviter;
                userRepository.findById(user.getReferredBy()).ifPresent(referrer -> {
                    referrer.setReferralCount(referrer.getReferralCount() + 1);
                    userRepository.save(referrer);
                });
                if (user.getInviteToken() != null) {
                    inviteTokenRepository.findByTokenHash(user.getInviteToken()).ifPresent(inv -> {
                        inv.setUsed(true);
                        inviteTokenRepository.save(inv);
                    });
                }
            }

            // Generate email verification token — store only SHA-256 hash
            byte[] verifyBytes = new byte[32];
            try {
                SecureRandom.getInstanceStrong().nextBytes(verifyBytes);
            } catch (java.security.NoSuchAlgorithmException e) {
                new SecureRandom().nextBytes(verifyBytes);
            }
            String rawVerifyToken = Base64.getUrlEncoder().withoutPadding().encodeToString(verifyBytes);
            PasswordResetToken verificationToken = new PasswordResetToken(
                    passwordResetService.sha256Hex(rawVerifyToken), user, LocalDateTime.now().plusHours(24));
            passwordResetTokenRepository.save(verificationToken);

            // Send verification email (best-effort; don't fail registration if email fails)
            sendMailSafely(user.getEmail(), "Verify your HobbyBuddy account",
                    "Welcome to HobbyBuddy! Click the link to verify your email:\n"
                            + frontendUrl + "/verify?token=" + rawVerifyToken,
                    "VERIFY");

            // Do NOT issue JWT until email is verified
            Map<String, Object> body = new java.util.LinkedHashMap<>();
            body.put("id", user.getId());
            body.put("email", user.getEmail());
            body.put("name", user.getName() != null ? user.getName() : "");
            body.put("message", "Registration successful. Please check your email to verify your account.");
            return ResponseEntity.status(HttpStatus.CREATED).body(body);
        } catch (DataIntegrityViolationException e) {
            logger.warn("Registration conflict: email {} already exists", user.getEmail());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
        } catch (RuntimeException e) {
            if ("Email already exists".equals(e.getMessage())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
            }
            throw e;
        } catch (Exception e) {
            logger.error("Registration failure for {}: {}", user.getEmail(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Server connectivity error. Please try again in a few moments.",
                "details", e.getMessage()
            ));
        }
    }

    // ── Login ──────────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest, HttpServletResponse response) {
        String email = loginRequest.getEmail();
        String password = loginRequest.getPassword();
        logger.info("Login attempt: {}", email);

        try {
            if (email == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email/password required"));
            }

            try {
                authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
            } catch (org.springframework.security.authentication.BadCredentialsException e) {
                // LAZY MIGRATION
                User user = userRepository.findByEmail(email).orElseThrow(() -> e);
                if (user.getPassword() != null && !user.getPassword().startsWith("$2a$") && user.getPassword().equals(password)) {
                    logger.info("Migrating user password for: {}", email);
                    userService.saveUser(user);
                } else {
                    throw e;
                }
            }

            User user = userRepository.findByEmail(email).orElseThrow();

            // Block login if email is not verified
            if (!user.isEmailVerified()) {
                logger.warn("[AUTH] Login blocked — email not verified: {}", email);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "EMAIL_NOT_VERIFIED",
                        "message", "Please verify your email before logging in. Check your inbox or request a new verification email."
                ));
            }

            // Include authVersion in JWT so we can invalidate on password change
            String token = jwtUtil.generateToken(user.getEmail(), user.getAuthVersion());
            addJwtCookie(response, token);

            Map<String, Object> resp = new HashMap<>();
            resp.put("token", token);
            resp.put("userId", user.getId());
            resp.put("id", user.getId());
            resp.put("email", user.getEmail());
            resp.put("name", user.getName());
            resp.put("quizCompleted", user.isQuizCompleted());
            resp.put("archetype", user.getArchetype() != null ? user.getArchetype() : "");
            resp.put("hobbies", user.getHobbies() != null ? user.getHobbies() : "");
            resp.put("prompt1", user.getPrompt1() != null ? user.getPrompt1() : "");
            resp.put("prompt2", user.getPrompt2() != null ? user.getPrompt2() : "");
            resp.put("prompt3", user.getPrompt3() != null ? user.getPrompt3() : "");
            resp.put("city", user.getCity() != null ? user.getCity() : "");
            resp.put("age", user.getAge() != null ? user.getAge() : "");
            resp.put("personalityTagline", user.getPersonalityTagline() != null ? user.getPersonalityTagline() : "");
            resp.put("photosJson", user.getPhotosJson() != null ? user.getPhotosJson() : "[]");
            resp.put("referralCount", user.getReferralCount());
            return ResponseEntity.ok(resp);
        } catch (org.springframework.security.core.AuthenticationException e) {
            logger.warn("Authentication failed for: {}", email);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        } catch (Exception e) {
            logger.error("Unexpected login error for {}: {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Server error"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user, HttpServletResponse response) {
        return createUser(user, response);
    }

    // ── Password Reset ─────────────────────────────────────────────────

    /**
     * Request a password reset link by email.
     * Always returns a neutral 200 response to prevent email enumeration.
     * Rate-limited by RateLimitFilter (3 req / 15 min per IP + per email).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        passwordResetService.requestReset(email.trim());

        // Neutral response — same whether or not the email exists
        return ResponseEntity.ok(Map.of(
                "message", "If the email exists, a password reset link has been sent."
        ));
    }

    /**
     * Reset password using the token from the email link.
     * On success, the user's authVersion is incremented, invalidating all prior JWTs.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Reset token is required"));
        }
        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password is required"));
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        }

        // Encode the new password before passing to service
        String encodedPassword = passwordEncoder.encode(newPassword);
        PasswordResetService.ResetResult result = passwordResetService.resetPassword(token, encodedPassword);

        switch (result) {
            case SUCCESS:
                return ResponseEntity.ok(Map.of(
                        "message", "Password reset successfully. You can now log in with your new password."
                ));
            case TOKEN_EXPIRED:
            case INVALID_TOKEN:
            case TOKEN_REUSED:
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid or expired reset token"));
            default:
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid or expired reset token"));
        }
    }

    // ── Email Verification ─────────────────────────────────────────────

    /**
     * Verify email using the token sent via email.
     * Tokens are SHA-256-hashed; we look up by hash.
     */
    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String rawToken) {
        String sha256Hash = passwordResetService.sha256Hex(rawToken);
        PasswordResetToken matchedToken = passwordResetTokenRepository.findByTokenHashSha256(sha256Hash).orElse(null);

        if (matchedToken == null || matchedToken.isExpired()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid or expired verification token"));
        }

        if (matchedToken.isUsed()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid or expired verification token"));
        }

        // Mark token as used
        matchedToken.markUsed();
        passwordResetTokenRepository.save(matchedToken);

        User user = matchedToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        // Grant priority-match credit to the inviter (if referred)
        boolean priorityGranted = false;
        if (user.getReferredBy() != null) {
            userRepository.findById(user.getReferredBy()).ifPresent(inviter -> {
                inviter.setPriorityMatchAvailable(true);
                userRepository.save(inviter);
                logger.info("[REFERRAL] User {} verified — granted priority match to inviter {}",
                        user.getId(), inviter.getId());
            });
            priorityGranted = true;
        }

        return ResponseEntity.ok(Map.of(
                "verified", true,
                "email", user.getEmail(),
                "message", "Email verified successfully!"
                    + (priorityGranted ? " Your inviter received a priority match credit!" : "")
        ));
    }

    /**
     * Re-send verification email (for users who lost the first email).
     */
    @PostMapping("/send-verification")
    public ResponseEntity<?> sendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        // Always return success to prevent email enumeration
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.isEmailVerified()) {
            return ResponseEntity.ok(Map.of("message", "If the email exists and is unverified, a verification link has been sent."));
        }

        // Invalidate any existing tokens for this user
        passwordResetTokenRepository.markAllActiveAsUsed(user);

        // Generate new verification token — store only SHA-256 hash
        byte[] verifyBytes = new byte[32];
        try {
            SecureRandom.getInstanceStrong().nextBytes(verifyBytes);
        } catch (java.security.NoSuchAlgorithmException e) {
            new SecureRandom().nextBytes(verifyBytes);
        }
        String rawVerifyToken = Base64.getUrlEncoder().withoutPadding().encodeToString(verifyBytes);
        PasswordResetToken verificationToken = new PasswordResetToken(
                passwordResetService.sha256Hex(rawVerifyToken), user, LocalDateTime.now().plusHours(24));
        passwordResetTokenRepository.save(verificationToken);

        // Send email (best-effort)
        sendMailSafely(user.getEmail(), "Verify your HobbyBuddy account",
                "Click the link to verify your email:\n"
                        + frontendUrl + "/verify?token=" + rawVerifyToken,
                "VERIFY");

        return ResponseEntity.ok(Map.of("message", "If the email exists and is unverified, a verification link has been sent."));
    }

    // ── User CRUD (unchanged) ──────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", user.getId());
        resp.put("email", user.getEmail());
        resp.put("name", user.getName());
        resp.put("archetype", user.getArchetype() != null ? user.getArchetype() : "");
        resp.put("hobbies", user.getHobbies() != null ? user.getHobbies() : "");
        resp.put("prompt1", user.getPrompt1() != null ? user.getPrompt1() : "");
        resp.put("prompt2", user.getPrompt2() != null ? user.getPrompt2() : "");
        resp.put("prompt3", user.getPrompt3() != null ? user.getPrompt3() : "");
        resp.put("city", user.getCity() != null ? user.getCity() : "");
        resp.put("age", user.getAge() != null ? user.getAge() : "");
        resp.put("personalityTagline", user.getPersonalityTagline() != null ? user.getPersonalityTagline() : "");
        resp.put("photosJson", user.getPhotosJson() != null ? user.getPhotosJson() : "[]");
        resp.put("referralCount", user.getReferralCount());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<?> getProfile(@PathVariable("id") java.lang.Long id,
                                        Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        if (!currentUser.getId().equals(id)) {
            logger.warn("[AUTHZ] User {} attempted to view profile of user {}", currentUser.getId(), id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only view your own profile"));
        }
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", currentUser.getId());
        resp.put("email", currentUser.getEmail());
        resp.put("name", currentUser.getName());
        resp.put("archetype", currentUser.getArchetype() != null ? currentUser.getArchetype() : "");
        resp.put("hobbies", currentUser.getHobbies() != null ? currentUser.getHobbies() : "");
        resp.put("prompt1", currentUser.getPrompt1() != null ? currentUser.getPrompt1() : "");
        resp.put("prompt2", currentUser.getPrompt2() != null ? currentUser.getPrompt2() : "");
        resp.put("prompt3", currentUser.getPrompt3() != null ? currentUser.getPrompt3() : "");
        resp.put("city", currentUser.getCity() != null ? currentUser.getCity() : "");
        resp.put("age", currentUser.getAge() != null ? currentUser.getAge() : "");
        resp.put("personalityTagline", currentUser.getPersonalityTagline() != null ? currentUser.getPersonalityTagline() : "");
        resp.put("photosJson", currentUser.getPhotosJson() != null ? currentUser.getPhotosJson() : "[]");
        resp.put("referralCount", currentUser.getReferralCount());
        resp.put("quizCompleted", currentUser.isQuizCompleted());
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable("id") java.lang.Long id,
                                           @RequestBody Map<String, Object> payload,
                                           Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (!currentUser.getId().equals(id)) {
            logger.warn("[AUTHZ] User {} attempted to update profile of user {}", currentUser.getId(), id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only update your own profile"));
        }
        User user = currentUser;
        if (payload.containsKey("name")) user.setName((String) payload.get("name"));
        if (payload.containsKey("prompt1")) user.setPrompt1((String) payload.get("prompt1"));
        if (payload.containsKey("prompt2")) user.setPrompt2((String) payload.get("prompt2"));
        if (payload.containsKey("prompt3")) user.setPrompt3((String) payload.get("prompt3"));
        if (payload.containsKey("city")) user.setCity((String) payload.get("city"));
        if (payload.containsKey("age")) user.setAge((Integer) payload.get("age"));
        if (payload.containsKey("personalityTagline")) user.setPersonalityTagline((String) payload.get("personalityTagline"));
        if (payload.containsKey("hobbies")) user.setHobbies((String) payload.get("hobbies"));
        if (payload.containsKey("photosJson")) user.setPhotosJson((String) payload.get("photosJson"));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

    @PostMapping("/{id}/quiz-submit")
    @Transactional
    public ResponseEntity<?> submitQuiz(@PathVariable("id") java.lang.Long id,
                                        @RequestBody Map<String, Object> payload,
                                        Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (!currentUser.getId().equals(id)) {
            logger.warn("[AUTHZ] User {} attempted to submit quiz for user {}", currentUser.getId(), id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only submit the quiz for your own account"));
        }
        if (!payload.containsKey("gdprConsent") || !(Boolean) payload.get("gdprConsent")) {
            return ResponseEntity.status(400).body(Map.of("error", "GDPR consent required"));
        }
        User user = currentUser;
        Double o = Double.valueOf(payload.get("openness").toString());
        Double c = Double.valueOf(payload.get("conscientiousness").toString());
        Double e = Double.valueOf(payload.get("extraversion").toString());
        Double a = Double.valueOf(payload.get("agreeableness").toString());
        Double n = Double.valueOf(payload.get("neuroticism").toString());
        user.setOpenness(o);
        user.setConscientiousness(c);
        user.setExtraversion(e);
        user.setAgreeableness(a);
        user.setNeuroticism(n);
        String archetype = archetypeService.calculateArchetype(o, c, e, a, n);
        user.setArchetype(archetype);
        if (payload.containsKey("hobbies")) user.setHobbies((String) payload.get("hobbies"));
        userRepository.save(user);
        System.out.println("[QUIZ] Archetype persisted for user " + id + ": " + user.getArchetype());
        return ResponseEntity.ok(Map.of("message", "Quiz results saved", "archetype", user.getArchetype()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable("id") java.lang.Long id, Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (!currentUser.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only view your own profile"));
        }
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", currentUser.getId());
        resp.put("email", currentUser.getEmail());
        resp.put("name", currentUser.getName());
        resp.put("archetype", currentUser.getArchetype() != null ? currentUser.getArchetype() : "");
        resp.put("hobbies", currentUser.getHobbies() != null ? currentUser.getHobbies() : "");
        resp.put("prompt1", currentUser.getPrompt1() != null ? currentUser.getPrompt1() : "");
        resp.put("prompt2", currentUser.getPrompt2() != null ? currentUser.getPrompt2() : "");
        resp.put("prompt3", currentUser.getPrompt3() != null ? currentUser.getPrompt3() : "");
        resp.put("city", currentUser.getCity() != null ? currentUser.getCity() : "");
        resp.put("age", currentUser.getAge() != null ? currentUser.getAge() : "");
        resp.put("personalityTagline", currentUser.getPersonalityTagline() != null ? currentUser.getPersonalityTagline() : "");
        resp.put("photosJson", currentUser.getPhotosJson() != null ? currentUser.getPhotosJson() : "[]");
        resp.put("referralCount", currentUser.getReferralCount());
        resp.put("quizCompleted", currentUser.isQuizCompleted());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}/find-buddy")
    public ResponseEntity<?> findBuddy(@PathVariable("id") java.lang.Long id, Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (!currentUser.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only find buddies for your own account"));
        }
        if (currentUser.getOpenness() == null) {
            return ResponseEntity.ok(Map.of("matches", List.of()));
        }
        List<User> allUsers = userRepository.findAll();
        List<User> otherUsers = allUsers.stream()
                .filter(u -> !u.getId().equals(id))
                .collect(java.util.stream.Collectors.toList());
        List<MatchResponseDTO> matches = matchingService.calculateMatches(currentUser, otherUsers);
        Map<Long, User> userById = allUsers.stream()
                .collect(java.util.stream.Collectors.toMap(User::getId, java.util.function.Function.identity()));
        List<Map<String, Object>> richMatches = new ArrayList<>();
        for (MatchResponseDTO match : matches) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", match.getId());
            m.put("name", match.getName());
            m.put("archetype", match.getArchetype());
            m.put("hobbies", match.getHobbies());
            m.put("compatibilityPercentage", match.getCompatibilityPercentage());
            m.put("sharedStrengths", match.getSharedStrengths());
            m.put("complementaryTraits", match.getComplementaryTraits());
            m.put("traitBreakdowns", match.getTraitBreakdowns());
            allUsers.stream()
                .filter(u -> u.getName() != null && u.getName().equals(match.getName()))
                .findFirst()
                .ifPresent(u -> {
                    m.put("id", u.getId());
                    m.put("age", u.getAge());
                    m.put("photosJson", u.getPhotosJson() != null ? u.getPhotosJson() : "[]");
                    m.put("personalityTagline", u.getPersonalityTagline() != null ? u.getPersonalityTagline() : "");
                    m.put("city", u.getCity() != null ? u.getCity() : "");
                });
            richMatches.add(m);
        }
        return ResponseEntity.ok(Map.of("matches", richMatches));
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable("id") java.lang.Long id, Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required"));
        }
        if (!currentUser.getId().equals(id)) {
            logger.warn("[AUTHZ] User {} attempted to delete user {}", currentUser.getId(), id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You can only delete your own account"));
        }
        logger.info("[DEBUG-AUTH] Deletion request for user id: " + id);
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "User and all associated data deleted successfully"));
        } catch (Exception e) {
            logger.error("[DEBUG-AUTH] Deletion failed: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to delete user"));
        }
    }
}
