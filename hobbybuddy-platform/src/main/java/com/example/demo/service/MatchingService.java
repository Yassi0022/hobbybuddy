package com.example.demo.service;

import com.example.demo.dto.MatchRequestDTO;
import com.example.demo.dto.MatchResponseDTO;
import com.example.demo.dto.PythonMatchResponseDTO;
import com.example.demo.dto.UserTraitsDTO;
import com.example.demo.model.User;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MatchingService {

    private final String fastapiUrl = "http://localhost:8001";
    private final RestTemplate restTemplate = new RestTemplate();

    public List<MatchResponseDTO> calculateMatches(User currentUser, List<User> allUsers) {
        List<MatchResponseDTO> matches = new ArrayList<>();
        
        if (currentUser.getOpenness() == null) return matches;

        List<User> validCandidates = allUsers.stream()
                .filter(u -> !u.getId().equals(currentUser.getId()) && u.getOpenness() != null)
                .collect(Collectors.toList());

        if (validCandidates.isEmpty()) {
            return matches;
        }

        MatchRequestDTO requestDTO = new MatchRequestDTO();
        requestDTO.setTargetUser(convertToTraitsDTO(currentUser));

        List<UserTraitsDTO> candidatesDTOs = validCandidates.stream()
                .map(this::convertToTraitsDTO)
                .collect(Collectors.toList());
        requestDTO.setPotentialMatches(candidatesDTOs);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<MatchRequestDTO> entity = new HttpEntity<>(requestDTO, headers);

        try {
            ResponseEntity<PythonMatchResponseDTO[]> response = restTemplate.postForEntity(
                    fastapiUrl + "/calculate-match",
                    entity,
                    PythonMatchResponseDTO[].class
            );

            PythonMatchResponseDTO[] pythonResponse = response.getBody();
            if (pythonResponse == null || pythonResponse.length == 0) {
                return matches;
            }

            Map<Long, User> userMap = validCandidates.stream()
                    .collect(Collectors.toMap(User::getId, Function.identity()));

            for (PythonMatchResponseDTO pyMatch : pythonResponse) {
                User matchUser = userMap.get(pyMatch.getBestMatchId());
                if (matchUser != null) {
                    int percentage = (int) Math.round(pyMatch.getSimilarityScore() * 100);
                    matches.add(new MatchResponseDTO(
                            matchUser.getName() != null ? matchUser.getName() : "Buddy",
                            matchUser.getArchetype() != null ? matchUser.getArchetype() : "Explorer",
                            matchUser.getHobbies() != null ? matchUser.getHobbies() : "General",
                            percentage
                    ));
                }
            }

            // Sort descending by percentage
            matches.sort((a, b) -> Integer.compare(b.getCompatibilityPercentage(), a.getCompatibilityPercentage()));

            // Return top 5
            return matches.subList(0, Math.min(5, matches.size()));

        } catch (Exception e) {
            e.printStackTrace();
            return matches;
        }
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
}