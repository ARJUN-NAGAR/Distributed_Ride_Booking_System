package com.uber.rideservice.client;

import org.springframework.stereotype.Component;
import com.uber.common.dto.NearbyDriverResponse;
import java.util.Collections;
import java.util.List;

@Component
public class LocationServiceClientFallback implements LocationServiceClient {

    @Override
    public List<NearbyDriverResponse> getNearbyDrivers(double latitude, double longitude, double radius) {
        // Fallback returns empty driver list when service is down or circuit is open
        return Collections.emptyList();
    }
}
