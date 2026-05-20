package com.example.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.core.Authentication;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;

@Controller
public class PagesController {

    @Autowired
    private UserRepository userRepository;

    /**
     * Serve the React SPA index.html for all non-API routes.
     * The React Router handles client-side routing.
     */
    @GetMapping(value = {
        "/",
        "/login",
        "/register",
        "/quiz",
        "/dashboard",
        "/profile",
        "/privacy",
        "/terms",
        "/discover",
        "/messages",
        "/events",
        "/feed",
        "/settings"
    })
    public String serveSPA(Authentication authentication) {
        // Server-side redirect logic for authenticated users
        if (authentication != null && authentication.isAuthenticated()) {
            User user = userRepository.findByEmail(authentication.getName()).orElse(null);
            if (user != null) {
                // If user hasn't completed quiz, redirect to quiz
                if ((user.getArchetype() == null || user.getArchetype().isBlank())) {
                    // Only redirect if not already on quiz page
                    // (this is handled by React client-side too)
                }
            }
        }
        return "forward:/index.html";
    }
}
