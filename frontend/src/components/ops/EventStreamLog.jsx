import { Terminal, Trash2 } from 'lucide-react';
import useRideStore from '../../store/useRideStore';
import { KAFKA_TOPICS } from '../../constants/rideStatuses';

const getTopicVariant = (topic) => {
    const match = KAFKA_TOPICS.find((t) => t.topic === topic || topic.includes(t.topic.split('.')[1]));
    return match ? match.color.replace('text-', '').replace('-400', '') : 'muted';
};

const EventStreamLog = () => {
    const { eventLog, addEventLog } = useRideStore();

    const injectMockEvent = () => {
        const topics = ['ride.requested', 'ride.matched', 'ride.matching-failed'];
        const topic = topics[Math.floor(Math.random() * topics.length)];
        addEventLog(topic, { rideId: `mock-${Date.now().toString().slice(-6)}`, status: 'SIMULATED' });
    };

    return (
        <div className="card anim-fade-up">
            <div className="flex items-center justify-between mb-4" style={{ marginBottom: 16 }}>
                <div className="flex items-center gap-3">
                    <div className="card-icon" style={{ background: 'var(--violet-dim)' }}>
                        <Terminal size={16} className="text-violet" />
                    </div>
                    <div>
                        <h2 className="card-title">Kafka Event Stream</h2>
                        <p className="card-sub">ride.requested · ride.matched · ride.matching-failed</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={injectMockEvent} className="btn btn-ghost btn-sm" style={{ color: 'var(--violet)', borderColor: 'rgba(139,92,246,0.3)' }}>
                        + Inject Mock
                    </button>
                    <button
                        onClick={() => useRideStore.setState({ eventLog: [] })}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--text-muted)', padding: '6px 8px' }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="terminal">
                {eventLog.length === 0 ? (
                    <p className="text-muted" style={{ fontSize: 12, textAlign: 'center', paddingTop: 32 }}>
                        No events yet. Book a ride or inject a mock event.
                    </p>
                ) : (
                    eventLog.map((entry) => {
                        const variant = getTopicVariant(entry.topic);
                        return (
                            <div key={entry.id} className="terminal-line">
                                <span className="terminal-time">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                                <span className={`terminal-topic text-${variant}`}>{entry.topic}</span>
                                <span className="terminal-arrow">→</span>
                                <span className="terminal-data">{JSON.stringify(entry.data)}</span>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="flex gap-4 mt-3" style={{ marginTop: 12 }}>
                {KAFKA_TOPICS.map(({ topic, color }) => {
                    const variant = color.replace('text-', '').replace('-400', '');
                    return (
                        <div key={topic} className="flex items-center gap-2">
                            <span className="dot" style={{ background: `var(--${variant})`, width: 6, height: 6 }} />
                            <span className="text-muted" style={{ fontSize: 11 }}>{topic}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EventStreamLog;