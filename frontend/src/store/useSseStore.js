import { create } from 'zustand';
import toast from 'react-hot-toast';
import { TERMINAL_STATES } from '../constants/rideStatuses';
import axiosRideClient from '../api/axiosRideClient';

/**
 * useSseStore — owns ONLY the SSE/EventSource connection lifecycle.
 * Used by: useRideStore (to start/stop live updates after booking)
 * Isolated so SSE logic changes never risk breaking map or booking state.
 */
const useSseStore = create((set, get) => ({
  eventSource: null,
  unloadListener: null,

  /**
   * Opens an SSE connection for a given rideId.
   * onStatusUpdate(ride) — called whenever a STATUS_UPDATE event arrives.
   */
  connect: (rideId, onStatusUpdate) => {
    get().disconnect(); // Close any existing connection first

    const token = localStorage.getItem('jwt_token');
    const baseUrl = import.meta.env.VITE_RIDE_SERVICE_URL || 'http://localhost:8083';
    const sseUrl = `${baseUrl}/api/v1/rides/${rideId}/stream?token=${encodeURIComponent(token || '')}`;

    const es = new EventSource(sseUrl);

    es.addEventListener('STATUS_UPDATE', (event) => {
      try {
        const ride = JSON.parse(event.data);
        onStatusUpdate(ride);
        if (TERMINAL_STATES.includes(ride.status)) {
          get().disconnect();
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    });

    es.onerror = (err) => {
      console.error('SSE connection error:', err);
      get().disconnect();
    };

    // Bulletproof cleanup: Close connection on browser refresh/close
    const handleUnload = () => get().disconnect();
    window.addEventListener('beforeunload', handleUnload);

    set({ eventSource: es, unloadListener: handleUnload });
  },

  disconnect: () => {
    const { eventSource, unloadListener } = get();
    if (eventSource) {
      eventSource.close();
    }
    if (unloadListener) {
      window.removeEventListener('beforeunload', unloadListener);
    }
    set({ eventSource: null, unloadListener: null });
  },
}));

export default useSseStore;
