import { useState } from 'react';
import { Search, Trophy } from 'lucide-react';
import axiosLocationClient from '../../api/axiosLocationClient';

const computeScore = (distanceKm, rating) => {
  return ((1 / (distanceKm + 0.1)) * 0.7 + rating * 0.3).toFixed(4);
};

const NearbyDriversTable = () => {
  const [params, setParams] = useState({ latitude: '28.6139', longitude: '77.209', radius: '5.0' });
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosLocationClient.get('/api/v1/locations/drivers/nearby', {
        params: {
          latitude: parseFloat(params.latitude),
          longitude: parseFloat(params.longitude),
          radius: parseFloat(params.radius),
        },
      });
      const scored = (response.data || [])
          .map((d) => ({ ...d, heuristicScore: parseFloat(computeScore(d.distanceKm, d.rating)) }))
          .sort((a, b) => b.heuristicScore - a.heuristicScore);
      setDrivers(scored);
      setSearched(true);
    } catch {
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="card anim-fade-up">
        <div className="card-header">
          <div className="card-icon" style={{ background: 'var(--violet-dim)' }}>
            <Search size={16} className="text-violet" />
          </div>
          <div>
            <h2 className="card-title">Nearby Drivers</h2>
            <p className="card-sub">Ranked by heuristic score</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="grid-3 mb-4" style={{ marginBottom: 16, alignItems: 'end' }}>
          {[
            { name: 'latitude', label: 'Latitude' },
            { name: 'longitude', label: 'Longitude' },
            { name: 'radius', label: 'Radius (km)' },
          ].map(({ name, label }) => (
              <div key={name} className="form-group">
                <label className="form-label">{label}</label>
                <input
                    type="number"
                    step="any"
                    value={params[name]}
                    onChange={(e) => setParams((p) => ({ ...p, [name]: e.target.value }))}
                    className="form-input"
                />
              </div>
          ))}
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" disabled={loading} className="btn btn-primary btn-full">
              {loading ? <span className="spinner" /> : <Search size={14} />}
              Search Nearby Drivers
            </button>
          </div>
        </form>

        {searched && (
            <div className="overflow-hidden">
              {drivers.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 24px' }}>
                    <p className="empty-title">No drivers found within {params.radius} km</p>
                  </div>
              ) : (
                  <table className="data-table">
                    <thead>
                    <tr>
                      <th>#</th>
                      <th>Driver ID</th>
                      <th>Distance</th>
                      <th>Rating</th>
                      <th>
                    <span className="flex items-center gap-1">
                      <Trophy size={11} className="text-amber" /> Score
                    </span>
                      </th>
                    </tr>
                    </thead>
                    <tbody>
                    {drivers.map((driver, idx) => (
                        <tr key={driver.driverId}>
                          <td>{idx === 0 ? <span className="text-amber font-bold">🥇</span> : <span className="text-muted">{idx + 1}</span>}</td>
                          <td><span className="font-mono text-violet" style={{ fontSize: 12 }}>{driver.driverId}</span></td>
                          <td>{driver.distanceKm?.toFixed(2)} km</td>
                          <td><span className="text-amber">★ {driver.rating?.toFixed(1)}</span></td>
                          <td>
                      <span className={`font-mono font-bold ${idx === 0 ? 'text-emerald' : ''}`}>
                        {driver.heuristicScore.toFixed(4)}
                      </span>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
              )}
            </div>
        )}
      </div>
  );
};

export default NearbyDriversTable;