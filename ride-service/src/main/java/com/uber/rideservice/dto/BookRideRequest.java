package com.uber.rideservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookRideRequest {
    @NotBlank(message = "Passenger ID is required")
    private String passengerId;

    @NotNull(message = "Pickup Latitude is required")
    @Min(value = -90, message = "Latitude must be >= -90")
    @Max(value = 90, message = "Latitude must be <= 90")
    private Double pickupLatitude;

    @NotNull(message = "Pickup Longitude is required")
    @Min(value = -180, message = "Longitude must be >= -180")
    @Max(value = 90, message = "Longitude must be <= 180")
    private Double pickupLongitude;

    @NotNull(message = "Drop Latitude is required")
    @Min(value = -90, message = "Latitude must be >= -90")
    @Max(value = 90, message = "Latitude must be <= 90")
    private Double dropLatitude;

    @NotNull(message = "Drop Longitude is required")
    @Min(value = -180, message = "Longitude must be >= -180")
    @Max(value = 90, message = "Longitude must be <= 180")
    private Double dropLongitude;

    private String pickupAddress;
    private String dropAddress;
}
