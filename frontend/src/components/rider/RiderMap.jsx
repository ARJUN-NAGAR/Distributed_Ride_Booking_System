import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useRideStore from '../../store/useRideStore';
import useMapStore from '../../store/useMapStore';
import { geocodingService } from '../../api/geocodingService';

// Fix leaflet default icon paths broken by Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const dropIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
};

const MapEventsHandler = ({ mode, onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const DraggableMarker = ({ position, icon, label, onDragEnd }) => {
  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          onDragEnd(latLng.lat, latLng.lng);
        }
      },
    }),
    [onDragEnd]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={icon}
    >
      <Popup>{label}</Popup>
    </Marker>
  );
};

const RiderMap = () => {
  const { currentRide } = useRideStore();
  const {
    draftPickupLat,
    draftPickupLng,
    draftPickupAddress,
    draftDropLat,
    draftDropLng,
    draftDropAddress,
    setDraftPickup,
    setDraftDrop
  } = useMapStore();

  const [activeMode, setActiveMode] = useState('pickup'); // 'pickup' or 'drop'
  const defaultCenter = [28.6139, 77.209];

  const pickup = currentRide
      ? [currentRide.pickupLatitude, currentRide.pickupLongitude]
      : [parseFloat(draftPickupLat), parseFloat(draftPickupLng)];
  const drop = currentRide
      ? [currentRide.dropLatitude, currentRide.dropLongitude]
      : [parseFloat(draftDropLat), parseFloat(draftDropLng)];

  const positions = [pickup, drop].filter(
    (pos) => pos && !isNaN(pos[0]) && !isNaN(pos[1])
  );

  const handleMapClick = async (lat, lng) => {
    if (currentRide) return; // Disable selection during active ride
    if (activeMode === 'pickup') {
      setDraftPickup(lat, lng, 'Resolving address...');
      const address = await geocodingService.reverseGeocode(lat, lng);
      setDraftPickup(lat, lng, address);
    } else {
      setDraftDrop(lat, lng, 'Resolving address...');
      const address = await geocodingService.reverseGeocode(lat, lng);
      setDraftDrop(lat, lng, address);
    }
  };

  const handlePickupDrag = async (lat, lng) => {
    setDraftPickup(lat, lng, 'Resolving address...');
    const address = await geocodingService.reverseGeocode(lat, lng);
    setDraftPickup(lat, lng, address);
  };

  const handleDropDrag = async (lat, lng) => {
    setDraftDrop(lat, lng, 'Resolving address...');
    const address = await geocodingService.reverseGeocode(lat, lng);
    setDraftDrop(lat, lng, address);
  };

  return (
      <div className="map-container-wrapper" style={{ position: 'relative' }}>
        {!currentRide && (
          <div 
            className="map-control-overlay" 
            style={{ 
              position: 'absolute', 
              top: 12, 
              right: 12, 
              zIndex: 1000, 
              display: 'flex', 
              gap: 8,
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '6px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <button 
              onClick={() => setActiveMode('pickup')} 
              className={`btn btn-xs ${activeMode === 'pickup' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              📍 Set Pickup
            </button>
            <button 
              onClick={() => setActiveMode('drop')} 
              className={`btn btn-xs ${activeMode === 'drop' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              🏁 Set Dropoff
            </button>
          </div>
        )}

        <div className="map-container" style={{ height: 320, borderRadius: '12px', overflow: 'hidden' }}>
          <MapContainer
              center={pickup || defaultCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
          >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {!currentRide ? (
              <>
                <MapEventsHandler mode={activeMode} onMapClick={handleMapClick} />
                {pickup && !isNaN(pickup[0]) && (
                  <DraggableMarker 
                    position={pickup} 
                    icon={pickupIcon} 
                    label={draftPickupAddress ? `📍 Pickup: ${draftPickupAddress}` : "📍 Drag to adjust Pickup"} 
                    onDragEnd={handlePickupDrag} 
                  />
                )}
                {drop && !isNaN(drop[0]) && (
                  <DraggableMarker 
                    position={drop} 
                    icon={dropIcon} 
                    label={draftDropAddress ? `🏁 Destination: ${draftDropAddress}` : "🏁 Drag to adjust Dropoff"} 
                    onDragEnd={handleDropDrag} 
                  />
                )}
              </>
            ) : (
              <>
                {pickup && (
                  <Marker position={pickup} icon={pickupIcon}>
                    <Popup>📍 Pickup Location</Popup>
                  </Marker>
                )}
                {drop && (
                  <Marker position={drop} icon={dropIcon}>
                    <Popup>🏁 Drop Location</Popup>
                  </Marker>
                )}
              </>
            )}

            {positions.length >= 2 && <FitBounds positions={positions} />}
          </MapContainer>
        </div>
      </div>
  );
};

export default RiderMap;