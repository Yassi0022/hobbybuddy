package com.example.demo.repository;

import com.example.demo.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    
    @Query("SELECT e FROM Event e WHERE (:city IS NULL OR e.location = :city) AND (:hobby IS NULL OR e.hobbyCategory = :hobby) ORDER BY e.date ASC")
    List<Event> findByFilters(@Param("city") String city, @Param("hobby") String hobby);

}
