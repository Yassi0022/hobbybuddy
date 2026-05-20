package com.example.demo.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.demo.dto.MatchRequestDTO;
import com.example.demo.dto.MatchResponseDTO;
import com.example.demo.dto.UserResponseDTO;
import com.example.demo.dto.UserTraitsDTO;
import com.example.demo.model.User;
import com.example.demo.repository.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final EventRepository eventRepository;
    private final MessageRepository messageRepository;
    private final PasswordEncoder passwordEncoder;
    private final String fastapiUrl;
    private final RestTemplate restTemplate;

    @Autowired
    public UserService(UserRepository userRepository,
                       PostRepository postRepository,
                       EventRepository eventRepository,
                       MessageRepository messageRepository,
                       PasswordEncoder passwordEncoder,
                       @Value("${fastapi.url}") String fastapiUrl) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.eventRepository = eventRepository;
        this.messageRepository = messageRepository;
        this.passwordEncoder = passwordEncoder;
        this.fastapiUrl = fastapiUrl;
        this.restTemplate = new RestTemplate();
    }

    private UserResponseDTO convertToDTO(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        return dto;
    }

    private UserTraitsDTO convertToTraitsDTO(User user) {
        UserTraitsDTO dto = new UserTraitsDTO();
        dto.setId(user.getId());
        dto.setOpenness(user.getOpenness());
        dto.setConscientiousness(user.getConscientiousness());
        dto.setExtraversion(user.getExtraversion());
        dto.setAgreeableness(user.getAgreeableness());
        dto.setNeuroticism(user.getNeuroticism());
        return dto;
    }

    private void generateVibesAndBadges(User target, User buddy, UserResponseDTO dtoResponse) {
        java.util.List<String> shared = new java.util.ArrayList<>();
        java.util.List<String> complementary = new java.util.ArrayList<>();

        double targetE = target.getExtraversion() != null ? target.getExtraversion() : 0.0;
        double buddyE = buddy.getExtraversion() != null ? buddy.getExtraversion() : 0.0;
        if (targetE >= 38 && buddyE >= 38) {
            shared.add("Souls of the Party!");
        } else if (targetE < 23 && buddyE < 23) {
            shared.add("They love tranquility!");
        } else if (Math.abs(targetE - buddyE) >= 15) {
            complementary.add("One talk, the other listens");
        }

        double targetO = target.getOpenness() != null ? target.getOpenness() : 0.0;
        double buddyO = buddy.getOpenness() != null ? buddy.getOpenness() : 0.0;
        if (targetO >= 38 && buddyO >= 38) {
            shared.add("Curious Explorers!");
        } else if (targetO < 23 && buddyO < 23) {
            shared.add("Familiar and Cozy!");
        } else if (Math.abs(targetO - buddyO) >= 15) {
            complementary.add("Tradition and Innovation");
        }

        double targetC = target.getConscientiousness() != null ? target.getConscientiousness() : 0.0;
        double buddyC = buddy.getConscientiousness() != null ? buddy.getConscientiousness() : 0.0;
        if (targetC >= 38 && buddyC >= 38) {
            shared.add("Organized and Reliable!");
        } else if (targetC < 23 && buddyC < 23) {
            shared.add("Spontaneous and Flexible!");
        } else if (Math.abs(targetC - buddyC) >= 15) {
            complementary.add("You improvise, the other plans");
        }

        double targetA = target.getAgreeableness() != null ? target.getAgreeableness() : 0.0;
        double buddyA = buddy.getAgreeableness() != null ? buddy.getAgreeableness() : 0.0;
        if (targetA >= 38 && buddyA >= 38) {
            shared.add("Empathetic Companions!");
        } else if (targetA < 23 && buddyA < 23) {
            shared.add("Straight and Direct!");
        } else if (Math.abs(targetA - buddyA) >= 15) {
            complementary.add("One confronts, the other compromises");
        }

        double targetN = target.getNeuroticism() != null ? target.getNeuroticism() : 0.0;
        double buddyN = buddy.getNeuroticism() != null ? buddy.getNeuroticism() : 0.0;
        if (targetN >= 38 && buddyN >= 38) {
            shared.add("Emotional Depth!");
        } else if (targetN < 23 && buddyN < 23) {
            shared.add("Zen Minds!");
        } else if (Math.abs(targetN - buddyN) >= 15) {
            complementary.add("One is the rock, the other the waves");
        }

        dtoResponse.setSharedStrengths(shared);
        dtoResponse.setComplementaryTraits(complementary);
    }

    public UserResponseDTO saveUser(User user) {
        // Explicit unique check for registration
        if (user.getId() == null) {
            if (userRepository.findByEmail(user.getEmail()).isPresent()) {
                throw new RuntimeException("Email already exists");
            }
        }

        // Encrypt password before saving
        if (user.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    public List<UserResponseDTO> getAllUsers() {
        List<User> usersInDatabase = userRepository.findAll();
        return usersInDatabase.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<UserResponseDTO> findBestBuddy(Long targetUserId) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Matching logic moved to MatchingService.java
        return new java.util.ArrayList<>();
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        
        // Delete related posts
        postRepository.deleteByAuthor(user);
        
        // Delete related events created by user
        eventRepository.deleteByCreatedBy(user);
        
        // Remove from other events participants lists
        List<com.example.demo.model.Event> participatingEvents = eventRepository.findAll().stream()
                .filter(e -> e.getParticipants().contains(user))
                .collect(Collectors.toList());
        for (com.example.demo.model.Event e : participatingEvents) {
            e.getParticipants().remove(user);
            eventRepository.save(e);
        }
        
        // Delete messages (as sender or receiver)
        messageRepository.deleteBySenderId(id);
        messageRepository.deleteByReceiverId(id);
        
        // Finally delete the user
        userRepository.delete(user);
    }
}
