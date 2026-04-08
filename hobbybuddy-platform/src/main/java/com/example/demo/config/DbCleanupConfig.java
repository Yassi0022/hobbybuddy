package com.example.demo.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Objects;

/**
 * TEMPORARY CLEANUP CLASS
 * IMPORTANT: This class should be DELETED after the first successful run.
 * It removes duplicate users based on email, keeping only the record with the minimum ID.
 */
@Configuration
public class DbCleanupConfig {

    private static final Logger logger = LoggerFactory.getLogger(DbCleanupConfig.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void cleanupDuplicates() {
        logger.info("======= DATABASE CLEANUP START =======");
        
        try {
            // 1. Log current state
            Integer totalUsersBefore = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
            Integer distinctEmails = jdbcTemplate.queryForObject("SELECT COUNT(DISTINCT email) FROM users", Integer.class);
            
            totalUsersBefore = Objects.requireNonNullElse(totalUsersBefore, 0);
            distinctEmails = Objects.requireNonNullElse(distinctEmails, 0);

            logger.info("Total users before cleanup: {}", totalUsersBefore);
            logger.info("Distinct emails found: {}", distinctEmails);
            logger.info("Duplicates to remove: {}", (totalUsersBefore - distinctEmails));

            if (totalUsersBefore > distinctEmails) {
                // 2. Perform cleanup
                // We use a subquery to find IDs that are NOT the minimum for each email
                String sql = "DELETE FROM users WHERE id NOT IN (" +
                             "  SELECT min_id FROM (" +
                             "    SELECT MIN(id) as min_id FROM users GROUP BY email" +
                             "  ) as tmp" +
                             ")";
                
                int rowsAffected = jdbcTemplate.update(sql);
                logger.info("Cleanup successful. Rows deleted: {}", rowsAffected);
            } else {
                logger.info("No duplicates found. Skipping delete operation.");
            }

            // 3. Log final state
            Integer totalUsersAfter = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
            totalUsersAfter = Objects.requireNonNullElse(totalUsersAfter, 0);
            logger.info("Total users after cleanup: {}", totalUsersAfter);
            
        } catch (Exception e) {
            logger.error("Error during database cleanup: {}", e.getMessage());
        }

        logger.info("======= DATABASE CLEANUP END =======");
        logger.warn("IMPORTANT: Database cleanup performed. Please DELETE DbCleanupConfig.java before the next deployment.");
    }
}
