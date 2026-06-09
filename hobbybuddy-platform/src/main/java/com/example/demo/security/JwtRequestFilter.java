package com.example.demo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import com.example.demo.repository.UserRepository;
import com.example.demo.model.User;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtRequestFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Endpoints that are accessible without email verification.
     * Includes: auth endpoints, verification endpoints, public endpoints, and static resources.
     */
    private static final List<String> SKIP_VERIFICATION_CHECK = Arrays.asList(
            "/api/users/login",
            "/api/users/register",
            "/api/users",
            "/api/users/verify",
            "/api/users/send-verification",
            "/api/users/forgot-password",
            "/api/users/reset-password",
            "/api/health",
            "/ws-chat"
    );

    @Override
    protected void doFilterInternal(@org.springframework.lang.NonNull HttpServletRequest request,
                                    @org.springframework.lang.NonNull HttpServletResponse response,
                                    @org.springframework.lang.NonNull FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");
        String username = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
        } else if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    jwt = cookie.getValue();
                    break;
                }
            }
        }

        // Final fallback to query param (e.g. for WebSockets or specific links)
        if (jwt == null && request.getParameter("token") != null) {
            jwt = request.getParameter("token");
            logger.debug("Query parameter 'token' detected");
        }

        if (jwt != null) {
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                logger.error("Failed to extract username from token: {}", e.getMessage());
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtUtil.validateToken(jwt)) {
                // ── Auth version check ──
                // Reject tokens issued before the last password change/reset.
                int tokenAuthVersion = jwtUtil.extractAuthVersion(jwt);
                User user = userRepository.findByEmail(username).orElse(null);
                if (user != null && tokenAuthVersion < user.getAuthVersion()) {
                    logger.warn("[AUTH] Rejected stale JWT for user {} (token authVersion={}, current={})",
                            username, tokenAuthVersion, user.getAuthVersion());
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write(
                            "{\"error\":\"TOKEN_INVALIDATED\",\"message\":\"Your session was invalidated after a password change. Please log in again.\"}");
                    response.getWriter().flush();
                    return;
                }

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                if (userDetails != null) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        }

        // ── Email verification gate ──
        // After authentication is set, check if the user has verified their email.
        // Allowlisted endpoints (login, register, verify, public) skip this check.
        if (SecurityContextHolder.getContext().getAuthentication() != null && isApiRequest(request)) {
            boolean needsVerificationCheck = true;
            String path = request.getRequestURI();
            for (String skipPath : SKIP_VERIFICATION_CHECK) {
                if (path.startsWith(skipPath)) {
                    needsVerificationCheck = false;
                    break;
                }
            }
            if (needsVerificationCheck) {
                String email = SecurityContextHolder.getContext().getAuthentication().getName();
                User verifiedUser = userRepository.findByEmail(email).orElse(null);
                if (verifiedUser != null && !verifiedUser.isEmailVerified()) {
                    logger.warn("[AUTH] Blocked unverified user {} from accessing {}", email, path);
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write(
                            "{\"error\":\"EMAIL_NOT_VERIFIED\",\"message\":\"Please verify your email before accessing this resource.\"}");
                    response.getWriter().flush();
                    return;
                }
            }
        }

        chain.doFilter(request, response);
    }

    private boolean isApiRequest(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/") || path.startsWith("/ws-chat");
    }
}
