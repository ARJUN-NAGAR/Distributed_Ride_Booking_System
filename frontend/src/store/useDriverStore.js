import { create } from 'zustand';
import axiosLocationClient from '../api/axiosLocationClient';
import toast from 'react-hot-toast';

const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.2090;

const useDriverStore = create((set, get) => ({
  driverId: 'driver_101',
  isOnline: false,
  currentLat: DEFAULT_LAT,
  currentLng: DEFAULT_LNG,
  rating: 4.7,
  telemetryIntervalId: null,
  updateCount: 0,
  lastUpdated: null,
  isFlashing: false,

  setDriverId: (id) => set({ driverId: id }),

  goOnline: () => {
    const { driverId } = get();
    if (!driverId.trim()) {
      toast.error('Please enter a Driver ID');
      return;
    }
    set({ isOnline: true });
    toast.success(`🟢 ${driverId} is now Online`);
    get().startTelemetry();
  },

  goOffline: () => {
    get().stopTelemetry();
    set({ isOnline: false });
    toast('🔴 Driver went Offline', { icon: '🔴' });
  },

  startTelemetry: () => {
    get().stopTelemetry();
    // Send initial position immediately
    get().sendTelemetry();

    const intervalId = setInterval(() => {
      get().sendTelemetry();
    }, 3000);

    set({ telemetryIntervalId: intervalId });
  },

  sendTelemetry: async () => {
    const { driverId, currentLat, currentLng } = get();

    // Simulate movement with small random offset
    const newLat = currentLat + (Math.random() - 0.5) * 0.002;
    const newLng = currentLng + (Math.random() - 0.5) * 0.002;

    try {
      await axiosLocationClient.post(
        `/api/v1/locations/drivers/${driverId}/telemetry`,
        { latitude: newLat, longitude: newLng }
      );
      set((state) => ({
        currentLat: newLat,
        currentLng: newLng,
        updateCount: state.updateCount + 1,
        lastUpdated: new Date().toISOString(),
        isFlashing: true,
      }));

      // Remove flash after 800ms
      setTimeout(() => set({ isFlashing: false }), 800);
    } catch {
      // Error toast handled by interceptor
    }
  },

  stopTelemetry: () => {
    const { telemetryIntervalId } = get();
    if (telemetryIntervalId) {
      clearInterval(telemetryIntervalId);
      set({ telemetryIntervalId: null });
    }
  },

  reset: () => {
    get().stopTelemetry();
    set({
      isOnline: false,
      currentLat: DEFAULT_LAT,
      currentLng: DEFAULT_LNG,
      updateCount: 0,
      lastUpdated: null,
      isFlashing: false,
    });
  },
}));

export default useDriverStore;
