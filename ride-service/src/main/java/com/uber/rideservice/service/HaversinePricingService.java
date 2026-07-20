package com.uber.rideservice.service;

import com.uber.common.util.GeoUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Calculates distance-based ride fare using the shared Haversine formula from GeoUtils.
 * Fare = (baseFare + distance * ratePerKm) * surgeMultiplier
 */
@Service
public class HaversinePricingService {

    @Value("${pricing.base-fare:2.50}")
    private double baseFare;

    @Value("${pricing.rate-per-km:1.20}")
    private double ratePerKm;

    public double calculateFare(double lat1, double lon1, double lat2, double lon2, double surgeMultiplier) {
        double distance = GeoUtils.distanceKm(lat1, lon1, lat2, lon2);
        double rawFare = baseFare + (distance * ratePerKm);
        return rawFare * surgeMultiplier;
    }
}
