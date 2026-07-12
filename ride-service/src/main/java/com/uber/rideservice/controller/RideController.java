package com.uber.rideservice.controller;

import com.uber.rideservice.dto.BookRideRequest;
import com.uber.rideservice.model.Ride;
import com.uber.rideservice.service.RideService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rides")
@RequiredArgsConstructor
@Slf4j
public class RideController {

    private final RideService rideService;

    @PostMapping
    public ResponseEntity<Ride> bookRide(@Valid @RequestBody BookRideRequest request) {
        log.info("REST request to book ride for passenger: {}", request.getPassengerId());
        Ride ride = rideService.createRide(request);
        return ResponseEntity.ok(ride);
    }

    @GetMapping("/{rideId}")
    public ResponseEntity<Ride> getRide(@PathVariable UUID rideId) {
        log.info("REST request to query details for ride: {}", rideId);
        Ride ride = rideService.getRideDetails(rideId);
        return ResponseEntity.ok(ride);
    }

    @PutMapping("/{rideId}/start")
    public ResponseEntity<Ride> startRide(@PathVariable UUID rideId) {
        log.info("REST request to start ride: {}", rideId);
        Ride ride = rideService.startRide(rideId);
        return ResponseEntity.ok(ride);
    }

    @PutMapping("/{rideId}/complete")
    public ResponseEntity<Ride> completeRide(@PathVariable UUID rideId) {
        log.info("REST request to complete ride: {}", rideId);
        Ride ride = rideService.completeRide(rideId);
        return ResponseEntity.ok(ride);
    }

    @PutMapping("/{rideId}/cancel")
    public ResponseEntity<Ride> cancelRide(@PathVariable UUID rideId) {
        log.info("REST request to cancel ride: {}", rideId);
        Ride ride = rideService.cancelRide(rideId);
        return ResponseEntity.ok(ride);
    }
}
