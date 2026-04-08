package com.example.demo.security;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        logger.info("[DEBUG-AUTH] [UserDetailsService] Attempting to load user by email: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.warn("[DEBUG-AUTH] [UserDetailsService] User NOT FOUND in DB with email: {}", email);
                    return new UsernameNotFoundException("User not found with email: " + email);
                });

        boolean isBCrypt = user.getPassword() != null && user.getPassword().startsWith("$2a$");
        logger.info("[DEBUG-AUTH] [UserDetailsService] User found: {}. ID: {}. Password length: {}. Likely BCrypt: {}. Assigning ROLE_USER.", 
                    user.getEmail(), user.getId(), (user.getPassword() != null ? user.getPassword().length() : 0), isBCrypt);
        
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }
}
