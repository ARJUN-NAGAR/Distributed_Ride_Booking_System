package com.uber.locationservice.controller;

import com.uber.locationservice.dto.DriverTelemetryRequest;
import com.uber.common.dto.NearbyDriverResponse;
import com.uber.locationservice.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/locations")
@RequiredArgsConstructor
@Slf4j
public class LocationController {

    private final LocationService locationService;

    @PostMapping("/drivers/{driverId}/telemetry")
    public ResponseEntity<String> updateLocation(
            @PathVariable String driverId,
            @Valid @RequestBody DriverTelemetryRequest request) {
        log.info("Received telemetry for driver {}: ({}, {})", driverId, request.getLatitude(), request.getLongitude());
        locationService.updateDriverLocation(driverId, request.getLatitude(), request.getLongitude());
        return ResponseEntity.ok("Telemetry grid updated successfully.");
    }

    @GetMapping("/drivers/nearby")
    public ResponseEntity<List<NearbyDriverResponse>> getNearbyDrivers(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "5.0") double radius) {
        log.info("Fetching nearby drivers near ({}, {}) in radius {} km", latitude, longitude, radius);
        List<NearbyDriverResponse> drivers = locationService.findCandidateDrivers(latitude, longitude, radius);
        return ResponseEntity.ok(drivers);
    }
}
