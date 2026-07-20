import { CheckCircle2, Circle, XCircle, Loader2 } from 'lucide-react';
import { RIDE_STEPS, RIDE_STATUSES, TERMINAL_STATES } from '../../constants/rideStatuses';
import useRideStore from '../../store/useRideStore';

// RIDE_STATUSES colors are authored as 'text-violet-400' etc — map that
// down to the badge-{variant} classes already defined in index.css.
const badgeVariant = (colorClass) => colorClass.replace('text-', '').replace('-400', '');

const StatusBadge = ({ status }) => {
  const config = RIDE_STATUSES[status];
  if (!config) return null;
  const variant = badgeVariant(config.color);
  return (
      <span className={`badge badge-${variant}`}>
      <span className={`badge-dot`} style={{ background: `var(--${variant})` }} />
        {config.label}
    </span>
  );
};

const StepIcon = ({ stepStatus }) => {
  if (stepStatus === 'complete') return <CheckCircle2 size={18} className="text-emerald" />;
  if (stepStatus === 'active') return <Loader2 size={18} className="text-violet animate-spin" />;
  return <Circle size={18} style={{ color: 'var(--text-dim)' }} />;
};

const RideStatusStepper = () => {
  const { currentRide, cancelRide, startRide, completeRide } = useRideStore();

  if (!currentRide) return null;

  const { status } = currentRide;
  const isCancelled = status === 'CANCELLED' || status === 'FAILED';
  const currentStep = RIDE_STATUSES[status]?.step ?? 0;

  const getStepStatus = (idx) => {
    if (currentStep > idx) return 'complete';
    if (currentStep === idx) return 'active';
    return 'pending';
  };

  return (
      <div className="card anim-fade-up">
        <div className="flex items-center justify-between mb-2" style={{ marginBottom: 20 }}>
          <div>
            <h2 className="card-title" style={{ marginBottom: 4 }}>Ride Status</h2>
            <p className="card-sub">ID: {currentRide.id?.slice(0, 8)}...</p>
          </div>
          <StatusBadge status={status} />
        </div>

        {isCancelled ? (
            <div className="info-box" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              borderColor: 'rgba(239,68,68,0.25)', background: 'var(--crimson-dim)',
            }}>
              <XCircle size={20} className="text-crimson" style={{ flexShrink: 0 }} />
              <div>
                <p className="text-crimson font-bold" style={{ fontSize: 13 }}>Ride Cancelled</p>
                <p className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                  {status === 'FAILED'
                      ? 'No driver was available after matching attempts'
                      : 'This ride was manually cancelled'}
                </p>
              </div>
            </div>
        ) : (
            <div className="stepper">
              {RIDE_STEPS.map((step, idx) => {
                const stepStatus = getStepStatus(idx);
                const config = RIDE_STATUSES[step];
                return (
                    <div key={step} className="step-row">
                      <div className="step-indicator">
                        <div className={`step-circle ${stepStatus}`}>
                          <StepIcon stepStatus={stepStatus} />
                        </div>
                        {idx < RIDE_STEPS.length - 1 && (
                            <div className={`step-line ${stepStatus === 'complete' ? 'done' : ''}`} />
                        )}
                      </div>
                      <div className="step-content" style={{ opacity: stepStatus === 'pending' ? 0.35 : stepStatus === 'complete' ? 0.7 : 1 }}>
                        <p className={`step-title ${stepStatus === 'active' ? 'text-' + badgeVariant(config.color) : ''}`}>
                          {config.label}
                        </p>
                        <p className="step-desc">{config.description}</p>
                      </div>
                    </div>
                );
              })}
            </div>
        )}

        {!TERMINAL_STATES.includes(status) && (
            <div className="flex gap-2 mt-4" style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {(status === 'ACCEPTED' || status === 'DRIVER_ARRIVING') && (
                  <button onClick={() => startRide(currentRide.id)} className="btn btn-primary" style={{ flex: 1 }}>
                    Start Ride
                  </button>
              )}
              {status === 'RIDE_STARTED' && (
                  <button onClick={() => completeRide(currentRide.id)} className="btn btn-success" style={{ flex: 1 }}>
                    Complete Ride
                  </button>
              )}
              <button onClick={() => cancelRide(currentRide.id)} className="btn btn-ghost" style={{ flex: 1, color: 'var(--crimson)', borderColor: 'rgba(239,68,68,0.3)' }}>
                Cancel
              </button>
            </div>
        )}
      </div>
  );
};

export default RideStatusStepper;