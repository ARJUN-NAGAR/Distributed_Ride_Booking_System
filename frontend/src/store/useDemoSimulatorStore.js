import { create } from 'zustand';
import axiosLocationClient from '../api/axiosLocationClient';
import axiosRideClient from '../api/axiosRideClient';
import toast from 'react-hot-toast';
import { TERMINAL_STATES } from '../constants/rideStatuses';
import useRideStore from './useRideStore';

const CENTER_LAT = 28.6139;
const CENTER_LNG = 77.2090;

const DEFAULT_SIM_DRIVERS = [
  { id: 'sim_driver_1', lat: 28.6110, lng: 77.2010 },
  { id: 'sim_driver_2', lat: 28.6210, lng: 77.2150 },
  { id: 'sim_driver_3', lat: 28.6050, lng: 77.2200 },
  { id: 'sim_driver_4', lat: 28.6250, lng: 77.1950 },
  { id: 'sim_driver_5', lat: 28.6150, lng: 77.2050 },
];

const DEFAULT_SIM_RIDES = [
  { passengerId: 'sim_passenger_1', pickup: [28.6120, 77.2020], drop: [28.6300, 77.2200], pickupAddress: 'Connaught Place', dropAddress: 'New Delhi Railway Station' },
  { passengerId: 'sim_passenger_2', pickup: [28.6220, 77.2140], drop: [28.6400, 77.2300], pickupAddress: 'Barakhamba Road', dropAddress: 'Karol Bagh' },
  { passengerId: 'sim_passenger_3', pickup: [28.6060, 77.2190], drop: [28.5800, 77.2000], pickupAddress: 'India Gate', dropAddress: 'Lodhi Gardens' },
  { passengerId: 'sim_passenger_4', pickup: [28.6240, 77.1960], drop: [28.6000, 77.1800], pickupAddress: 'Ramakrishna Ashram Marg', dropAddress: 'Rajendra Place' },
  { passengerId: 'sim_passenger_5', pickup: [28.6160, 77.2060], drop: [28.6500, 77.2100], pickupAddress: 'Janpath', dropAddress: 'Chandni Chowk' },
];

