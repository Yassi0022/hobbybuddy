package com.example.demo.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.LoginRequestDTO;
import com.example.demo.dto.UserResponseDTO;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;

import com.example.demo.security.JwtUtil;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<UserResponseDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    @PostMapping
    public UserResponseDTO createUser(@RequestBody User user) {
        UserResponseDTO dto = userService.saveUser(user);
        dto.setToken(jwtUtil.generateToken(user.getEmail()));
        return dto;
    }

    @GetMapping("/{id}/find-buddy")
    public List<UserResponseDTO> findBuddyForUser(@PathVariable("id") Long id) {
        return userService.findBestBuddy(id);
    }

    @PutMapping("/{id}/traits")
    public ResponseEntity<?> updateTraits(@PathVariable("id") Long id, @RequestBody Map<String, Integer> traits) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("{\"error\":\"User not found\"}");
        }
        User user = userOpt.get();
        if (traits.containsKey("openness")) user.setOpenness(traits.get("openness"));
        if (traits.containsKey("conscientiousness")) user.setConscientiousness(traits.get("conscientiousness"));
        if (traits.containsKey("extraversion")) user.setExtraversion(traits.get("extraversion"));
        if (traits.containsKey("agreeableness")) user.setAgreeableness(traits.get("agreeableness"));
        if (traits.containsKey("neuroticism")) user.setNeuroticism(traits.get("neuroticism"));
        userRepository.save(user);

        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(loginRequest.getPassword())) {
                UserResponseDTO dto = new UserResponseDTO();
                dto.setId(user.getId());
                dto.setName(user.getName());
                dto.setToken(jwtUtil.generateToken(user.getEmail()));
                return ResponseEntity.ok(dto);
            }
            return ResponseEntity.status(401).body("{\"error\":\"Wrong password\"}");
        }
        return ResponseEntity.status(404).body("{\"error\":\"User not found\"}");
    }
}
