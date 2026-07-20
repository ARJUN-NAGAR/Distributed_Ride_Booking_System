import { Play, Square, Award, AlertTriangle, ShieldAlert } from 'lucide-react';
import useDemoSimulatorStore from '../../store/useDemoSimulatorStore';

const DemoSimulatorPanel = () => {
  const {
    isDriverSimulating,
    isRiderSimulating,
    isDdosSimulating,
    ddosBlockedCount,
    ddosSuccessCount,
    simulatedDrivers,
    simulatedRides,
    startDriverSimulation,
    stopDriverSimulation,
    bookSimulatedRides,
    disconnectAllRideStreams,
    runDdosTelemetryBurst
  } = useDemoSimulatorStore();

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'MATCHING': return 'badge-matching';
      case 'ACCEPTED':
      case 'DRIVER_REVIEWING': return 'badge-accepted';
      case 'RIDE_STARTED': return 'badge-started';
      case 'COMPLETED': return 'badge-completed';
      default: return 'badge-failed';
    }
  };

  return (
    <div className="card anim-fade-up" style={{ border: '1px solid rgba(245,158,11,0.25)', background: 'linear-gradient(to bottom, rgba(30,41,59,0.5), rgba(15,23,42,0.8))' }}>
      <div className="flex items-center justify-between mb-4" style={{ marginBottom: 16 }}>
        <div className="flex items-center gap-3">
          <div className="card-icon" style={{ background: 'var(--amber-dim)' }}>
            <Award size={16} className="text-amber" />
          </div>
          <div>
            <h2 className="card-title">Interviewer Simulation Console</h2>
            <p className="card-sub">Simulate multi-agent workflows, Kafka propagation & system load</p>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ gap: 16, marginBottom: 20 }}>
        {/* Driver Swarm Controller */}
        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: 16 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 600, color: 'var(--text-light)' }}>1. Driver Swarm (Leaflet)</h4>
          <p className="text-muted" style={{ fontSize: 11, marginBottom: 16 }}>
            Spawns 5 independent simulated drivers broadcasting GPS telemetry to Redis every 3s.
          </p>
          {isDriverSimulating ? (
            <button onClick={stopDriverSimulation} className="btn toggle-offline w-full flex items-center justify-center gap-2">
              <Square size={14} /> Stop Driver Swarm
            </button>
          ) : (
            <button onClick={startDriverSimulation} className="btn toggle-online w-full flex items-center justify-center gap-2">
              <Play size={14} /> Start 5 Drivers
            </button>
          )}
        </div>

        {/* Concurrent Ride Bookings */}
        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: 16 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 600, color: 'var(--text-light)' }}>2. Batch Rides (Kafka)</h4>
          <p className="text-muted" style={{ fontSize: 11, marginBottom: 16 }}>
            Books 5 concurrent rides. Propagates through Kafka to match nearby online drivers.
          </p>
          <div className="flex gap-2">
            <button 
              onClick={bookSimulatedRides} 
              disabled={!isDriverSimulating || isRiderSimulating} 
              className="btn btn-primary w-full flex items-center justify-center gap-2"
              style={{ fontSize: 12, padding: '8px 12px' }}
            >
              Book 5 Rides
            </button>
            {simulatedRides.length > 0 && (
              <button 
                onClick={disconnectAllRideStreams} 
                className="btn btn-ghost" 
                style={{ padding: '8px 12px', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--crimson)' }}
              >
                Clear
              </button>
            )}
          </div>
          {!isDriverSimulating && (
            <span style={{ fontSize: 10, color: 'var(--amber)', display: 'block', marginTop: 6 }}>
              ⚠️ Start Driver Swarm first to allow matching.
            </span>
          )}
        </div>

        {/* DDoS Rate Limit Simulator */}
        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: 16 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 600, color: 'var(--text-light)' }}>3. DDoS Test (Rate Limiting)</h4>
          <p className="text-muted" style={{ fontSize: 11, marginBottom: 16 }}>
            Spams 80 concurrent telemetry requests in a single burst. Triggers HTTP 429 rate limit.
          </p>
          <button 
            onClick={runDdosTelemetryBurst} 
            disabled={isDdosSimulating}
            className="btn w-full flex items-center justify-center gap-2" 
            style={{ background: 'linear-gradient(to right, #7f1d1d, #b91c1c)', color: '#fff', border: 'none', marginBottom: 12 }}
          >
            <ShieldAlert size={14} /> {isDdosSimulating ? 'Bursting...' : 'Simulate DDoS Burst'}
          </button>
          
          {(ddosBlockedCount > 0 || ddosSuccessCount > 0) && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8, fontSize: 11 }}>
              <div className="flex justify-between mb-1" style={{ color: 'var(--text-light)', fontWeight: 500 }}>
                <span>DDoS Burst Defense Stats</span>
                <span style={{ color: 'var(--crimson)' }}>{ddosBlockedCount} Blocked</span>
              </div>
              <div className="progress-bar-container" style={{ height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${(ddosBlockedCount / (ddosBlockedCount + ddosSuccessCount)) * 100}%`, 
                    background: 'var(--crimson)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <div className="flex justify-between text-muted" style={{ fontSize: 10 }}>
                <span>Allowed: {ddosSuccessCount}</span>
                <span>Defense Rate: {Math.round((ddosBlockedCount / (ddosBlockedCount + ddosSuccessCount)) * 100)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Simulation Stats & Logs */}
      {simulatedRides.length > 0 && (
        <div className="card" style={{ background: 'rgba(255,255,255,0.01)', padding: 12 }}>
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontSize: 12, fontWeight: 600 }}>Active Simulated Ride Pipeline</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Total: {simulatedRides.length} | Matched: {simulatedRides.filter(r => r.driverId).length}/5
            </span>
          </div>

          <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {simulatedRides.map((ride) => (
              <div 
                key={ride.id} 
                className="flex items-center justify-between"
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: 8, 
                  background: 'rgba(255,255,255,0.02)', 
                  borderLeft: `3px solid ${ride.driverId ? 'var(--emerald)' : 'var(--amber)'}`
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: '500' }}>
                    Passenger: <code style={{ color: 'var(--violet)' }}>{ride.passengerId}</code>
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    {ride.pickupAddress} ➔ {ride.dropAddress}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {ride.driverId && (
                    <span style={{ fontSize: 10, color: 'var(--emerald)' }}>
                      Driver: <code>{ride.driverId}</code>
                    </span>
                  )}
                  <span className={`badge ${getStatusBadgeClass(ride.status)}`} style={{ fontSize: 9, padding: '2px 6px' }}>
                    {ride.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactional Outbox & Kafka Queue Visualizer */}
      {simulatedRides.length > 0 && (
        <div className="card" style={{ background: 'rgba(0,0,0,0.2)', padding: 16, marginTop: 12, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <style>{`
            @keyframes driftRight {
              0% { transform: translateX(-3px); opacity: 0.3; }
              50% { transform: translateX(3px); opacity: 1; }
              100% { transform: translateX(-3px); opacity: 0.3; }
            }
            .drift-arrow {
              font-size: 14px;
              color: var(--text-muted);
              animation: driftRight 1.5s infinite linear;
            }
          `}</style>
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-light)' }}>Kafka Transactional Outbox Pipeline</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Real-Time Event Log</span>
          </div>

          <div className="flex items-center justify-between gap-2" style={{ padding: '8px 0' }}>
            {/* Step 1: DB Outbox Table */}
            <div className="flex-1 flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, textAlign: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--violet)', marginBottom: 6 }}>1. MySQL DB Outbox</span>
              <div style={{ display: 'flex', gap: 4, height: 16, alignItems: 'center' }}>
                {simulatedRides.map((ride) => {
                  const isPending = ride.status === 'REQUESTED' && !ride.driverId;
                  return (
                    <div 
                      key={ride.id} 
                      className={isPending ? 'anim-pulse' : ''}
                      style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: 3, 
                        background: isPending ? 'var(--violet)' : 'rgba(255,255,255,0.1)',
                        transition: 'all 0.5s ease'
                      }} 
                      title={ride.passengerId}
                    />
                  );
                })}
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 8 }}>
                {simulatedRides.filter(r => r.status === 'REQUESTED' && !r.driverId).length} Pending
              </span>
            </div>

            {/* Event Flow Arrow */}
            <div className="drift-arrow">➔</div>

            {/* Step 2: Kafka Broker */}
            <div className="flex-1 flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, textAlign: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--amber)', marginBottom: 6 }}>2. Kafka Topics</span>
              <div style={{ display: 'flex', gap: 4, height: 16, alignItems: 'center' }}>
                {simulatedRides.map((ride) => {
                  const inTransit = ride.status === 'MATCHING';
                  return (
                    <div 
                      key={ride.id} 
                      className={inTransit ? 'anim-pulse' : ''}
                      style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: 3, 
                        background: inTransit ? 'var(--amber)' : ride.driverId ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                        transition: 'all 0.5s ease'
                      }} 
                    />
                  );
                })}
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 8 }}>
                {simulatedRides.filter(r => r.status === 'MATCHING').length} In-Flight
              </span>
            </div>

            {/* Event Flow Arrow */}
            <div className="drift-arrow">➔</div>

            {/* Step 3: Matching Service (Consumes & Pairs) */}
            <div className="flex-1 flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, textAlign: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--emerald)', marginBottom: 6 }}>3. Match Dispatched</span>
              <div style={{ display: 'flex', gap: 4, height: 16, alignItems: 'center' }}>
                {simulatedRides.map((ride) => {
                  const isMatched = !!ride.driverId || ride.status === 'COMPLETED';
                  const isFailed = ride.status === 'CANCELLED';
                  return (
                    <div 
                      key={ride.id} 
                      style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: 3, 
                        background: isMatched ? 'var(--emerald)' : isFailed ? 'var(--crimson)' : 'rgba(255,255,255,0.05)',
                        transition: 'all 0.5s ease'
                      }} 
                    />
                  );
                })}
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 8 }}>
                {simulatedRides.filter(r => r.driverId || r.status === 'COMPLETED').length} Matched
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoSimulatorPanel;
