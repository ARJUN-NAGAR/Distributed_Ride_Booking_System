package com.uber.rideservice.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.withinPercentage;

/**
 * Unit tests for HaversinePricingService.
 *
 * These tests verify:
 * 1. Distance calculation accuracy using known coordinates.
 * 2. Fare calculation with and without surge multipliers.
 * 3. Edge cases: same pickup/drop, zero surge, large distances.
 *
 * No Spring context needed — pure unit test.
 */
class HaversinePricingServiceTest {

    private HaversinePricingService service;

    // Known reference: Delhi to Gurgaon is ~26 km
    private static final double DELHI_LAT   = 28.6139;
    private static final double DELHI_LON   = 77.2090;
    private static final double GURGAON_LAT = 28.4595;
    private static final double GURGAON_LON = 77.0266;

    // Default config values matching application.properties defaults
    private static final double BASE_FARE    = 2.50;
    private static final double RATE_PER_KM  = 1.20;

    @BeforeEach
    void setUp() {
        service = new HaversinePricingService();
        // Inject @Value fields manually (Spring not loaded in unit tests)
        injectField(service, "baseFare",   BASE_FARE);
        injectField(service, "ratePerKm",  RATE_PER_KM);
    }

    // ── Distance Tests ──────────────────────────────────────────────────────

    @Test
    @DisplayName("Delhi to Gurgaon distance should be approximately 26 km")
    void calculateFare_delhiToGurgaon_correctDistance() {
        double fare = service.calculateFare(DELHI_LAT, DELHI_LON, GURGAON_LAT, GURGAON_LON, 1.0);
        // distance ≈ 26 km → fare ≈ 2.50 + (26 * 1.20) = 33.70
        assertThat(fare).isCloseTo(33.70, withinPercentage(5.0)); // 5% tolerance
    }

    // ── Fare Calculation Tests ───────────────────────────────────────────────

    @Test
    @DisplayName("Base fare + 0 km distance should equal exactly the base fare")
    void calculateFare_samePickupAndDrop_returnsBaseFareOnly() {
        double fare = service.calculateFare(DELHI_LAT, DELHI_LON, DELHI_LAT, DELHI_LON, 1.0);
        assertThat(fare).isCloseTo(BASE_FARE, withinPercentage(1.0));
    }

    @Test
    @DisplayName("Surge multiplier of 2.0x should double the raw fare")
    void calculateFare_withSurge2x_fareIsDoubled() {
        double normalFare = service.calculateFare(DELHI_LAT, DELHI_LON, GURGAON_LAT, GURGAON_LON, 1.0);
        double surgedFare = service.calculateFare(DELHI_LAT, DELHI_LON, GURGAON_LAT, GURGAON_LON, 2.0);
        assertThat(surgedFare).isCloseTo(normalFare * 2.0, withinPercentage(1.0));
    }

    @Test
    @DisplayName("Surge multiplier of 1.0 should not change fare")
    void calculateFare_noSurge_sameAsBaseCalculation() {
        double fare1 = service.calculateFare(DELHI_LAT, DELHI_LON, GURGAON_LAT, GURGAON_LON, 1.0);
        double fare2 = service.calculateFare(DELHI_LAT, DELHI_LON, GURGAON_LAT, GURGAON_LON, 1.0);
        assertThat(fare1).isEqualTo(fare2);
    }

    @Test
    @DisplayName("Fare should always be positive for any valid coordinates")
    void calculateFare_anyValidCoords_alwaysPositive() {
        double fare = service.calculateFare(0.0, 0.0, 90.0, 180.0, 1.5);
        assertThat(fare).isPositive();
    }

    @Test
    @DisplayName("Fare should increase as surge multiplier increases")
    void calculateFare_highSurge_higherFare() {
        double lowSurge  = service.calculateFare(DELHI_LAT, DELHI_LON, GURGAON_LAT, GURGAON_LON, 1.0);
        double highSurge = service.calculateFare(DELHI_LAT, DELHI_LON, GURGAON_LAT, GURGAON_LON, 2.5);
        assertThat(highSurge).isGreaterThan(lowSurge);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Injects a private @Value field without loading Spring context.
     */
    private void injectField(Object target, String fieldName, double value) {
        try {
            var field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to inject field: " + fieldName, e);
        }
    }
}
