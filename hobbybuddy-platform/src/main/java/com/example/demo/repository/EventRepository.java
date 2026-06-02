package com.example.demo.repository;

import com.example.demo.model.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    @Query("SELECT e FROM Event e WHERE (:city IS NULL OR e.location = :city) AND (:hobby IS NULL OR e.hobbyCategory = :hobby) ORDER BY e.date ASC")
    List<Event> findByFilters(@Param("city") String city, @Param("hobby") String hobby);

    /**
     * Paginated upcoming events in a city (date >= now), sorted ascending.
     */
    @Query("SELECT e FROM Event e WHERE e.location = :city AND e.date >= CURRENT_TIMESTAMP ORDER BY e.date ASC")
    Page<Event> findUpcomingByCity(@Param("city") String city, Pageable pageable);

    /**
     * Count upcoming events in a city.
     */
    @Query("SELECT COUNT(e) FROM Event e WHERE e.location = :city AND e.date >= CURRENT_TIMESTAMP")
    long countUpcomingByCity(@Param("city") String city);

    /**
     * Count distinct users who created events in a city.
     */
    @Query("SELECT COUNT(DISTINCT e.createdBy.id) FROM Event e WHERE e.location = :city")
    int countDistinctUsersInCity(@Param("city") String city);

    /**
     * Paginated events by city and hobby category.
     */
    @Query("SELECT e FROM Event e WHERE (:city IS NULL OR e.location = :city) AND (:hobby IS NULL OR e.hobbyCategory = :hobby) ORDER BY e.date ASC")
    Page<Event> findPageByFilters(@Param("city") String city, @Param("hobby") String hobby, Pageable pageable);

    /**
     * Count events matching city + hobby filter.
     */
    @Query("SELECT COUNT(e) FROM Event e WHERE (:city IS NULL OR e.location = :city) AND (:hobby IS NULL OR e.hobbyCategory = :hobby)")
    long countByFilters(@Param("city") String city, @Param("hobby") String hobby);

    void deleteByCreatedBy(com.example.demo.model.User user);
}
