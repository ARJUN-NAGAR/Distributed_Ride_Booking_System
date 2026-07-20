package com.uber.rideservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.uber.common.dto.NearbyDriverResponse;

import java.util.List;

@FeignClient(name = "location-service", url = "${services.location-service.url:http://localhost:8082}", fallback = LocationServiceClientFallback.class)
public interface LocationServiceClient {

    @GetMapping("/api/v1/locations/drivers/nearby")
    List<NearbyDriverResponse> getNearbyDrivers(
            @RequestParam("latitude") double latitude,
            @RequestParam("longitude") double longitude,
            @RequestParam("radius") double radius
    );
}
