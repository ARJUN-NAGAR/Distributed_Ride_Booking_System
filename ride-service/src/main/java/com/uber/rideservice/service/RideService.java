package com.uber.rideservice.service;

import com.uber.rideservice.dto.BookRideRequest;
import com.uber.rideservice.event.RideRequestedEvent;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class RideService {

    private final RideRepository rideRepository;
    private final HaversinePricingService pricingService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final SurgePricingService surgePricingService;

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
                .fare(savedRide.getFare())
                .build();

        kafkaTemplate.send(RIDE_REQUESTED_TOPIC, savedRide.getId().toString(), event);
        log.info("Emitted RideRequestedEvent to Kafka for ride: {}", savedRide.getId());

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
        return rideRepository.save(ride);
    }

    @Transactional
    public Ride completeRide(UUID rideId) {
        Ride ride = getRideOrThrow(rideId);
        if (ride.getStatus() != RideStatus.RIDE_STARTED) {
            throw new IllegalStateException("Ride cannot be completed because it has not started.");
        }
        ride.setStatus(RideStatus.COMPLETED);
        log.info("Ride {} completed successfully.", rideId);
        return rideRepository.save(ride);
    }

    @Transactional
    public Ride cancelRide(UUID rideId) {
        Ride ride = getRideOrThrow(rideId);
        if (ride.getStatus() == RideStatus.COMPLETED || ride.getStatus() == RideStatus.CANCELLED) {
            throw new IllegalStateException("Ride is already finalized and cannot be cancelled.");
        }
        ride.setStatus(RideStatus.CANCELLED);
        log.info("Ride {} was cancelled.", rideId);
        return rideRepository.save(ride);
    }

    public Ride getRideDetails(UUID rideId) {
        return getRideOrThrow(rideId);
    }

    private Ride getRideOrThrow(UUID rideId) {
        return rideRepository.findById(rideId)
                .orElseThrow(() -> new EntityNotFoundException("Ride with ID " + rideId + " does not exist."));
    }
}
