package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.dao.DataIntegrityViolationException;

import com.example.demo.dto.LoginRequestDTO;
import com.example.demo.dto.UserResponseDTO;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;
import com.example.demo.security.JwtUtil;

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

    private void addJwtCookie(HttpServletResponse response, String token) {
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true); // Secure for Production (HTTPS)
        cookie.setPath("/");
        cookie.setMaxAge(86400); // 1 day
        response.addCookie(cookie);
        // Add SameSite=Lax via header manually to ensure compatibility
        response.addHeader("Set-Cookie", "jwt=" + token + "; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax");
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user, HttpServletResponse response) {
        logger.info("[DEBUG-AUTH] Registration attempt: " + user.getEmail());
        try {
            userService.saveUser(user);
            
            // Handle referral
            if (user.getReferredBy() != null) {
                userRepository.findById(user.getReferredBy()).ifPresent(referrer -> {
                    referrer.setReferralCount(referrer.getReferralCount() + 1);
                    userRepository.save(referrer);
                });
            }

            String token = jwtUtil.generateToken(user.getEmail());
            addJwtCookie(response, token);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", token,
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName()
            ));
        } catch (DataIntegrityViolationException e) {
            logger.warn("[DEBUG-AUTH] Registration conflict: email {} already exists", user.getEmail());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
        } catch (RuntimeException e) {
            if ("Email already exists".equals(e.getMessage())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
            }
            throw e; // Rethrow others
        } catch (Exception e) {
            logger.error("[DEBUG-AUTH] Registration CRITICAL FAILURE for {}: ", user.getEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Server connectivity error. Please try again in a few moments.",
                "details", e.getMessage()
            ));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest, HttpServletResponse response) {
        String email = loginRequest.getEmail();
        String password = loginRequest.getPassword();
        logger.info("[DEBUG-AUTH] Login attempt: " + email);
        
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
                    logger.info("[DEBUG-AUTH] Migrating user password: " + email);
                    userService.saveUser(user); 
                    authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
                } else {
                    throw e;
                }
            }

            User user = userRepository.findByEmail(email).orElseThrow();
            String token = jwtUtil.generateToken(user.getEmail());
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
            logger.warn("[DEBUG-AUTH] Auth failed for: " + email);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        } catch (Exception e) {
            logger.error("[DEBUG-AUTH] Unexpected error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Server error"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user, HttpServletResponse response) {
        return createUser(user, response);
    }

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

    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable("id") java.lang.Long id, @RequestBody Map<String, Object> payload) {
        Optional<User> userOpt = userRepository.findById(java.util.Objects.requireNonNull(id));
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();
        
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
    public ResponseEntity<?> submitQuiz(@PathVariable("id") java.lang.Long id, @RequestBody Map<String, Object> payload) {
        if (!payload.containsKey("gdprConsent") || !(Boolean) payload.get("gdprConsent")) {
            return ResponseEntity.status(400).body(Map.of("error", "GDPR consent required"));
        }
        Optional<User> userOpt = userRepository.findById(java.util.Objects.requireNonNull(id));
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        User user = userOpt.get();
        
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

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable("id") java.lang.Long id) {
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
