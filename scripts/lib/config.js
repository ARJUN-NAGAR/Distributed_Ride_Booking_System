// Shared configuration for all simulation scripts
module.exports = {
  GATEWAY_HOST: process.env.GATEWAY_HOST || 'localhost',
  GATEWAY_PORT: parseInt(process.env.GATEWAY_PORT || '8080'),
  LOCATION_PORT: parseInt(process.env.LOCATION_PORT || '8082'),
  RIDE_PORT: parseInt(process.env.RIDE_PORT || '8083'),
  
  // Delhi operating region bounding box
  DELHI_BOUNDS: {
    MIN_LAT: 28.40, MAX_LAT: 28.88,
    MIN_LNG: 76.84, MAX_LNG: 77.50
  },
  
  // Preset Delhi landmarks for realistic coordinate distribution
  DELHI_LANDMARKS: [
    { name: 'Connaught Place',       lat: 28.6315, lng: 77.2167 },
    { name: 'India Gate',            lat: 28.6129, lng: 77.2295 },
    { name: 'Karol Bagh',            lat: 28.6519, lng: 77.1909 },
    { name: 'Lajpat Nagar',          lat: 28.5677, lng: 77.2434 },
    { name: 'Saket',                 lat: 28.5244, lng: 77.2065 },
    { name: 'Dwarka',                lat: 28.5823, lng: 77.0500 },
    { name: 'Rohini',                lat: 28.7041, lng: 77.1025 },
    { name: 'Noida Sector 18',       lat: 28.5672, lng: 77.3211 },
    { name: 'Gurgaon Cyber City',    lat: 28.4947, lng: 77.0888 },
    { name: 'Chandni Chowk',         lat: 28.6505, lng: 77.2303 },
    { name: 'Hauz Khas',             lat: 28.5494, lng: 77.2001 },
    { name: 'Nehru Place',           lat: 28.5489, lng: 77.2533 },
    { name: 'Rajouri Garden',        lat: 28.6468, lng: 77.1217 },
    { name: 'Pitampura',             lat: 28.6981, lng: 77.1310 },
    { name: 'Vasant Kunj',           lat: 28.5170, lng: 77.1570 },
    { name: 'Greater Kailash',       lat: 28.5406, lng: 77.2350 },
    { name: 'Janakpuri',             lat: 28.6264, lng: 77.0816 },
    { name: 'Mayur Vihar',           lat: 28.5930, lng: 77.2972 },
    { name: 'Preet Vihar',           lat: 28.6380, lng: 77.2920 },
    { name: 'IGI Airport T3',        lat: 28.5562, lng: 77.1000 }
  ],
  
  // HTTP agent config for high-concurrency
  HTTP_AGENT_CONFIG: {
    keepAlive: true,
    maxSockets: 500,
    keepAliveMsecs: 1000
  }
};
