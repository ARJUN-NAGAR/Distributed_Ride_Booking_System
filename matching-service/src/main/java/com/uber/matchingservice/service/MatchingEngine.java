package com.uber.matchingservice.service;

import com.uber.matchingservice.client.LocationServiceClient;
import com.uber.matchingservice.client.LocationServiceClientFallback;
import com.uber.common.dto.NearbyDriverResponse;
import com.uber.common.event.RideMatchedEvent;
import com.uber.common.event.RideMatchingFailedEvent;
import com.uber.common.event.RideRequestedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingEngine {

    private final LocationServiceClient locationServiceClient;
    private final LocationServiceClientFallback locationServiceClientFallback;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final RedissonClient redissonClient;

    @Value("${matching.search-radius-km:5.0}")
    private double searchRadiusKm;

    @Value("${matching.score.proximity-weight:0.7}")
    private double proximityWeight;

    @Value("${matching.score.rating-weight:0.3}")
    private double ratingWeight;

    private static final String RIDE_MATCHED_TOPIC = "ride.matched";
    private static final String RIDE_FAILED_TOPIC = "ride.matching-failed";

    @RetryableTopic(
            attempts = "3",
            backoff = @Backoff(delay = 1000, multiplier = 2.0),
            dltTopicSuffix = "-dlt"
    )
    @KafkaListener(topics = "ride.requested", groupId = "matching-group")
    public void handleRideRequested(RideRequestedEvent event) {
        log.info("Received ride matching request for ride: {} (Ingested by consumer)", event.getRideId());

        // 3-Pass Dynamic Radius Expansion Search (Pass 1: 3.0km, Pass 2: 7.5km, Pass 3: 15.0km Hard Cap)
        double[] radiusPasses = new double[]{ 3.0, 7.5, 15.0 };
        List<NearbyDriverResponse> nearbyDrivers = java.util.Collections.emptyList();
        double effectiveRadius = searchRadiusKm;

        for (double passRadius : radiusPasses) {
            effectiveRadius = passRadius;
            log.info("Executing Proximity Radius Search Pass at {} km for Ride: {}", passRadius, event.getRideId());
            nearbyDrivers = locationServiceClient.getNearbyDrivers(
                    event.getPickupLatitude(),
                    event.getPickupLongitude(),
                    passRadius
            );

            if (nearbyDrivers != null && !nearbyDrivers.isEmpty()) {
                log.info("Pass at {} km succeeded: found {} candidate drivers", passRadius, nearbyDrivers.size());
                break;
            } else {
                log.warn("Pass at {} km returned 0 drivers for Ride: {}", passRadius, event.getRideId());
            }
        }

        // Update instance-based resilience fallback cache
        locationServiceClientFallback.updateCache(nearbyDrivers);

        log.info("Location service returned {} driver locations after dynamic expansion up to {} km", 
                nearbyDrivers != null ? nearbyDrivers.size() : 0, effectiveRadius);

        if (nearbyDrivers == null || nearbyDrivers.isEmpty()) {
            log.warn("Match failed: Zero drivers found within maximum hard limit of 15.0 km for Ride: {}", event.getRideId());
            throw new RuntimeException("No available driver found within maximum 15.0 km search boundary for ride ID: " + event.getRideId());
        }

        // Stream scoring heuristic: Score = (Proximity * 0.7) + (Rating * 0.3)
        List<NearbyDriverResponse> sortedDrivers = nearbyDrivers.stream()
                .sorted(Comparator.comparingDouble((NearbyDriverResponse driver) -> {
                    double distanceScore = 1.0 / (driver.getDistanceKm() + 0.1);
                    double ratingScore = driver.getRating();
                    return (distanceScore * proximityWeight) + (ratingScore * ratingWeight);
                }).reversed())
                .toList();

        NearbyDriverResponse matchedDriver = null;
        for (NearbyDriverResponse driver : sortedDrivers) {
            RLock lock = redissonClient.getLock("lock:driver:" + driver.getDriverId());
            try {
                // Try to acquire lock for this driver. Wait up to 500ms, hold lease for 5s.
                if (lock.tryLock(500, 5000, TimeUnit.MILLISECONDS)) {
                    matchedDriver = driver;
                    break;
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Thread interrupted while locking driver {}", driver.getDriverId());
            }
        }

        if (matchedDriver != null) {
            log.info("Match succeeded! Acquired lock for Selected Driver: {} for Ride: {}", matchedDriver.getDriverId(), event.getRideId());

            RideMatchedEvent matchedEvent = RideMatchedEvent.builder()
                    .rideId(event.getRideId())
                    .driverId(matchedDriver.getDriverId())
                    .build();

            kafkaTemplate.send(RIDE_MATCHED_TOPIC, event.getRideId(), matchedEvent);
        } else {
            log.warn("Match failed: No available unlocked driver found in {} km range for Ride: {}", effectiveRadius, event.getRideId());
            throw new RuntimeException("No available driver found for ride ID: " + event.getRideId());
        }
    }

    @DltHandler
    public void handleDltRideRequest(RideRequestedEvent event) {
        log.error("Exhausted retries. Message for ride {} routed to DLT. Triggering Saga compensation.", event.getRideId());
        
        RideMatchingFailedEvent failedEvent = RideMatchingFailedEvent.builder()
                .rideId(event.getRideId())
                .reason("No driver was found within maximum 15.0 km search boundary after multiple dynamic expansion passes.")
                .build();

        kafkaTemplate.send(RIDE_FAILED_TOPIC, event.getRideId(), failedEvent);
        log.info("Emitted RideMatchingFailedEvent to Kafka for compensating transaction.");
    }
}
