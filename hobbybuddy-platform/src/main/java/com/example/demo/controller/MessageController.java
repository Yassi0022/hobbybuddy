package com.example.demo.controller;

import com.example.demo.model.Message;
import com.example.demo.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/{user1}/{user2}")
    public ResponseEntity<List<Message>> getConversation(
            @PathVariable Long user1,
            @PathVariable Long user2) {
        List<Message> conversation = messageRepository.findConversation(user1, user2);
        return ResponseEntity.ok(conversation);
    }

    @PostMapping
    public ResponseEntity<Message> sendMessage(@RequestBody Message message) {
        if (message.getTimestamp() == null) {
            message.setTimestamp(java.time.LocalDateTime.now());
        }
        Message savedMessage = messageRepository.save(message);
        // Push notification of the REST-sent message as well
        messagingTemplate.convertAndSend("/topic/chat/" + message.getReceiverId(), savedMessage);
        return ResponseEntity.ok(savedMessage);
    }

    // WebSocket STOMP Endpoint
    @MessageMapping("/chat.send")
    public void handleWebSocketMessage(Message message) {
        if (message.getTimestamp() == null) {
            message.setTimestamp(java.time.LocalDateTime.now());
        }
        Message savedMessage = messageRepository.save(message);
        // Send to receiver
        messagingTemplate.convertAndSend("/topic/chat/" + message.getReceiverId(), savedMessage);
    }
}

