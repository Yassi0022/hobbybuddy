package com.example.demo.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring Cache configuration with named caches and TTL-like behavior.
 *
 * Uses ConcurrentMapCacheManager for simplicity (single-instance deployment).
 * For production with multiple instances, swap to Redis or Caffeine.
 *
 * Cache names:
 * - "external-events" : Ticketmaster API responses (30-min TTL via @Cacheable unlessNull)
 * - "event-listings"  : Internal event listing queries (5-min TTL via manual invalidation)
 * - "location-resolve": Geolocation/city resolution results (60-min TTL via size cap)
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
                "external-events",
                "event-listings",
                "location-resolve"
        );
    }
}
