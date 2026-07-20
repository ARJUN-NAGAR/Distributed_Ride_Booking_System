import { create } from 'zustand';
import axiosRideClient from '../api/axiosRideClient';
import toast from 'react-hot-toast';
import { TERMINAL_STATES } from '../constants/rideStatuses';
import useSseStore from './useSseStore';

/**
 * useRideStore — owns ride lifecycle state and booking API actions.
 *
 * What it does NOT own (extracted to focused stores):
 *   - Map coordinates  → useMapStore
 *   - SSE connection   → useSseStore
 */
const useRideStore = create((set, get) => ({
  currentRide: null,
  isBooking: false,
  eventLog: [],

  // ─── Booking ─────────────────────────────────────────────────────────────

  bookRide: async (payload) => {
    set({ isBooking: true });
    try {
      const response = await axiosRideClient.post('/api/v1/rides', payload);
      const ride = response.data;
      set({ currentRide: ride, isBooking: false });
      get().addEventLog('ride.requested', { rideId: ride.id, status: ride.status });
      toast.success('🚗 Ride requested successfully!');

      // Delegate SSE connection to useSseStore
      useSseStore.getState().connect(ride.id, (updatedRide) => {
        const prevStatus = get().currentRide?.status;
        set({ currentRide: updatedRide });

        if (updatedRide.status !== prevStatus) {
          if (updatedRide.status === 'MATCHING') {
            toast('🔍 Matching with a driver...', { icon: '⚙️' });
            get().addEventLog('ride.matching', { rideId: ride.id, status: 'MATCHING' });
          } else if (updatedRide.status === 'ACCEPTED') {
            // Fake Driver Reviewing Delay (3.5s)
            set({ currentRide: { ...updatedRide, status: 'DRIVER_REVIEWING' } });
            toast('👀 Driver is reviewing your request...', { icon: '👀' });
            get().addEventLog('ride.reviewing', { rideId: ride.id, status: 'DRIVER_REVIEWING' });
            
            setTimeout(() => {
              set({ currentRide: updatedRide });
              toast.success('🙌 Driver accepted your ride!');
              get().addEventLog('ride.matched', { rideId: ride.id, driverId: updatedRide.driverId, status: 'ACCEPTED' });
            }, 3500);
          } else if (updatedRide.status === 'CANCELLED' || updatedRide.status === 'FAILED') {
            toast.error('⚠️ No driver found. Ride cancelled by system.');
            get().addEventLog('ride.matching-failed', { rideId: ride.id, status: updatedRide.status });
          } else if (updatedRide.status === 'RIDE_STARTED') {
            toast.success('🚀 Ride started!');
            get().addEventLog('ride.started', { rideId: ride.id, status: 'RIDE_STARTED' });
          } else if (updatedRide.status === 'COMPLETED') {
            toast.success('✅ Ride completed!');
            get().addEventLog('ride.completed', { rideId: ride.id, status: 'COMPLETED' });
          }
        }
      });

      return ride;
    } catch (err) {
      set({ isBooking: false });
      throw err;
    }
  },

  // ─── Ride Actions ─────────────────────────────────────────────────────────

  fetchRide: async (rideId) => {
    const response = await axiosRideClient.get(`/api/v1/rides/${rideId}`);
    return response.data;
  },

  startRide: async (rideId) => {
    const response = await axiosRideClient.put(`/api/v1/rides/${rideId}/start`);
    set({ currentRide: response.data });
    get().addEventLog('ride.started', { rideId, status: 'RIDE_STARTED' });
    toast.success('🚀 Ride started!');
  },

  completeRide: async (rideId) => {
    const response = await axiosRideClient.put(`/api/v1/rides/${rideId}/complete`);
    set({ currentRide: response.data });
    get().addEventLog('ride.completed', { rideId, status: 'COMPLETED' });
    toast.success('✅ Ride completed!');
    useSseStore.getState().disconnect();
  },

  cancelRide: async (rideId) => {
    const response = await axiosRideClient.put(`/api/v1/rides/${rideId}/cancel`);
    set({ currentRide: response.data });
    get().addEventLog('ride.cancelled', { rideId, status: 'CANCELLED' });
    toast.error('❌ Ride cancelled');
    useSseStore.getState().disconnect();
  },

  resetRide: () => {
    useSseStore.getState().disconnect();
    set({ currentRide: null, eventLog: [] });
  },

  // ─── Event Log ───────────────────────────────────────────────────────────

  addEventLog: (topic, data) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      topic,
      data,
    };
    set((state) => ({ eventLog: [entry, ...state.eventLog].slice(0, 50) }));
  },
}));

export default useRideStore;
