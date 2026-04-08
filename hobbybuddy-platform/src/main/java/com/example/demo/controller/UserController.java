package com.example.demo.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.dao.DataIntegrityViolationException;

import com.example.demo.dto.LoginRequestDTO;
import com.example.demo.dto.UserResponseDTO;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;
import com.example.demo.security.JwtUtil;

@RestController
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
            String token = jwtUtil.generateToken(user.getEmail());
            addJwtCookie(response, token);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", token,
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName()
            ));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Registration failed"));
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

            return ResponseEntity.ok(Map.of(
                "token", token,
                "userId", user.getId(),
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName()
            ));
        } catch (org.springframework.security.core.AuthenticationException e) {
            logger.warn("[DEBUG-AUTH] Auth failed for: " + email);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        } catch (Exception e) {
            logger.error("[DEBUG-AUTH] Unexpected error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Server error"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerLegacy(@RequestBody User user, HttpServletResponse response) {
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
        return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "email", user.getEmail(),
            "name", user.getName()
        ));
    }

    @GetMapping("/{id}/find-buddy")
    public List<UserResponseDTO> findBuddyForUser(@PathVariable("id") java.lang.Long id) {
        return userService.findBestBuddy(java.util.Objects.requireNonNull(id));
    }

    @PutMapping("/{id}/traits")
    public ResponseEntity<?> updateTraits(@PathVariable("id") java.lang.Long id, @RequestBody Map<String, Integer> traits) {
        Optional<User> userOpt = userRepository.findById(java.util.Objects.requireNonNull(id));
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("{\"error\":\"User not found\"}");
        }
        User user = userOpt.get();
        if (traits.containsKey("openness")) user.setOpenness(traits.get("openness"));
        if (traits.containsKey("conscientiousness")) user.setConscientiousness(traits.get("conscientiousness"));
        if (traits.containsKey("extraversion")) user.setExtraversion(traits.get("extraversion"));
        if (traits.containsKey("agreeableness")) user.setAgreeableness(traits.get("agreeableness"));
        if (traits.containsKey("neuroticism")) user.setNeuroticism(traits.get("neuroticism"));
        userRepository.save(user);

        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        return ResponseEntity.ok(dto);
    }
}
