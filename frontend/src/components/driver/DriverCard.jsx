import { User, Activity, RefreshCw, Trash2 } from 'lucide-react';
import useDriverStore from '../../store/useDriverStore';

const DriverCard = () => {
  const { drivers, removeDriver } = useDriverStore();

  if (drivers.length === 0) {
    return null;
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      {drivers.map(driver => (
        <div key={driver.id} className={`card anim-fade-up ${driver.isFlashing ? 'flash' : ''}`} style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="card-icon" style={{ background: driver.isOnline ? 'var(--emerald-dim)' : 'var(--surface)', width: 32, height: 32 }}>
                <User size={16} className={driver.isOnline ? 'text-emerald' : 'text-muted'} />
              </div>
              <div>
                <p className="card-title" style={{ fontSize: 13 }}>{driver.id}</p>
                <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                  <span className={`dot ${driver.isOnline ? 'dot-green' : 'dot-gray'}`} style={{ width: 6, height: 6 }} />
                  <span className="text-muted" style={{ fontSize: 11 }}>{driver.isOnline ? 'Broadcasting (3s)' : 'Offline'}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => removeDriver(driver.id)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              title="Remove Driver"
            >
              <Trash2 size={16} className="hover:text-red transition-colors" />
            </button>
          </div>

          {driver.isOnline && (
              <div className="coords-box" style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="coord-item">
                  <label>Lat</label>
                  <span className="coord-val">{driver.lat.toFixed(4)}</span>
                </div>
                <div className="coord-item">
                  <label>Lng</label>
                  <span className="coord-val">{driver.lng.toFixed(4)}</span>
                </div>
                <div className="coord-item" style={{ marginLeft: 'auto', textAlign: 'right', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={12} className={driver.isFlashing ? 'text-emerald animate-spin' : 'text-muted'} />
                  <span className={driver.isFlashing ? 'text-emerald' : 'text-muted'} style={{ fontSize: 11 }}>Syncing...</span>
                </div>
              </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DriverCard;