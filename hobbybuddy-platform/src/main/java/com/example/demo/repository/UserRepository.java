package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    /**
     * Find users in the same city who have completed the quiz, excluding the given user.
     */
    @Query("SELECT u FROM User u WHERE u.city = :city AND u.id <> :excludeId AND u.archetype IS NOT NULL")
    List<User> findNearbyBuddies(@Param("city") String city, @Param("excludeId") Long excludeId);

    /**
     * Find all users who have completed the quiz, excluding the given user.
     * Fallback when city is not set.
     */
    @Query("SELECT u FROM User u WHERE u.id <> :excludeId AND u.archetype IS NOT NULL")
    List<User> findAllBuddiesExcluding(@Param("excludeId") Long excludeId);
}
