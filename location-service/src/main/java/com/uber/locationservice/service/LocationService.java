package com.uber.locationservice.service;

import com.uber.common.dto.NearbyDriverResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.geo.Circle;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.GeoResults;
import org.springframework.data.geo.Point;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {

    private final RedisTemplate<String, String> redisTemplate;
    
    private static final String GEO_KEY = "driver_locations";
    private static final String RATINGS_KEY = "driver_ratings";

    public void updateDriverLocation(String driverId, double latitude, double longitude) {
        // Redis ops require: longitude first, then latitude
        Point point = new Point(longitude, latitude);
        redisTemplate.opsForGeo().add(GEO_KEY, point, driverId);
        
        // Mark driver as active with 15s TTL
        redisTemplate.opsForValue().set("driver:active:" + driverId, "true", java.time.Duration.ofSeconds(15));
        
        // Simulating or storing a persistent rating if none exists
        Object existingRating = redisTemplate.opsForHash().get(RATINGS_KEY, driverId);
        if (existingRating == null) {
            double initialRating = 4.0 + (Math.random() * 1.0); // 4.0 - 5.0 rating
            String ratingStr = String.format("%.2f", initialRating);
            redisTemplate.opsForHash().put(RATINGS_KEY, driverId, ratingStr);
            log.info("Initialized driver {} rating to: {}", driverId, ratingStr);
        }
        
        log.info("Updated driver {} telemetry in Redis to longitude: {}, latitude: {}", driverId, longitude, latitude);
    }

    public List<NearbyDriverResponse> findCandidateDrivers(double latitude, double longitude, double radiusKm) {
        Circle searchArea = new Circle(new Point(longitude, latitude), new Distance(radiusKm, RedisGeoCommands.DistanceUnit.KILOMETERS));
        
        RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs()
                .includeCoordinates()
                .includeDistance()
                .sortAscending();
 
        GeoResults<RedisGeoCommands.GeoLocation<String>> results = redisTemplate.opsForGeo().radius(GEO_KEY, searchArea, args);
        List<NearbyDriverResponse> candidates = new ArrayList<>();
 
        if (results != null) {
            results.forEach(result -> {
                RedisGeoCommands.GeoLocation<String> location = result.getContent();
                String driverId = location.getName();
                
                // Verify driver is active via TTL key
                Boolean isActive = redisTemplate.hasKey("driver:active:" + driverId);
                if (Boolean.TRUE.equals(isActive)) {
                    // Retrieve rating from Redis Hash
                    Object ratingVal = redisTemplate.opsForHash().get(RATINGS_KEY, driverId);
                    double rating = ratingVal != null ? Double.parseDouble(ratingVal.toString()) : 4.5;
 
                    candidates.add(NearbyDriverResponse.builder()
                            .driverId(driverId)
                            .latitude(location.getPoint().getY())  // Latitude
                            .longitude(location.getPoint().getX()) // Longitude
                            .distanceKm(result.getDistance().getValue())
                            .rating(rating)
                            .build());
                } else {
                    // Lazy eviction of expired driver
                    redisTemplate.opsForGeo().remove(GEO_KEY, driverId);
                    redisTemplate.opsForHash().delete(RATINGS_KEY, driverId);
                    log.info("Evicted inactive driver {} from geo index due to TTL expiry", driverId);
                }
            });
        }
        log.info("Found {} active candidate drivers within {}km of ({}, {})", candidates.size(), radiusKm, latitude, longitude);
        return candidates;
    }
}
