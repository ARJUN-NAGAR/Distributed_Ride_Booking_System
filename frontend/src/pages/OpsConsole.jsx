import { BarChart3 } from 'lucide-react';
import NearbyDriversTable from '../components/ops/NearbyDriversTable';
import SurgePricingCalculator from '../components/ops/SurgePricingCalculator';
import EventStreamLog from '../components/ops/EventStreamLog';
import ServiceHealthPanel from '../components/ops/ServiceHealthPanel';
import GlobalFleetMap from '../components/ops/GlobalFleetMap';
import DemoSimulatorPanel from '../components/ops/DemoSimulatorPanel';

const OpsConsole = () => {
    return (
        <div className="stack anim-fade-up">
            <div className="page-header">
                <div className="page-title-row">
                    <div className="page-icon-wrap" style={{ background: 'linear-gradient(135deg, var(--amber-dim), var(--violet-dim))' }}>
                        <BarChart3 size={20} className="text-amber" />
                    </div>
                    <h1 className="page-title">Ops Console</h1>
                </div>
                <p className="page-sub">Live system telemetry · Kafka events · Service health</p>
            </div>

            <DemoSimulatorPanel />

            <div className="grid-2">
                <ServiceHealthPanel />
                <SurgePricingCalculator />
            </div>
            
            <GlobalFleetMap />

            <NearbyDriversTable />

            <EventStreamLog />
        </div>
    );
};

export default OpsConsole;