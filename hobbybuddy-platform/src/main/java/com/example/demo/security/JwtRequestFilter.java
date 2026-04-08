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

import org.springframework.security.core.userdetails.UserDetails;
import java.io.IOException;
import java.util.Arrays;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(@org.springframework.lang.NonNull HttpServletRequest request,
                                    @org.springframework.lang.NonNull HttpServletResponse response,
                                    @org.springframework.lang.NonNull FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");
        String username = null;
        String jwt = null;

        logger.info(String.format("Request: %s %s, Cookie jwt: %s", request.getMethod(), request.getRequestURI(), 
            Arrays.stream(request.getCookies() != null ? request.getCookies() : new jakarta.servlet.http.Cookie[0])
                .filter(c -> "jwt".equals(c.getName()))
                .findFirst().map(jakarta.servlet.http.Cookie::getValue).orElse("NO JWT COOKIE")));

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
            logger.info("[DEBUG-AUTH] Query parameter 'token' detected");
        }

        if (jwt != null) {
            try {
                logger.info("Parsing JWT from cookie: " + (jwt.length() > 20 ? jwt.substring(0, 20) + "..." : jwt));
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                logger.error("Failed to extract username from token: " + e.getMessage());
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtUtil.validateToken(jwt)) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                if (userDetails != null) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()); 
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("SECURITY CONTEXT POPOLATO per: " + userDetails.getUsername());
                }
            }
        }
        chain.doFilter(request, response);
    }
}
