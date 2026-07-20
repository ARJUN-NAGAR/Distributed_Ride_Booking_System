import { DollarSign, TrendingUp, Info } from 'lucide-react';
import useRideStore from '../../store/useRideStore';

const FareReceiptPanel = () => {
  const { currentRide } = useRideStore();

  if (!currentRide) return null;

  const { fare, pickupLatitude, pickupLongitude, dropLatitude, dropLongitude, driverId } = currentRide;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const estimateDistance = () => {
    if (!pickupLatitude || !dropLatitude) return 'N/A';
    const R = 6371;
    const dLat = toRad(dropLatitude - pickupLatitude);
    const dLon = toRad(dropLongitude - pickupLongitude);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(pickupLatitude)) * Math.cos(toRad(dropLatitude)) * Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
  };

  const distKm = estimateDistance();
  const baseFare = fare || 0;
  const surgeMultiplier = baseFare > 0 ? (baseFare / (distKm * 15)).toFixed(2) : '1.00';

  return (
      <div className="card anim-fade-up">
        <div className="card-header">
          <div className="card-icon" style={{ background: 'var(--amber-dim)' }}>
            <DollarSign size={16} className="text-amber" />
          </div>
          <div>
            <h2 className="card-title">Fare Receipt</h2>
            <p className="card-sub">Live pricing breakdown</p>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16,
          padding: 16, borderRadius: 'var(--radius)',
          background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <span className="fare-big">₹{baseFare.toFixed(2)}</span>
          <span className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>estimated</span>
        </div>

        <div>
          <div className="fare-row">
            <span className="fare-key">Estimated Distance</span>
            <span className="fare-val">{distKm} km</span>
          </div>
          <div className="fare-row">
            <span className="fare-key">Driver Assigned</span>
            <span className="fare-val">{driverId ? `${driverId.slice(0, 12)}...` : 'Matching...'}</span>
          </div>
          <div className="fare-row">
            <span className="fare-key">Surge Multiplier</span>
            <span className={`fare-val ${parseFloat(surgeMultiplier) > 1 ? 'text-amber' : ''}`}>{surgeMultiplier}×</span>
          </div>
          <div className="fare-row">
            <span className="fare-key">Base Rate (per km)</span>
            <span className="fare-val">₹15.00</span>
          </div>
        </div>

        <div className="info-box mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Info size={12} className="text-violet" />
            <span className="text-violet font-bold" style={{ fontSize: 11 }}>Driver Heuristic Score</span>
          </div>
          <p className="font-mono" style={{ fontSize: 11 }}>
            Score = (1/(dist + 0.1)) × 0.7 + (rating × 0.3)
          </p>
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp size={12} className="text-emerald" />
            <span className="text-emerald" style={{ fontSize: 11 }}>Higher score = preferred driver candidate</span>
          </div>
        </div>
      </div>
  );
};

export default FareReceiptPanel;