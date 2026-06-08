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

import org.springframework.http.ResponseEntity;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MatchController {

    @Autowired
    private MatchingService matchingService;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/matches")
    public ResponseEntity<?> getMatches(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        User currentUser = userRepository.findByEmail(principal.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.status(401).body(Map.of("error", "User not found"));

        List<User> allUsers = userRepository.findAll();
        List<MatchResponseDTO> matches = matchingService.calculateMatches(currentUser, allUsers);

        // If user has a priority match credit, consume it
        boolean hasPriority = currentUser.isPriorityMatchAvailable();
        if (hasPriority) {
            currentUser.setPriorityMatchAvailable(false);
            userRepository.save(currentUser);
        }

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("matches", matches);
        response.put("priorityMatchUsed", hasPriority);
        if (hasPriority) {
            response.put("priorityMessage", "You used your priority match credit from a referral!");
        }

        return ResponseEntity.ok(response);
    }
}