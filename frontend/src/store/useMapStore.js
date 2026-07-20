import { create } from 'zustand';

/**
 * useMapStore — owns ONLY draft map coordinates.
 * Used by: BookingForm, RiderMap
 * No API calls, no SSE, no event log.
 */
const useMapStore = create((set) => ({
  draftPickupLat: '28.6139',
  draftPickupLng: '77.2090',
  draftPickupAddress: 'Connaught Place, New Delhi, Delhi, 110001, India',
  
  draftDropLat:   '28.7041',
  draftDropLng:   '77.1025',
  draftDropAddress: 'Rohini, Sector 10, New Delhi, Delhi, 110085, India',

  setDraftPickup: (lat, lng, address = null) => set({
    draftPickupLat: parseFloat(lat).toFixed(4),
    draftPickupLng: parseFloat(lng).toFixed(4),
    draftPickupAddress: address || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`
  }),

  setDraftDrop: (lat, lng, address = null) => set({
    draftDropLat: parseFloat(lat).toFixed(4),
    draftDropLng: parseFloat(lng).toFixed(4),
    draftDropAddress: address || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`
  }),

  resetCoordinates: () => set({
    draftPickupLat: '28.6139',
    draftPickupLng: '77.2090',
    draftPickupAddress: 'Connaught Place, New Delhi, Delhi, 110001, India',
    draftDropLat:   '28.7041',
    draftDropLng:   '77.1025',
    draftDropAddress: 'Rohini, Sector 10, New Delhi, Delhi, 110085, India',
  }),
}));

export default useMapStore;
