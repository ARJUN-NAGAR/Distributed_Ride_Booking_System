const config = require('./config');

/**
 * Generates a random coordinate near a given landmark with Gaussian-like spread.
 * @param {Object} landmark - { lat, lng } center point
 * @param {number} spreadKm - Approximate spread in km (default 2km)
 * @returns {{ lat: number, lng: number }}
 */
function nearLandmark(landmark, spreadKm = 2.0) {
  // ~0.009 degrees ≈ 1km at Delhi's latitude
  const spreadDeg = spreadKm * 0.009;
  // Box-Muller transform for Gaussian distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
  
  return {
    lat: landmark.lat + z0 * spreadDeg,
    lng: landmark.lng + z1 * spreadDeg
  };
}

/**
 * Generates a random pickup-drop coordinate pair within Delhi.
 * Pickup is near a random landmark; drop is 2-8km away.
 */
function generateRideCoordinates() {
  const landmarks = config.DELHI_LANDMARKS;
  const pickupLandmark = landmarks[Math.floor(Math.random() * landmarks.length)];
  const dropLandmark = landmarks[Math.floor(Math.random() * landmarks.length)];
  
  const pickup = nearLandmark(pickupLandmark, 1.5);
  const drop = nearLandmark(dropLandmark, 2.0);
  
  return {
    pickupLatitude: parseFloat(pickup.lat.toFixed(6)),
    pickupLongitude: parseFloat(pickup.lng.toFixed(6)),
    dropLatitude: parseFloat(drop.lat.toFixed(6)),
    dropLongitude: parseFloat(drop.lng.toFixed(6)),
    pickupAddress: pickupLandmark.name,
    dropAddress: dropLandmark.name
  };
}

/**
 * Generates a random driver position within Delhi bounds.
 */
function generateDriverPosition() {
  const landmark = config.DELHI_LANDMARKS[Math.floor(Math.random() * config.DELHI_LANDMARKS.length)];
  return nearLandmark(landmark, 3.0);
}

module.exports = { nearLandmark, generateRideCoordinates, generateDriverPosition };
