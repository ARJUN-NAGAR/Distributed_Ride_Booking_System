import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useDriverStore from '../../store/useDriverStore';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Imperative Marker Manager to avoid React re-renders for 60fps animations
const MarkerManager = () => {
  const map = useMap();
  const markersRef = useRef({});
  const rafRef = useRef();

  useEffect(() => {
    // We subscribe to the store OUTSIDE the React render cycle to prevent UI freezing
    const unsubscribe = useDriverStore.subscribe((state) => {
      const drivers = state.drivers;
      const currentIds = new Set(drivers.map(d => d.id));

      // Remove markers that are no longer in state
      Object.keys(markersRef.current).forEach(id => {
        if (!currentIds.has(id)) {
          map.removeLayer(markersRef.current[id].marker);
          delete markersRef.current[id];
        }
      });

      // Add or update targets for existing markers
      drivers.forEach(driver => {
        if (!markersRef.current[driver.id]) {
          // New driver spawned
          const newMarker = L.marker([driver.lat, driver.lng], { icon: driverIcon }).addTo(map);
          newMarker.bindPopup(`🚗 ${driver.id} (Live)`);
          
          markersRef.current[driver.id] = {
            marker: newMarker,
            currentLat: driver.lat,
            currentLng: driver.lng,
            targetLat: driver.targetLat,
            targetLng: driver.targetLng
          };

          // Recenter map on the newly spawned driver
          map.setView([driver.lat, driver.lng], map.getZoom());
        } else {
          // Update targets for interpolation
          markersRef.current[driver.id].targetLat = driver.targetLat;
          markersRef.current[driver.id].targetLng = driver.targetLng;
        }
      });
    });

    return () => unsubscribe();
  }, [map]);

  // 60FPS Animation Loop (LERP)
  useEffect(() => {
    const LERP_FACTOR = 0.05; // Smoothing factor

    const animate = () => {
      Object.values(markersRef.current).forEach(data => {
        // LERP formula: current = current + (target - current) * factor
        const diffLat = data.targetLat - data.currentLat;
        const diffLng = data.targetLng - data.currentLng;

        // If distance is significant, animate towards it
        if (Math.abs(diffLat) > 0.00001 || Math.abs(diffLng) > 0.00001) {
          data.currentLat += diffLat * LERP_FACTOR;
          data.currentLng += diffLng * LERP_FACTOR;
          data.marker.setLatLng([data.currentLat, data.currentLng]);
        }
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return null;
};

const DriverMap = () => {
  return (
      <div className="map-container" style={{ height: 320 }}>
        <MapContainer
            center={[28.6139, 77.2090]} // Default start
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
        >
          <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MarkerManager />
        </MapContainer>
      </div>
  );
};

export default DriverMap;