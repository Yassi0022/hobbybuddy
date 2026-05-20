package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.ArchetypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

@Controller
@RequestMapping("/quiz")
public class QuizController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ArchetypeService archetypeService;

    @GetMapping
    public String getQuizPage(Principal principal) {
        if (principal != null) {
            Optional<User> userOpt = userRepository.findByEmail(principal.getName());
            if (userOpt.isPresent() && userOpt.get().getArchetype() != null && !userOpt.get().getArchetype().isBlank()) {
                return "redirect:/dashboard";
            }
        }
        return "quiz";
    }

    @PostMapping("/submit")
    public String submitQuiz(@RequestParam Map<String, String> answers, Principal principal) {
        if (principal == null) return "redirect:/login";
        
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        
        double openness = calculateScore(answers, "O");
        double conscientiousness = calculateScore(answers, "C");
        double extraversion = calculateScore(answers, "E");
        double agreeableness = calculateScore(answers, "A");
        double neuroticism = calculateScore(answers, "N");
        
        user.setOpenness(openness);
        user.setConscientiousness(conscientiousness);
        user.setExtraversion(extraversion);
        user.setAgreeableness(agreeableness);
        user.setNeuroticism(neuroticism);
        
        String archetype = archetypeService.calculateArchetype(openness, conscientiousness, extraversion, agreeableness, neuroticism);
        user.setArchetype(archetype);
        
        if (answers.containsKey("hobbies")) {
            user.setHobbies(answers.get("hobbies"));
        }
        
        userRepository.save(user);
        System.out.println("[DEBUG] Archetype saved for " + user.getEmail() + ": " + archetype);
        
        return "redirect:/dashboard";
    }

    private double calculateScore(Map<String, String> answers, String dimension) {
        double total = 0;
        int count = 0;
        for (Map.Entry<String, String> entry : answers.entrySet()) {
            if (entry.getKey().startsWith(dimension)) {
                try {
                    total += Double.parseDouble(entry.getValue());
                    count++;
                } catch (Exception e) {}
            }
        }
        return count == 0 ? 3.0 : total / count;
    }
}
