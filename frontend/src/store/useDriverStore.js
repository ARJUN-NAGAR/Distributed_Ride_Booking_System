import { create } from 'zustand';
import axiosLocationClient from '../api/axiosLocationClient';
import toast from 'react-hot-toast';

const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.2090;
const MAX_DRIVERS = 5;

const useDriverStore = create((set, get) => ({
  drivers: [], // Array of driver objects: { id, lat, lng, targetLat, targetLng, intervalId, isOnline, isFlashing }
  
  // Form state for spawning a new driver
  spawnId: `driver_${Math.floor(Math.random() * 1000)}`,
  spawnLat: DEFAULT_LAT,
  spawnLng: DEFAULT_LNG,

  setSpawnId: (id) => set({ spawnId: id }),
  setSpawnLocation: (lat, lng) => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      set({ spawnLat: parsedLat, spawnLng: parsedLng });
    }
  },

  spawnDriver: () => {
    const { drivers, spawnId, spawnLat, spawnLng } = get();
    
    if (drivers.length >= MAX_DRIVERS) {
      toast.error(`Swarm limit reached (${MAX_DRIVERS} max). API Rate Limiter protection active.`);
      return;
    }
    
    if (!spawnId.trim()) {
      toast.error('Please enter a Driver ID');
      return;
    }
    
    if (drivers.some(d => d.id === spawnId)) {
      toast.error('Driver ID already exists in the swarm');
      return;
    }

    const newDriver = {
      id: spawnId,
      lat: spawnLat,
      lng: spawnLng,
      targetLat: spawnLat, // Used for interpolation
      targetLng: spawnLng,
      intervalId: null,
      isOnline: true,
      isFlashing: false,
    };

    set({ 
      drivers: [...drivers, newDriver],
      spawnId: `driver_${Math.floor(Math.random() * 1000)}` 
    });
    
    toast.success(`🟢 ${spawnId} joined the swarm at (${spawnLat.toFixed(4)}, ${spawnLng.toFixed(4)})`);
    get().startDriverTelemetry(spawnId);
  },

  removeDriver: (id) => {
    const driver = get().drivers.find(d => d.id === id);
    if (driver && driver.intervalId) {
      clearInterval(driver.intervalId);
    }
    set({ drivers: get().drivers.filter(d => d.id !== id) });
    toast('🔴 Driver removed from swarm', { icon: '🔴' });
  },

  startDriverTelemetry: (id) => {
    // Send initial position
    get().sendTelemetryForDriver(id);

    const intervalId = setInterval(() => {
      get().sendTelemetryForDriver(id);
    }, 3000);

    set(state => ({
      drivers: state.drivers.map(d => d.id === id ? { ...d, intervalId } : d)
    }));
  },

  sendTelemetryForDriver: async (id) => {
    const driver = get().drivers.find(d => d.id === id);
    if (!driver) return;

    // Simulate movement with small random offset (±~111m)
    // We update targetLat/targetLng. The React components will LERP towards these.
    const newLat = driver.lat + (Math.random() - 0.5) * 0.002;
    const newLng = driver.lng + (Math.random() - 0.5) * 0.002;

    try {
      await axiosLocationClient.post(
        `/api/v1/locations/drivers/${id}/telemetry`,
        { latitude: newLat, longitude: newLng }
      );
      
      set(state => ({
        drivers: state.drivers.map(d => {
          if (d.id === id) {
            // Move current lat/lng to old target, and set new target
            return {
              ...d,
              lat: d.targetLat,
              lng: d.targetLng,
              targetLat: newLat,
              targetLng: newLng,
              isFlashing: true
            };
          }
          return d;
        })
      }));

      setTimeout(() => {
        set(state => ({
          drivers: state.drivers.map(d => d.id === id ? { ...d, isFlashing: false } : d)
        }));
      }, 800);

    } catch (error) {
      // Error handled by interceptor
    }
  },

  clearSwarm: () => {
    get().drivers.forEach(d => {
      if (d.intervalId) clearInterval(d.intervalId);
    });
    set({ drivers: [] });
  }
}));

export default useDriverStore;
