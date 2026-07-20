package com.uber.rideservice.service;

import com.uber.rideservice.dto.BookRideRequest;
import com.uber.common.event.RideRequestedEvent;
import com.uber.rideservice.model.Ride;
import com.uber.rideservice.model.RideStatus;
import com.uber.rideservice.repository.RideRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uber.rideservice.model.OutboxEvent;
import com.uber.rideservice.model.OutboxStatus;
import com.uber.rideservice.repository.OutboxEventRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class RideService {

    private final RideRepository rideRepository;
    private final HaversinePricingService pricingService;
    private final SurgePricingService surgePricingService;
    private final SseEmitterService sseEmitterService;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    private static final String RIDE_REQUESTED_TOPIC = "ride.requested";

    @Transactional
    public Ride createRide(BookRideRequest request) {
        log.info("Initiating ride creation for passenger: {}", request.getPassengerId());
        
        // Calculate dynamic surge multiplier using supply/demand metrics
        double surgeMultiplier = surgePricingService.calculateSurgeMultiplier(
                request.getPickupLatitude(), request.getPickupLongitude()
        ); 
        
        double fare = pricingService.calculateFare(
                request.getPickupLatitude(), request.getPickupLongitude(),
                request.getDropLatitude(), request.getDropLongitude(),
                surgeMultiplier
        );

        Ride ride = Ride.builder()
                .passengerId(request.getPassengerId())
                .pickupLatitude(request.getPickupLatitude())
                .pickupLongitude(request.getPickupLongitude())
                .dropLatitude(request.getDropLatitude())
                .dropLongitude(request.getDropLongitude())
                .pickupAddress(request.getPickupAddress())
                .dropAddress(request.getDropAddress())
                .fare(Math.round(fare * 100.0) / 100.0)
                .status(RideStatus.REQUESTED)
                .build();

        Ride savedRide = rideRepository.save(ride);
        log.info("Ride persistent record stored in Aiven MySQL with ID: {}", savedRide.getId());

        // Stream the event to Kafka topic for matching-service ingestion
        RideRequestedEvent event = RideRequestedEvent.builder()
                .rideId(savedRide.getId().toString())
                .passengerId(savedRide.getPassengerId())
                .pickupLatitude(savedRide.getPickupLatitude())
                .pickupLongitude(savedRide.getPickupLongitude())
                .dropLatitude(savedRide.getDropLatitude())
                .dropLongitude(savedRide.getDropLongitude())
                .pickupAddress(savedRide.getPickupAddress())
                .dropAddress(savedRide.getDropAddress())
                .fare(savedRide.getFare())
                .build();

        // Serialize event and save to outbox table within the SAME transaction
        try {
            String payload = objectMapper.writeValueAsString(event);
            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .topic(RIDE_REQUESTED_TOPIC)
                    .messageKey(savedRide.getId().toString())
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .build();
            outboxEventRepository.save(outboxEvent);
            log.info("Saved RideRequestedEvent to Outbox table for ride: {}", savedRide.getId());
        } catch (Exception ex) {
            log.error("Failed to serialize OutboxEvent for ride {}", savedRide.getId(), ex);
            throw new RuntimeException("Ride booking failed due to internal error. Please try again.");
        }

        // Transition to MATCHING — driver search is now in progress
        savedRide.setStatus(RideStatus.MATCHING);
        savedRide = rideRepository.save(savedRide);
        log.info("Ride {} status updated to MATCHING.", savedRide.getId());

        sseEmitterService.publish(savedRide.getId(), savedRide);

        return savedRide;
    }

    @Transactional
    public Ride startRide(UUID rideId) {
        Ride ride = getRideOrThrow(rideId);
        if (ride.getStatus() != RideStatus.ACCEPTED && ride.getStatus() != RideStatus.DRIVER_ARRIVING) {
            throw new IllegalStateException("Ride cannot be started from state: " + ride.getStatus());
        }
        ride.setStatus(RideStatus.RIDE_STARTED);
        log.info("Ride {} has started.", rideId);
        Ride saved = rideRepository.save(ride);
        sseEmitterService.publish(rideId, saved);
        return saved;
    }

    @Transactional
    public Ride completeRide(UUID rideId) {
        Ride ride = getRideOrThrow(rideId);
        if (ride.getStatus() != RideStatus.RIDE_STARTED) {
            throw new IllegalStateException("Ride cannot be completed because it has not started.");
        }
        ride.setStatus(RideStatus.COMPLETED);
        log.info("Ride {} completed successfully.", rideId);
        Ride saved = rideRepository.save(ride);
        sseEmitterService.publish(rideId, saved);
        return saved;
    }

    @Transactional
    public Ride cancelRide(UUID rideId) {
        Ride ride = getRideOrThrow(rideId);
        if (ride.getStatus() == RideStatus.COMPLETED || ride.getStatus() == RideStatus.CANCELLED) {
            throw new IllegalStateException("Ride is already finalized and cannot be cancelled.");
        }
        ride.setStatus(RideStatus.CANCELLED);
        log.info("Ride {} was cancelled.", rideId);
        Ride saved = rideRepository.save(ride);
        sseEmitterService.publish(rideId, saved);
        return saved;
    }

    public Ride getRideDetails(UUID rideId) {
        return getRideOrThrow(rideId);
    }

    private Ride getRideOrThrow(UUID rideId) {
        return rideRepository.findById(rideId)
                .orElseThrow(() -> new EntityNotFoundException("Ride with ID " + rideId + " does not exist."));
    }
}
