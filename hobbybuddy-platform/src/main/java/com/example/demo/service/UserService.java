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
import com.example.demo.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${fastapi.url}")
    private String fastapiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

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

        if (target.getExtraversion() >= 38 && buddy.getExtraversion() >= 38) {
            shared.add("Souls of the Party!");
        } else if (target.getExtraversion() < 23 && buddy.getExtraversion() < 23) {
            shared.add("They love tranquility!");
        } else if (Math.abs(target.getExtraversion() - buddy.getExtraversion()) >= 15) {
            complementary.add("One talk, the other listens");
        }

        if (target.getOpenness() >= 38 && buddy.getOpenness() >= 38) {
            shared.add("Curious Explorers!");
        } else if (target.getOpenness() < 23 && buddy.getOpenness() < 23) {
            shared.add("Familiar and Cozy!");
        } else if (Math.abs(target.getOpenness() - buddy.getOpenness()) >= 15) {
            complementary.add("Tradition and Innovation");
        }

        if (target.getConscientiousness() >= 38 && buddy.getConscientiousness() >= 38) {
            shared.add("Organized and Reliable!");
        } else if (target.getConscientiousness() < 23 && buddy.getConscientiousness() < 23) {
            shared.add("Spontaneous and Flexible!");
        } else if (Math.abs(target.getConscientiousness() - buddy.getConscientiousness()) >= 15) {
            complementary.add("You improvise, the other plans");
        }

        if (target.getAgreeableness() >= 38 && buddy.getAgreeableness() >= 38) {
            shared.add("Empathetic Companions!");
        } else if (target.getAgreeableness() < 23 && buddy.getAgreeableness() < 23) {
            shared.add("Straight and Direct!");
        } else if (Math.abs(target.getAgreeableness() - buddy.getAgreeableness()) >= 15) {
            complementary.add("One confronts, the other compromises");
        }

        if (target.getNeuroticism() >= 38 && buddy.getNeuroticism() >= 38) {
            shared.add("Emotional Depth!");
        } else if (target.getNeuroticism() < 23 && buddy.getNeuroticism() < 23) {
            shared.add("Zen Minds!");
        } else if (Math.abs(target.getNeuroticism() - buddy.getNeuroticism()) >= 15) {
            complementary.add("One is the rock, the other the waves");
        }

        dtoResponse.setSharedStrengths(shared);
        dtoResponse.setComplementaryTraits(complementary);
    }

    public UserResponseDTO saveUser(User user) {
        // Encriptar password antes de salvar
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

        List<User> allOthers = userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(targetUserId))
                .collect(Collectors.toList());

        if (allOthers.isEmpty()) {
            throw new RuntimeException("Nessun altro utente nel database per fare un match!");
        }

        MatchRequestDTO requestDTO = new MatchRequestDTO();
        requestDTO.setTargetUser(convertToTraitsDTO(targetUser));

        List<UserTraitsDTO> candidates = allOthers.stream()
                .map(this::convertToTraitsDTO)
                .collect(Collectors.toList());
        requestDTO.setPotentialMatches(candidates);

        System.out.println("Invio a FastAPI: " + candidates.size() + " candidati");

        // Chiamata a Python con RestTemplate
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<MatchRequestDTO> entity = new HttpEntity<>(requestDTO, headers);

        ResponseEntity<MatchResponseDTO[]> response = restTemplate.postForEntity(
                fastapiUrl + "/calculate-match",
                entity,
                MatchResponseDTO[].class
        );

        MatchResponseDTO[] pythonResponse = response.getBody();
        if (pythonResponse == null || pythonResponse.length == 0) {
            return new java.util.ArrayList<>();
        }

        List<UserResponseDTO> matchedBuddies = new java.util.ArrayList<>();
        
        for (MatchResponseDTO match : pythonResponse) {
            User buddy = userRepository.findById(match.getBest_match_id()).orElse(null);
            if (buddy != null) {
                UserResponseDTO responseDTO = convertToDTO(buddy);
                responseDTO.pushMatchVibeScore((Double) (match.getSimilarity_score() * 100));
                generateVibesAndBadges(targetUser, buddy, responseDTO);
                matchedBuddies.add(responseDTO);
            }
        }

        return matchedBuddies;
    }
}
