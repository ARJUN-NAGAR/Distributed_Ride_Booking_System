package com.uber.rideservice.service;

import com.uber.rideservice.client.LocationServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SurgePricingService {

    private final StringRedisTemplate redisTemplate;
    private final LocationServiceClient locationServiceClient;

    private static final String DEMAND_PREFIX = "demand:";
    private static final double RAD_KM = 5.0;

    public double calculateSurgeMultiplier(double latitude, double longitude) {
        // Round coordinates to 2 decimal places (grids of ~1.1km)
        String latKey = String.format("%.2f", latitude);
        String lonKey = String.format("%.2f", longitude);
        String key = DEMAND_PREFIX + latKey + ":" + lonKey;

        // 1. Increment demand count in Redis
        Long demandCount = redisTemplate.opsForValue().increment(key);
        if (demandCount != null && demandCount == 1L) {
            // Set expire time for new key (window of 2 minutes)
            redisTemplate.expire(key, Duration.ofMinutes(2));
        }
        
        long demand = demandCount != null ? demandCount : 1L;

        // 2. Fetch active supply in a 5km radius via OpenFeign client
        int supply = 0;
        try {
            List<?> nearbyDrivers = locationServiceClient.getNearbyDrivers(latitude, longitude, RAD_KM);
            supply = nearbyDrivers != null ? nearbyDrivers.size() : 0;
        } catch (Exception e) {
            log.error("Failed to query location service for nearby drivers: {}", e.getMessage());
            // Fallback: assume default supply
            supply = 2;
        }

        // 3. Compute dynamic surge multiplier
        // If demand exceeds supply, multiplier increases up to 2.5x (1.0 + 1.5)
        double ratio = (double) demand / (supply + 1);
        double surgeMultiplier = 1.0 + Math.min(1.5, ratio);

        log.info("Surge evaluation at grid ({}, {}). Demand: {}, Supply: {}, Ratio: {}, Multiplier: {}",
                latKey, lonKey, demand, supply, ratio, surgeMultiplier);

        return surgeMultiplier;
    }
}
