import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useDemoSimulatorStore from '../../store/useDemoSimulatorStore';

// Fix leaflet default icon paths broken by Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const transparentShadow = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const carIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzNiODJmNiIgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIj48cGF0aCBkPSJNMTguOTIgNi4wMUMxOC43MiA1LjQyIDE4LjE2IDUgMTcuNSA1aC0xMWMtLjY2IDAtMS4yMS40Mi0xLjQyIDEuMDFMMyAxMnY4YzAgLjU1LjQ1IDEgMSAxaDFjLjU1IDAgMS0uNDUgMS0xdi0xaDEydjFjMCAuNTUuNDUgMSAxIDFoMWMuNTUgMCAxLS40NSAxLTF2LThsLTIuMDgtNS45OXpNNi41IDE2Yy0uODMgMC0xLjUtLjY3LTEuNS0xLjVTNS42NyAxMyA2LjUgMTNzMS41LjY3IDEuNSAxLjVTNy4zMyAxNiA2LjUgMTZ6bTExIDBjLS44MyAwLTEuNS0uNjctMS41LTEuNXMuNjctMS41IDEuNS0xLjUgMS41LjY3IDEuNSAxLjUtLjY3IDEuNS0xLjUgMS41ek01IDExbDEuMjctMy44MmMuMTQtLjQuNTItLjY4Ljk2LS42OGg5LjU0Yy40NCAwIC44Mi4yOC45Ni42OEwxOSAxMUg1eiIvPjwvc3ZnPg==',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -10],
  shadowUrl: transparentShadow,
});

const greenIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzEwYjk4MSIgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIj48cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03em0wIDkuNWMtMS4zOCAwLTIuNS0xLjEyLTIuNS0yLjVzMS4xMi0yLjUgMi41LTIuNSAyLjUgMS4xMiAyLjUgMi41LSxLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -25],
  shadowUrl: transparentShadow,
});

const redIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2VmNDQ0NCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIj48cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03em0wIDkuNWMtMS4zOCAwLTIuNS0xLjEyLTIuNS0yLjVzMS4xMi0yLjUgMi41LTIuNSAyLjUgMS4xMiAyLjUgMi41LSxLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -25],
  shadowUrl: transparentShadow,
});

const GlobalFleetMap = () => {
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const { simulatedRides } = useDemoSimulatorStore();
  const defaultCenter = [28.6139, 77.209];

  useEffect(() => {
    // Poll for nearby drivers every 2 seconds to create the swarm effect
    const fetchDrivers = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const res = await fetch(`http://localhost:8080/api/v1/locations/drivers/nearby?latitude=${defaultCenter[0]}&longitude=${defaultCenter[1]}&radius=15.0`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (res.ok) {
          const data = await res.json();
          setNearbyDrivers(data);
        }
      } catch (err) {
        // Silently ignore connection errors during heavy load tests
      }
    };
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card anim-fade-up" style={{ marginTop: '20px' }}>
      <h2 className="card-title mb-4">Global Fleet Telemetry Map</h2>
      <p className="card-sub mb-4">Live Redis GEO visualization. Active drivers: {nearbyDrivers.length} | Active Simulated Rides: {simulatedRides.length}</p>
      <div className="map-container" style={{ height: 500, borderRadius: '12px', overflow: 'hidden' }}>
        <MapContainer
            center={defaultCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
        >
          <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme tile layer for Ops!
          />
          
          {/* Render the swarm of live drivers */}
          {nearbyDrivers.map((driver) => (
              <Marker key={driver.driverId} position={[driver.latitude, driver.longitude]} icon={carIcon}>
                <Popup>
                  <strong>Driver:</strong> {driver.driverId} <br/> 
                  <strong>Rating:</strong> {driver.rating} <br/> 
                  <strong>Distance:</strong> {driver.distanceKm.toFixed(2)} km
                </Popup>
              </Marker>
          ))}

          {/* Render simulated rides (pickups, dropoffs, and routes) */}
          {simulatedRides.map((ride) => {
            const isMatched = !!ride.driverId;
            const isCompleted = ride.status === 'COMPLETED';
            const polylineColor = isCompleted ? '#64748b' : isMatched ? '#10b981' : '#f59e0b';
            
            return (
              <div key={ride.id}>
                {/* Pickup Marker */}
                <Marker position={[ride.pickupLat, ride.pickupLng]} icon={greenIcon}>
                  <Popup>
                    <strong>Simulated Passenger (Pickup):</strong> {ride.passengerId} <br/>
                    <strong>Address:</strong> {ride.pickupAddress} <br/>
                    <strong>Status:</strong> {ride.status}
                  </Popup>
                </Marker>

                {/* Dropoff Marker */}
                <Marker position={[ride.dropLat, ride.dropLng]} icon={redIcon}>
                  <Popup>
                    <strong>Destination (Dropoff):</strong> {ride.passengerId} <br/>
                    <strong>Address:</strong> {ride.dropAddress} <br/>
                    <strong>Status:</strong> {ride.status}
                  </Popup>
                </Marker>

                {/* Route Path Polyline */}
                <Polyline 
                  positions={[[ride.pickupLat, ride.pickupLng], [ride.dropLat, ride.dropLng]]} 
                  color={polylineColor}
                  dashArray={isMatched ? 'none' : '5, 10'}
                  weight={3}
                />
              </div>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default GlobalFleetMap;
