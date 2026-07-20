import { useState, useEffect } from 'react';
import { MapPin, Navigation, User, Send, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import useRideStore from '../../store/useRideStore';
import useMapStore from '../../store/useMapStore';
import { geocodingService } from '../../api/geocodingService';

const BookingForm = () => {
  const { bookRide, isBooking } = useRideStore();
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
  
  const [passengerId, setPassengerId] = useState('passenger_001');
  const [showCoords, setShowCoords] = useState(false);

  // Local inputs synced to store values
  const [pickupQuery, setPickupQuery] = useState(draftPickupAddress || '');
  const [dropQuery, setDropQuery] = useState(draftDropAddress || '');

  // Suggestions state
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [focusedInput, setFocusedInput] = useState(null); // 'pickup' | 'drop'
  const [loading, setLoading] = useState(false);

  // Sync inputs when map pins update coordinates (reverse geocoding finished)
  useEffect(() => {
    setPickupQuery(draftPickupAddress);
  }, [draftPickupAddress]);

  useEffect(() => {
    setDropQuery(draftDropAddress);
  }, [draftDropAddress]);

  // Debounced search for Pickup address
  useEffect(() => {
    if (!pickupQuery || pickupQuery.length < 4 || pickupQuery === draftPickupAddress) {
      setPickupSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const suggestions = await geocodingService.searchAddress(pickupQuery);
      setPickupSuggestions(suggestions);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [pickupQuery, draftPickupAddress]);

  // Debounced search for Drop address
  useEffect(() => {
    if (!dropQuery || dropQuery.length < 4 || dropQuery === draftDropAddress) {
      setDropSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const suggestions = await geocodingService.searchAddress(dropQuery);
      setDropSuggestions(suggestions);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [dropQuery, draftDropAddress]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      passengerId,
      pickupLatitude: parseFloat(draftPickupLat),
      pickupLongitude: parseFloat(draftPickupLng),
      dropLatitude: parseFloat(draftDropLat),
      dropLongitude: parseFloat(draftDropLng),
      pickupAddress: draftPickupAddress,
      dropAddress: draftDropAddress
    };
    await bookRide(payload);
  };

  const handleSelectPickup = (item) => {
    setDraftPickup(item.lat, item.lng, item.label);
    setPickupQuery(item.label);
    setPickupSuggestions([]);
    setFocusedInput(null);
  };

  const handleSelectDrop = (item) => {
    setDraftDrop(item.lat, item.lng, item.label);
    setDropQuery(item.label);
    setDropSuggestions([]);
    setFocusedInput(null);
  };

  return (
      <div className="card anim-fade-up" style={{ position: 'relative', zIndex: 10 }}>
        <div className="card-header">
          <div className="card-icon" style={{ background: 'var(--violet-dim)' }}>
            <Navigation size={16} className="text-violet" />
          </div>
          <div>
            <h2 className="card-title">Book a Ride</h2>
            <p className="card-sub">Type an address or select from the map</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="stack" style={{ gap: '16px' }}>
          {/* Passenger ID */}
          <div className="form-group">
            <label className="form-label">Passenger ID</label>
            <div className="input-icon-wrap">
              <User size={14} className="input-icon" />
              <input 
                type="text" 
                className="form-input" 
                value={passengerId}
                onChange={(e) => setPassengerId(e.target.value)}
                required 
              />
            </div>
          </div>

          {/* Pickup Address Lookup */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Pickup Address</label>
            <div className="input-icon-wrap">
              {loading && focusedInput === 'pickup' ? (
                <Loader2 size={14} className="input-icon spin" />
              ) : (
                <MapPin size={14} className="input-icon text-emerald" />
              )}
              <input 
                type="text" 
                className="form-input"
                placeholder="Type street, landmark, or city..."
                value={pickupQuery}
                onChange={(e) => setPickupQuery(e.target.value)}
                onFocus={() => setFocusedInput('pickup')}
                required
              />
            </div>
            {/* Suggestions drop-down */}
            {focusedInput === 'pickup' && pickupSuggestions.length > 0 && (
              <div className="dropdown-suggestions" style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                backgroundColor: 'var(--card-bg)', borderRadius: '8px',
                border: '1px solid var(--border-color)', boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                zIndex: 9999, maxHeight: '200px', overflowY: 'auto', marginTop: '4px'
              }}>
                {pickupSuggestions.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleSelectPickup(item)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer', fontSize: '12px',
                      borderBottom: idx < pickupSuggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                      color: 'var(--text-primary)', transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-card-hover)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drop Address Lookup */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Drop Address</label>
            <div className="input-icon-wrap">
              {loading && focusedInput === 'drop' ? (
                <Loader2 size={14} className="input-icon spin" />
              ) : (
                <Navigation size={14} className="input-icon text-rose" />
              )}
              <input 
                type="text" 
                className="form-input"
                placeholder="Type destination landmark..."
                value={dropQuery}
                onChange={(e) => setDropQuery(e.target.value)}
                onFocus={() => setFocusedInput('drop')}
                required
              />
            </div>
            {/* Suggestions drop-down */}
            {focusedInput === 'drop' && dropSuggestions.length > 0 && (
              <div className="dropdown-suggestions" style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                backgroundColor: 'var(--card-bg)', borderRadius: '8px',
                border: '1px solid var(--border-color)', boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                zIndex: 9999, maxHeight: '200px', overflowY: 'auto', marginTop: '4px'
              }}>
                {dropSuggestions.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleSelectDrop(item)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer', fontSize: '12px',
                      borderBottom: idx < dropSuggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                      color: 'var(--text-primary)', transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-card-hover)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Collapsible Coordinates (Handy for debugging & interviews!) */}
          <div className="stack" style={{ gap: '8px' }}>
            <button 
              type="button" 
              onClick={() => setShowCoords(!showCoords)}
              className="btn btn-ghost btn-xs" 
              style={{ display: 'flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start', opacity: 0.7 }}
            >
              {showCoords ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showCoords ? 'Hide Coordinates' : 'Show Coordinates'}
            </button>
            
            {showCoords && (
              <div className="grid-2 anim-fade-up" style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-sub)' }}>
                <div>
                  <strong>Pickup Coords:</strong>
                  <div>Lat: {draftPickupLat}</div>
                  <div>Lng: {draftPickupLng}</div>
                </div>
                <div>
                  <strong>Drop Coords:</strong>
                  <div>Lat: {draftDropLat}</div>
                  <div>Lng: {draftDropLng}</div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={isBooking} className="btn btn-primary btn-full" style={{ marginTop: '10px' }}>
            {isBooking ? (
                <>
                  <span className="spinner" />
                  Dispatching...
                </>
            ) : (
                <>
                  <Send size={14} />
                  Request Ride
                </>
            )}
          </button>
        </form>
      </div>
  );
};

export default BookingForm;