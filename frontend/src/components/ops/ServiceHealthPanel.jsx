import { useEffect, useState } from 'react';
import { Server, Activity } from 'lucide-react';
import axiosLocationClient from '../../api/axiosLocationClient';
import axiosRideClient from '../../api/axiosRideClient';
import axios from 'axios';

const SERVICES = [
  { name: 'Location Service', port: 8082, client: axiosLocationClient },
  { name: 'Ride Service', port: 8083, client: axiosRideClient },
  { name: 'Matching Service', port: 8084, client: null, baseUrl: 'http://localhost:8084' },
];

const pingService = async (service) => {
  try {
    const client = service.client || axios.create({ baseURL: service.baseUrl, timeout: 4000 });
    await client.get('/actuator/health');
    return 'UP';
  } catch (err) {
    if (err.response && err.response.status < 500) return 'UP';
    return 'DOWN';
  }
};

const ServiceHealthPanel = () => {
  const [statuses, setStatuses] = useState({});
  const [lastChecked, setLastChecked] = useState(null);

  const checkAll = async () => {
    const results = await Promise.allSettled(SERVICES.map((s) => pingService(s)));
    const statusMap = {};
    results.forEach((result, idx) => {
      statusMap[SERVICES[idx].name] = result.status === 'fulfilled' ? result.value : 'DOWN';
    });
    setStatuses(statusMap);
    setLastChecked(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
      <div className="card anim-fade-up">
        <div className="flex items-center justify-between mb-4" style={{ marginBottom: 16 }}>
          <div className="flex items-center gap-3">
            <div className="card-icon" style={{ background: 'var(--emerald-dim)' }}>
              <Activity size={16} className="text-emerald" />
            </div>
            <div>
              <h2 className="card-title">Service Health</h2>
              <p className="card-sub">Auto-refresh every 10s {lastChecked && `· Last: ${lastChecked}`}</p>
            </div>
          </div>
          <button onClick={checkAll} className="btn btn-ghost btn-sm" style={{ color: 'var(--emerald)', borderColor: 'rgba(16,185,129,0.3)' }}>
            Refresh
          </button>
        </div>

        <div className="stack" style={{ gap: 12 }}>
          {SERVICES.map((service) => {
            const status = statuses[service.name];
            const isUp = status === 'UP';
            const isPending = status === undefined;

            return (
                <div key={service.name} className="health-item">
                  <div className="health-info">
                    <Server size={16} className="text-muted" />
                    <div>
                      <p className="health-name">{service.name}</p>
                      <p className="health-port">localhost:{service.port}</p>
                    </div>
                  </div>
                  <div className="health-badge">
                    {isPending ? (
                        <span className="text-muted" style={{ fontSize: 11 }}>Checking...</span>
                    ) : (
                        <>
                          <span className={`dot ${isUp ? 'dot-green' : 'dot-red'}`} />
                          <span className={isUp ? 'text-emerald' : 'text-crimson'}>{isUp ? 'UP' : 'DOWN'}</span>
                        </>
                    )}
                  </div>
                </div>
            );
          })}
        </div>
      </div>
  );
};

export default ServiceHealthPanel;