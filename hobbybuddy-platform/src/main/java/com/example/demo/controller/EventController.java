package com.example.demo.controller;

import com.example.demo.model.Event;
import com.example.demo.model.User;
import com.example.demo.repository.EventRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/events")
public class EventController {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getEvents(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String hobby) {
        List<Event> events = eventRepository.findByFilters(city, hobby);
        return ResponseEntity.ok(events);
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Event event, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        
        event.setCreatedBy(user);
        // Automatically add creator to participants
        event.getParticipants().add(user);
        
        Event savedEvent = eventRepository.save(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedEvent);
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinEvent(@PathVariable Long id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        Optional<Event> eventOpt = eventRepository.findById(id);
        if (eventOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Event not found"));
        }

        Event event = eventOpt.get();
        if (event.getParticipants().stream().anyMatch(p -> p.getId().equals(user.getId()))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Already joined"));
        }

        if (event.getParticipants().size() >= event.getMaxParticipants()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Event is full"));
        }

        event.getParticipants().add(user);
        eventRepository.save(event);
        return ResponseEntity.ok(event);
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<?> leaveEvent(@PathVariable Long id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        Optional<Event> eventOpt = eventRepository.findById(id);
        if (eventOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Event not found"));
        }

        Event event = eventOpt.get();
        boolean removed = event.getParticipants().removeIf(p -> p.getId().equals(user.getId()));
        if (!removed) {
            return ResponseEntity.badRequest().body(Map.of("error", "Not a participant"));
        }

        eventRepository.save(event);
        return ResponseEntity.ok(event);
    }
}
