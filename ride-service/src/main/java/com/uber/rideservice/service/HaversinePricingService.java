package com.uber.rideservice.service;

import org.springframework.stereotype.Service;

@Service
public class HaversinePricingService {
    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double BASE_FARE = 2.50;
    private static final double RATE_PER_KM = 1.20;

    public double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    public double calculateFare(double lat1, double lon1, double lat2, double lon2, double surgeMultiplier) {
        double distance = calculateDistanceKm(lat1, lon1, lat2, lon2);
        double rawFare = BASE_FARE + (distance * RATE_PER_KM);
        return rawFare * surgeMultiplier;
    }
}
