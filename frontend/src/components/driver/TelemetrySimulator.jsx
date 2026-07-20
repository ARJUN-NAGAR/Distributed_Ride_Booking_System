import { useState } from 'react';
import { Power, Radio } from 'lucide-react';
import useDriverStore from '../../store/useDriverStore';

const TelemetrySimulator = () => {
    const { driverId, isOnline, setDriverId, goOnline, goOffline } = useDriverStore();
    const [inputId, setInputId] = useState(driverId);

    const handleToggle = () => {
        if (isOnline) {
            goOffline();
        } else {
            setDriverId(inputId);
            goOnline();
        }
    };

    return (
        <div className="card anim-fade-up">
            <div className="card-header">
                <div className="card-icon" style={{ background: 'var(--violet-dim)' }}>
                    <Radio size={16} className="text-violet" />
                </div>
                <div>
                    <h2 className="card-title">Telemetry Control</h2>
                    <p className="card-sub">Simulate driver location updates</p>
                </div>
            </div>

            <div className="form-group mb-4" style={{ marginBottom: 16 }}>
                <label className="form-label">Driver ID</label>
                <input
                    type="text"
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value)}
                    disabled={isOnline}
                    placeholder="e.g. driver_101"
                    className="form-input"
                />
            </div>

            <button onClick={handleToggle} className={`toggle-btn ${isOnline ? 'toggle-offline' : 'toggle-online'}`}>
                <Power size={18} className={isOnline ? 'animate-pulse' : ''} />
                {isOnline ? 'Go Offline' : 'Go Online'}
            </button>

            <div className="info-box mt-4">
                {isOnline
                    ? '📡 Posting coordinates to POST /api/v1/locations/drivers/{id}/telemetry every 3 seconds'
                    : '💡 Go online to start broadcasting simulated GPS coordinates to the Location Service'}
            </div>
        </div>
    );
};

export default TelemetrySimulator;