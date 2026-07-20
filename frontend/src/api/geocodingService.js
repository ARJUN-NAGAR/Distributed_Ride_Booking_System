const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export const geocodingService = {
  // Search address -> Lat/Lng (Forward Geocoding)
  searchAddress: async (query) => {
    if (!query || query.length < 3) return [];
    try {
      const res = await fetch(`${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in`, {
        headers: { 
          'User-Agent': 'DistributedRideMatchingSystem/1.0',
          'Accept-Language': 'en'
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.map(item => ({
          label: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        }));
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    }
    return [];
  },

  // Lat/Lng -> Address string (Reverse Geocoding)
  reverseGeocode: async (lat, lng) => {
    try {
      const res = await fetch(`${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 
          'User-Agent': 'DistributedRideMatchingSystem/1.0',
          'Accept-Language': 'en'
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.display_name;
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
    return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
  }
};
