import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
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

const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const DriverMap = () => {
  const { currentLat, currentLng, driverId, isOnline, isFlashing } = useDriverStore();

  return (
      <div className={`map-container ${isFlashing ? 'flash' : ''}`} style={{ height: 320 }}>
        <MapContainer
            center={[currentLat, currentLng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
        >
          <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {isOnline && (
              <Marker position={[currentLat, currentLng]} icon={driverIcon}>
                <Popup>🚗 {driverId} (Live)</Popup>
              </Marker>
          )}
          <RecenterMap lat={currentLat} lng={currentLng} />
        </MapContainer>
      </div>
  );
};

export default DriverMap;