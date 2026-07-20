import { Radio } from 'lucide-react';
import TelemetrySimulator from '../components/driver/TelemetrySimulator';
import DriverCard from '../components/driver/DriverCard';
import DriverMap from '../components/driver/DriverMap';

const HOW_IT_WORKS = [
  { step: '1', text: 'Driver goes online → simulator starts a 3-second interval', variant: 'violet' },
  { step: '2', text: 'Each tick sends POST /api/v1/locations/drivers/{id}/telemetry with randomized ±0.002° offset', variant: 'amber' },
  { step: '3', text: 'Location Service stores in Redis with TTL — driver appears in nearby searches', variant: 'emerald' },
  { step: '4', text: 'Matching Service queries Redis on ride.requested Kafka event to find best candidate', variant: 'violet' },
];

const DriverSimulator = () => {
  return (
      <div className="stack anim-fade-up">
        <div className="page-header">
          <div className="page-title-row">
            <div className="page-icon-wrap" style={{ background: 'linear-gradient(135deg, var(--emerald-dim), var(--violet-dim))' }}>
              <Radio size={20} className="text-emerald" />
            </div>
            <h1 className="page-title">Driver Simulator</h1>
          </div>
          <p className="page-sub">Emulate driver telemetry — broadcasts to Location Service every 3 seconds</p>
        </div>

        <div className="grid-left-right">
          <div className="stack">
            <TelemetrySimulator />
            <DriverCard />
          </div>

          <div className="stack">
            <DriverMap />

            <div className="card">
              <h3 className="card-title mb-3" style={{ marginBottom: 12 }}>How the Telemetry Works</h3>
              <div className="stack" style={{ gap: 12 }}>
                {HOW_IT_WORKS.map(({ step, text, variant }) => (
                    <div key={step} className="flex items-start gap-3">
                      <div
                          className="flex items-center justify-center font-bold"
                          style={{
                            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                            fontSize: 11, color: '#fff', background: `var(--${variant})`,
                          }}
                      >
                        {step}
                      </div>
                      <p className="text-muted" style={{ fontSize: 12, lineHeight: 1.6 }}>{text}</p>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default DriverSimulator;