const useDemoSimulatorStore = create((set, get) => ({
  isDriverSimulating: false,
  isRiderSimulating: false,
  isDdosSimulating: false,
  ddosBlockedCount: 0,
  ddosSuccessCount: 0,
  simulatedDrivers: [],
  simulatedRides: [],
  eventSources: {},
  unloadListener: null,
  intervalId: null,

  startDriverSimulation: (count = 5) => {
    if (get().isDriverSimulating) return;

    // Initialize driver locations
    const drivers = [];
    for (let i = 0; i < count; i++) {
        // Use tightly coupled default locations for small tests to guarantee matches within 3km radius
        let pLat = CENTER_LAT + (Math.random() - 0.5) * 0.1;
        let pLng = CENTER_LNG + (Math.random() - 0.5) * 0.1;
        
        if (i < DEFAULT_SIM_DRIVERS.length && count <= 5) {
            pLat = DEFAULT_SIM_DRIVERS[i].lat;
            pLng = DEFAULT_SIM_DRIVERS[i].lng;
        }

        drivers.push({
            id: `sim_driver_${i + 1}`,
            latitude: pLat,
            longitude: pLng,
            lastUpdated: new Date().toISOString()
        });
    }

    set({
      isDriverSimulating: true,
      simulatedDrivers: drivers
    });

    toast.success(`🚀 Swarm simulation: ${count} drivers online!`);

    // Trigger initial burst
    get().broadcastDriversTelemetry();

    // Set interval for updates every 3 seconds
    const intervalId = setInterval(() => {
      get().broadcastDriversTelemetry();
    }, 3000);

    set({ intervalId });
  },

  broadcastDriversTelemetry: async () => {
    const { simulatedDrivers } = get();
    const updatedDrivers = simulatedDrivers.map(driver => {
      // Simulate minor movement drift
      const driftLat = (Math.random() - 0.5) * 0.0006;
      const driftLng = (Math.random() - 0.5) * 0.0006;
      return {
        ...driver,
        latitude: driver.latitude + driftLat,
        longitude: driver.longitude + driftLng,
        lastUpdated: new Date().toISOString()
      };
    });

    set({ simulatedDrivers: updatedDrivers });

    // Send HTTP POST requests to location-service in batches to prevent browser lockup
    const BATCH_SIZE = 100;
    for (let i = 0; i < updatedDrivers.length; i += BATCH_SIZE) {
        const batch = updatedDrivers.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (driver) => {
            try {
              await axiosLocationClient.post(`/api/v1/locations/drivers/${driver.id}/telemetry`, {
                latitude: driver.latitude,
                longitude: driver.longitude
              });
            } catch (err) {
              console.error(`Failed to post telemetry for ${driver.id}:`, err);
            }
          })
        );
        // Small yield
        await new Promise(res => setTimeout(res, 50));
    }
  },

  stopDriverSimulation: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
    }
    set({
      isDriverSimulating: false,
      simulatedDrivers: [],
      intervalId: null
    });
    toast('🔴 Swarm simulation: drivers offline', { icon: '🔴' });
  },

  bookSimulatedRides: async (count = 10000) => {
    if (get().isRiderSimulating) return;
    set({ isRiderSimulating: true, simulatedRides: [] });

    toast(`Booking ${count} concurrent rides (batched)...`, { icon: '🚗' });

    // Clear previous event sources
    get().disconnectAllRideStreams();

    const BATCH_SIZE = 200;
    const DELAY_MS = 500;
    
    // Helper function to delay
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    let processed = 0;

    for (let i = 0; i < count; i += BATCH_SIZE) {
      const batch = [];
      for (let j = 0; j < BATCH_SIZE && (i + j) < count; j++) {
        const index = i + j;
        
        let pLat = CENTER_LAT + (Math.random() - 0.5) * 0.1;
        let pLng = CENTER_LNG + (Math.random() - 0.5) * 0.1;
        let dLat = CENTER_LAT + (Math.random() - 0.5) * 0.1;
        let dLng = CENTER_LNG + (Math.random() - 0.5) * 0.1;
        let pAddress = `Pickup ${index + 1}`;
        let dAddress = `Drop ${index + 1}`;

        // Use tightly coupled default locations for small tests to guarantee matches within 3km radius
        if (index < DEFAULT_SIM_RIDES.length && count <= 5) {
            pLat = DEFAULT_SIM_RIDES[index].pickup[0];
            pLng = DEFAULT_SIM_RIDES[index].pickup[1];
            dLat = DEFAULT_SIM_RIDES[index].drop[0];
            dLng = DEFAULT_SIM_RIDES[index].drop[1];
            pAddress = DEFAULT_SIM_RIDES[index].pickupAddress;
            dAddress = DEFAULT_SIM_RIDES[index].dropAddress;
        }
        
        batch.push({
          passengerId: `sim_passenger_${index + 1}`,
          pickupLatitude: pLat,
          pickupLongitude: pLng,
          dropLatitude: dLat,
          dropLongitude: dLng,
          pickupAddress: pAddress,
          dropAddress: dAddress
        });
      }

      await Promise.all(
        batch.map(async (payload, idxInBatch) => {
          try {
            const response = await axiosRideClient.post('/api/v1/rides', payload);
            const ride = response.data;

            // Propagate initial request to event log
            useRideStore.getState().addEventLog('ride.requested', { rideId: ride.id, passengerId: ride.passengerId, status: ride.status });

            // Add to tracked simulated rides
            set(state => ({
              simulatedRides: [...state.simulatedRides, {
                id: ride.id,
                passengerId: ride.passengerId,
                pickupLat: ride.pickupLatitude,
                pickupLng: ride.pickupLongitude,
                dropLat: ride.dropLatitude,
                dropLng: ride.dropLongitude,
                pickupAddress: ride.pickupAddress,
                dropAddress: ride.dropAddress,
                status: ride.status,
                driverId: ride.driverId
              }]
            }));

            // Subscribe to updates for this ride, ONLY for the first 10 to avoid browser crash
            if (i + idxInBatch < 10) {
              get().connectRideStream(ride.id);
            }
          } catch (err) {
            console.error(`Failed to book ride for ${payload.passengerId}:`, err);
          }
        })
      );
      
      processed += batch.length;
      if (processed % 1000 === 0) {
          toast(`Processed ${processed} / ${count} rides...`, { icon: '⏳' });
      }
      
      if (processed < count) {
          await delay(DELAY_MS);
      }
    }
    toast.success(`Successfully dispatched ${count} ride requests!`);
  },

  connectRideStream: (rideId) => {
    const token = localStorage.getItem('jwt_token');
    const baseUrl = import.meta.env.VITE_RIDE_SERVICE_URL || 'http://localhost:8083';
    const sseUrl = `${baseUrl}/api/v1/rides/${rideId}/stream?token=${encodeURIComponent(token || '')}`;

    const es = new EventSource(sseUrl);

    es.addEventListener('STATUS_UPDATE', (event) => {
      try {
        const updatedRide = JSON.parse(event.data);
        
        // Find existing to compare status change
        const currentSimRides = get().simulatedRides;
        const oldRide = currentSimRides.find(r => r.id === rideId);
        
        // Update local simulated ride status
        set(state => ({
          simulatedRides: state.simulatedRides.map(r => 
            r.id === rideId 
              ? { ...r, status: updatedRide.status, driverId: updatedRide.driverId } 
              : r
          )
        }));

        if (!oldRide || oldRide.status !== updatedRide.status) {
          if (updatedRide.status === 'MATCHING') {
            useRideStore.getState().addEventLog('ride.matching', { rideId, status: 'MATCHING' });
          } else if (updatedRide.status === 'ACCEPTED') {
            useRideStore.getState().addEventLog('ride.matched', { rideId, driverId: updatedRide.driverId, status: 'ACCEPTED' });
          } else if (updatedRide.status === 'CANCELLED' || updatedRide.status === 'FAILED') {
            useRideStore.getState().addEventLog('ride.matching-failed', { rideId, status: updatedRide.status });
          } else if (updatedRide.status === 'RIDE_STARTED') {
            useRideStore.getState().addEventLog('ride.started', { rideId, status: 'RIDE_STARTED' });
          } else if (updatedRide.status === 'COMPLETED') {
            useRideStore.getState().addEventLog('ride.completed', { rideId, status: 'COMPLETED' });
          }
        }

        if (TERMINAL_STATES.includes(updatedRide.status)) {
          es.close();
        }
      } catch (err) {
        console.error('Failed to parse SSE simulated update:', err);
      }
    });

    es.onerror = () => {
      es.close();
    };

    // Ensure cleanup on unload
    if (!get().unloadListener) {
      const handleUnload = () => get().disconnectAllRideStreams();
      window.addEventListener('beforeunload', handleUnload);
      set({ unloadListener: handleUnload });
    }

    set(state => ({
      eventSources: { ...state.eventSources, [rideId]: es }
    }));
  },

  disconnectAllRideStreams: () => {
    const { eventSources, unloadListener } = get();
    Object.values(eventSources).forEach(es => {
      if (es) es.close();
    });
    if (unloadListener) {
      window.removeEventListener('beforeunload', unloadListener);
    }
    set({ eventSources: {}, isRiderSimulating: false, simulatedRides: [], unloadListener: null });
  },

  runDdosTelemetryBurst: async () => {
    set({ isDdosSimulating: true, ddosBlockedCount: 0, ddosSuccessCount: 0 });
    toast('⚡ Triggering high-volume telemetry burst (DDoS Simulation)...', { icon: '⚡' });
    
    const ddosId = 'ddos_attacker_';
    let blocked = 0;
    let success = 0;
    const promises = [];

    // Broadcast 80 parallel telemetry updates in a single tick to hit the rate limit filter
    for (let i = 1; i <= 80; i++) {
      promises.push(
        axiosLocationClient.post(`/api/v1/locations/drivers/${ddosId}${i}/telemetry`, {
          latitude: CENTER_LAT,
          longitude: CENTER_LNG
        }, {
          headers: {
            'X-DDoS-Test': 'true'
          }
        })
        .then(() => {
          success++;
          set({ ddosSuccessCount: success });
        })
        .catch((err) => {
          blocked++;
          set({ ddosBlockedCount: blocked });
        })
      );
    }

    await Promise.all(promises);
    set({ isDdosSimulating: false });
    
    if (blocked > 0) {
      toast.success(`⚡ Rate limiting engaged! Blocked ${blocked} / 80 requests (HTTP 429).`);
    } else {
      toast.error('Telemetry burst finished, but no requests were blocked. Verify rate limits.');
    }
  }
}));

export default useDemoSimulatorStore;
