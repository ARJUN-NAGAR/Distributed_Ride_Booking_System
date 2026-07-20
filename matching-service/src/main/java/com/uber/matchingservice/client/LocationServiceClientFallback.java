package com.uber.matchingservice.client;

import com.uber.common.dto.NearbyDriverResponse;
import com.uber.common.util.GeoUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Circuit breaker fallback for LocationServiceClient.
 * Serves last-known driver positions when the location-service is unavailable.
 *
 * NOTE: This cache is JVM-local and resets on restart.
 * It is a best-effort fallback, not a replacement for the live service.
 */
@Component
@Slf4j
public class LocationServiceClientFallback implements LocationServiceClient {

    // Thread-safe cache of last-known driver locations (injected as Spring bean — no static methods)
    private final Map<String, NearbyDriverResponse> driverCache = new ConcurrentHashMap<>();

    /**
     * Called by MatchingEngine after every successful location-service call to keep the cache warm.
     */
    public void updateCache(List<NearbyDriverResponse> drivers) {
        if (drivers != null && !drivers.isEmpty()) {
            for (NearbyDriverResponse driver : drivers) {
                driverCache.put(driver.getDriverId(), driver);
            }
            log.debug("Fallback cache refreshed with {} driver entries.", drivers.size());
        }
    }

    @Override
    public List<NearbyDriverResponse> getNearbyDrivers(double latitude, double longitude, double radius) {
        log.warn("Location Service is unavailable. Querying backup registry of last-known driver positions.");
        if (driverCache.isEmpty()) {
            log.error("Fallback registry is empty. Cannot pair any drivers.");
            return Collections.emptyList();
        }

        List<NearbyDriverResponse> results = new ArrayList<>();
        for (NearbyDriverResponse cachedDriver : driverCache.values()) {
            double dist = GeoUtils.distanceKm(latitude, longitude,
                    cachedDriver.getLatitude(), cachedDriver.getLongitude());
            if (dist <= radius) {
                NearbyDriverResponse clone = NearbyDriverResponse.builder()
                        .driverId(cachedDriver.getDriverId())
                        .latitude(cachedDriver.getLatitude())
                        .longitude(cachedDriver.getLongitude())
                        .distanceKm(dist)
                        .rating(cachedDriver.getRating())
                        .build();
                results.add(clone);
            }
        }

        log.info("Fallback recovered {} last-known candidate drivers within {} km", results.size(), radius);
        return results;
    }
}
