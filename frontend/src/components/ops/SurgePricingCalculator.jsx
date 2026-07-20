import { useState } from 'react';
import { TrendingUp, Zap } from 'lucide-react';

const SurgePricingCalculator = () => {
  const [demand, setDemand] = useState(10);
  const [supply, setSupply] = useState(4);

  const multiplier = (1.0 + Math.min(1.5, demand / (supply + 1))).toFixed(3);
  const surgeLevel = parseFloat(multiplier);
  const variant = surgeLevel < 1.3 ? 'emerald' : surgeLevel < 1.8 ? 'amber' : 'crimson';
  const label = surgeLevel < 1.3 ? 'Low Demand' : surgeLevel < 1.8 ? 'Moderate Surge' : 'High Surge';

  return (
      <div className="card anim-fade-up">
        <div className="card-header">
          <div className="card-icon" style={{ background: 'var(--amber-dim)' }}>
            <Zap size={16} className="text-amber" />
          </div>
          <div>
            <h2 className="card-title">Surge Pricing Calculator</h2>
            <p className="card-sub">Real-time Redis hash-map based pricing model</p>
          </div>
        </div>

        <div className="grid-2 mb-4" style={{ marginBottom: 20 }}>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Demand (Ride Requests)</label>
            <input type="range" min="0" max="50" value={demand} onChange={(e) => setDemand(parseInt(e.target.value))} />
            <div className="range-label">
              <span>0</span>
              <span className="font-bold" style={{ color: 'var(--text)' }}>{demand}</span>
              <span>50</span>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Supply (Online Drivers)</label>
            <input type="range" min="0" max="30" value={supply} onChange={(e) => setSupply(parseInt(e.target.value))} />
            <div className="range-label">
              <span>0</span>
              <span className="font-bold" style={{ color: 'var(--text)' }}>{supply}</span>
              <span>30</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between" style={{ padding: 16, borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div>
            <p className="card-sub mb-1" style={{ marginBottom: 4 }}>Surge Multiplier</p>
            <p className={`surge-number text-${variant}`}>{multiplier}×</p>
            <p className={`text-${variant} font-bold`} style={{ fontSize: 11, marginTop: 4 }}>{label}</p>
          </div>
          <TrendingUp size={32} className={`text-${variant}`} style={{ opacity: 0.5 }} />
        </div>

        <div className="surge-formula">
          multiplier = 1.0 + min(1.5, {demand} / ({supply} + 1))
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= 1.0 + min(1.5, {(demand / (supply + 1)).toFixed(3)}) = <span className={`text-${variant}`}>{multiplier}</span>
        </div>
      </div>
  );
};

export default SurgePricingCalculator;