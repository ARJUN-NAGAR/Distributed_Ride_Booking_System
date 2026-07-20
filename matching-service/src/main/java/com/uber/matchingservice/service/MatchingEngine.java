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

        // Fetch driver coordinates from Location service (sync call via OpenFeign)
        List<NearbyDriverResponse> nearbyDrivers = locationServiceClient.getNearbyDrivers(
                event.getPickupLatitude(),
                event.getPickupLongitude(),
                searchRadiusKm
        );

        // Update instance-based resilience fallback cache
        locationServiceClientFallback.updateCache(nearbyDrivers);

        log.info("Location service returned {} driver locations", nearbyDrivers.size());

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
            log.warn("Match failed: No available unlocked driver found in {} km range for Ride: {}", searchRadiusKm, event.getRideId());
            throw new RuntimeException("No available driver found for ride ID: " + event.getRideId());
        }
    }

    @DltHandler
    public void handleDltRideRequest(RideRequestedEvent event) {
        log.error("Exhausted retries. Message for ride {} routed to DLT. Triggering Saga compensation.", event.getRideId());
        
        RideMatchingFailedEvent failedEvent = RideMatchingFailedEvent.builder()
                .rideId(event.getRideId())
                .reason("No driver was found within " + searchRadiusKm + " km after multiple attempts.")
                .build();

        kafkaTemplate.send(RIDE_FAILED_TOPIC, event.getRideId(), failedEvent);
        log.info("Emitted RideMatchingFailedEvent to Kafka for compensating transaction.");
    }
}
