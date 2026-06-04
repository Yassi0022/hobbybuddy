package com.example.demo.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);
    private final SecretKey SECRET_KEY;
    private final long EXPIRATION_TIME = 86400000L; // 24 hours

    public JwtUtil(@Value("${JWT_SECRET:}") String jwtSecret) {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            logger.error("JWT_SECRET is not set. Application cannot start without a valid JWT secret.");
            throw new IllegalStateException(
                    "JWT_SECRET environment variable is required. " +
                    "Generate one with: openssl rand -base64 32"
            );
        }
        byte[] keyBytes = Base64.getDecoder().decode(jwtSecret);
        if (keyBytes.length < 32) {
            logger.error("JWT_SECRET is too short ({} bytes). Must be at least 256 bits (32 bytes) for HS256.", keyBytes.length);
            throw new IllegalStateException(
                    "JWT_SECRET must be at least 256 bits (32 bytes) when base64-decoded. " +
                    "Generate one with: openssl rand -base64 32"
            );
        }
        this.SECRET_KEY = Keys.hmacShaKeyFor(keyBytes);
        logger.info("JWT secret loaded successfully ({} bytes, HS256).", keyBytes.length);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SECRET_KEY)
                .compact();
    }

    public Boolean validateToken(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}
