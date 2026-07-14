package com.example.demo.repository;

import com.example.demo.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE (m.senderId = :user1 AND m.receiverId = :user2) OR (m.senderId = :user2 AND m.receiverId = :user1) ORDER BY m.timestamp ASC")
    List<Message> findConversation(@Param("user1") Long user1, @Param("user2") Long user2);

    /** All messages where the given user is sender or receiver, newest first. */
    @Query("SELECT m FROM Message m WHERE m.senderId = :userId OR m.receiverId = :userId ORDER BY m.timestamp DESC")
    List<Message> findAllForUser(@Param("userId") Long userId);

    void deleteBySenderId(Long senderId);
    void deleteByReceiverId(Long receiverId);
}
