package com.uber.rideservice.consumer;

import com.uber.common.event.RideMatchedEvent;
import com.uber.common.event.RideMatchingFailedEvent;
import com.uber.rideservice.model.Ride;
import com.uber.rideservice.model.RideStatus;
import com.uber.rideservice.repository.RideRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.uber.rideservice.service.SseEmitterService;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class RideLifecycleConsumer {

    private final RideRepository rideRepository;
    private final SseEmitterService sseEmitterService;

    @KafkaListener(topics = "ride.matched", groupId = "ride-lifecycle-group")
    @Transactional
    public void handleRideMatched(RideMatchedEvent event) {
        log.info("Received RideMatchedEvent for ride: {}, assigned driver: {}", event.getRideId(), event.getDriverId());

        try {
            UUID rideId = UUID.fromString(event.getRideId());
            Ride ride = rideRepository.findById(rideId)
                    .orElseThrow(() -> new EntityNotFoundException("Ride not found with ID: " + rideId));

            // Move status to ACCEPTED and assign the driver
            ride.setDriverId(event.getDriverId());
            ride.setStatus(RideStatus.ACCEPTED);
            
            Ride savedRide = rideRepository.save(ride);
            sseEmitterService.publish(rideId, savedRide);
            log.info("Successfully updated Ride {} state to ACCEPTED with driver: {}", rideId, event.getDriverId());
        } catch (Exception e) {
            log.error("Failed to process RideMatchedEvent: {}", e.getMessage());
            throw e;
        }
    }

    @KafkaListener(topics = "ride.matching-failed", groupId = "ride-lifecycle-group")
    @Transactional
    public void handleRideMatchingFailed(RideMatchingFailedEvent event) {
        log.info("Received RideMatchingFailedEvent for ride: {}. Compensating transaction starting.", event.getRideId());

        try {
            UUID rideId = UUID.fromString(event.getRideId());
            Ride ride = rideRepository.findById(rideId)
                    .orElseThrow(() -> new EntityNotFoundException("Ride not found with ID: " + rideId));

            // Transition back to CANCELLED state due to match failure
            ride.setStatus(RideStatus.CANCELLED);
            Ride savedRide = rideRepository.save(ride);
            sseEmitterService.publish(rideId, savedRide);
            log.info("Saga Compensation Complete. Ride {} updated status to CANCELLED.", rideId);
        } catch (Exception e) {
            log.error("Failed to execute compensation Saga for ride {}: {}", event.getRideId(), e.getMessage());
            throw e;
        }
    }
}
