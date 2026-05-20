package com.example.demo.controller;

import com.example.demo.dto.MatchResponseDTO;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.MatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api")
public class MatchController {

    @Autowired
    private MatchingService matchingService;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/matches")
    public List<MatchResponseDTO> getMatches(Principal principal) {
        if (principal == null) return List.of();
        
        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return List.of();

        List<User> allUsers = userRepository.findAll();
        
        // Chiama il servizio che contatta Python!
        return matchingService.calculateMatches(currentUser, allUsers);
    }
}