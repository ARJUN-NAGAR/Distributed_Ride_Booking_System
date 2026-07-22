import { useState } from 'react';
import { Power, Radio, MapPin, ChevronDown, Plus, Trash2 } from 'lucide-react';
import useDriverStore from '../../store/useDriverStore';

// Pre-set Delhi locations for quick demo selection
const PRESET_LOCATIONS = [
  { label: 'Connaught Place (Center)',         lat: 28.6139, lng: 77.2090 },
  { label: 'Indira Gandhi Airport (T3)',        lat: 28.5562, lng: 77.1000 },
  { label: 'Noida Sector 18',                  lat: 28.5672, lng: 77.3211 },
  { label: 'Gurgaon Cyber City',               lat: 28.4947, lng: 77.0888 },
  { label: 'Karol Bagh',                       lat: 28.6519, lng: 77.1909 },
  { label: 'Lajpat Nagar',                     lat: 28.5677, lng: 77.2434 },
  { label: 'Dwarka Sector 21',                 lat: 28.5523, lng: 77.0588 },
  { label: 'Rohini Sector 3',                  lat: 28.7041, lng: 77.1025 },
  { label: 'Custom (enter below)',             lat: null,    lng: null     },
];

const TelemetrySimulator = () => {
    const {
        drivers, spawnId, spawnLat, spawnLng,
        setSpawnId, setSpawnLocation, spawnDriver, clearSwarm
    } = useDriverStore();

    const [preset, setPreset] = useState(PRESET_LOCATIONS[0].label);

    const handlePresetChange = (e) => {
        const selected = PRESET_LOCATIONS.find(p => p.label === e.target.value);
        setPreset(selected.label);
        if (selected.lat !== null) {
            setSpawnLocation(String(selected.lat), String(selected.lng));
        }
    };

    return (
        <div className="card anim-fade-up">
            <div className="card-header">
                <div className="card-icon" style={{ background: 'var(--violet-dim)' }}>
                    <Radio size={16} className="text-violet" />
                </div>
                <div>
                    <h2 className="card-title">Telemetry Swarm Control</h2>
                    <p className="card-sub">Spawn up to 5 concurrent drivers</p>
                </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">New Driver ID</label>
                <input
                    type="text"
                    value={spawnId}
                    onChange={(e) => setSpawnId(e.target.value)}
                    placeholder="e.g. driver_101"
                    className="form-input"
                />
            </div>

            <div
                style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginBottom: 14,
                }}
            >
                <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                    <MapPin size={13} className="text-emerald" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-light)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Spawn Location
                    </span>
                </div>

                <div className="form-group" style={{ marginBottom: 10, position: 'relative' }}>
                    <label className="form-label" style={{ fontSize: 10 }}>Quick Preset</label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={preset}
                            onChange={handlePresetChange}
                            className="form-input"
                            style={{ appearance: 'none', paddingRight: 28, fontSize: 12, cursor: 'pointer' }}
                        >
                            {PRESET_LOCATIONS.map(p => (
                                <option key={p.label} value={p.label}>{p.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 10 }}>Latitude</label>
                        <input
                            type="number"
                            step="0.0001"
                            value={spawnLat}
                            onChange={(e) => {
                                setSpawnLocation(e.target.value, spawnLng);
                                setPreset('Custom (enter below)');
                            }}
                            className="form-input"
                            style={{ fontSize: 12 }}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: 10 }}>Longitude</label>
                        <input
                            type="number"
                            step="0.0001"
                            value={spawnLng}
                            onChange={(e) => {
                                setSpawnLocation(spawnLat, e.target.value);
                                setPreset('Custom (enter below)');
                            }}
                            className="form-input"
                            style={{ fontSize: 12 }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
                <button 
                    onClick={spawnDriver} 
                    className="toggle-btn toggle-online" 
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    disabled={drivers.length >= 5}
                >
                    <Plus size={16} />
                    Spawn Driver
                </button>
                {drivers.length > 0 && (
                    <button 
                        onClick={clearSwarm} 
                        className="toggle-btn toggle-offline" 
                        style={{ flex: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                        <Trash2 size={16} />
                        Clear All
                    </button>
                )}
            </div>

            <div className="info-box mt-4" style={{ marginTop: 12 }}>
                {drivers.length > 0
                    ? `📡 Swarm Active: ${drivers.length}/5 drivers broadcasting telemetry every 3s.`
                    : '💡 Spawn a driver to begin broadcasting GPS coordinates to the Location Service.'}
            </div>
        </div>
    );
};

export default TelemetrySimulator;