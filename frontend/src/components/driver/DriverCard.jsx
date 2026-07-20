import { User, Star, Activity, RefreshCw } from 'lucide-react';
import useDriverStore from '../../store/useDriverStore';

const DriverCard = () => {
  const { driverId, isOnline, rating, currentLat, currentLng, updateCount, lastUpdated, isFlashing } = useDriverStore();

  return (
      <div className={`card anim-fade-up ${isFlashing ? 'flash' : ''}`}>
        <div className="flex items-center justify-between mb-4" style={{ marginBottom: 16 }}>
          <div className="flex items-center gap-3">
            <div className="card-icon" style={{ background: isOnline ? 'var(--emerald-dim)' : 'var(--surface)' }}>
              <User size={18} className={isOnline ? 'text-emerald' : 'text-muted'} />
            </div>
            <div>
              <p className="card-title">{driverId || 'No Driver ID'}</p>
              <p className="card-sub">Telemetry Simulator</p>
            </div>
          </div>

          <span className={`badge ${isOnline ? 'badge-emerald' : ''}`} style={!isOnline ? { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' } : {}}>
          <span className={`dot ${isOnline ? 'dot-green' : 'dot-gray'}`} />
            {isOnline ? 'Online' : 'Offline'}
        </span>
        </div>

        <div className="grid-3">
          <div className="metric-card">
            <div className="flex items-center justify-center gap-1">
              <Star size={12} className="text-amber" />
              <span className="metric-value text-amber" style={{ fontSize: 15 }}>{rating.toFixed(1)}</span>
            </div>
            <p className="metric-label">Rating</p>
          </div>

          <div className="metric-card" style={isFlashing ? { background: 'var(--emerald-dim)', borderColor: 'rgba(16,185,129,0.3)' } : {}}>
            <div className="flex items-center justify-center gap-1">
              <RefreshCw size={12} className={isFlashing ? 'text-emerald animate-spin' : 'text-muted'} />
              <span className={`metric-value ${isFlashing ? 'text-emerald' : ''}`} style={{ fontSize: 15 }}>{updateCount}</span>
            </div>
            <p className="metric-label">Updates</p>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-center gap-1">
              <Activity size={12} className={isOnline ? 'text-violet' : 'text-muted'} />
              <span className="metric-value" style={{ fontSize: 15 }}>3s</span>
            </div>
            <p className="metric-label">Interval</p>
          </div>
        </div>

        {isOnline && (
            <div className="coords-box mt-4">
              <div className="coord-item">
                <label>Lat</label>
                <span className="coord-val">{currentLat.toFixed(5)}</span>
              </div>
              <div className="coord-item">
                <label>Lng</label>
                <span className="coord-val">{currentLng.toFixed(5)}</span>
              </div>
              {lastUpdated && (
                  <div className="coord-item" style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <label>Last Update</label>
                    <span className="text-muted" style={{ fontSize: 11 }}>{new Date(lastUpdated).toLocaleTimeString()}</span>
                  </div>
              )}
            </div>
        )}
      </div>
  );
};

export default DriverCard;