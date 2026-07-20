import { Car, RefreshCw } from 'lucide-react';
import BookingForm from '../components/rider/BookingForm';
import RideStatusStepper from '../components/rider/RideStatusStepper';
import FareReceiptPanel from '../components/rider/FareReceiptPanel';
import RiderMap from '../components/rider/RiderMap';
import useRideStore from '../store/useRideStore';

const RiderPortal = () => {
    const { currentRide, resetRide } = useRideStore();

    return (
        <div className="stack anim-fade-up">
            <div className="flex items-center justify-between">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <div className="page-title-row">
                        <div className="page-icon-wrap" style={{ background: 'linear-gradient(135deg, var(--violet-dim), var(--emerald-dim))' }}>
                            <Car size={20} className="text-violet" />
                        </div>
                        <h1 className="page-title">Rider Portal</h1>
                    </div>
                    <p className="page-sub">Book and track your distributed ride in real-time</p>
                </div>
                {currentRide && (
                    <button onClick={resetRide} className="btn btn-ghost">
                        <RefreshCw size={14} />
                        New Ride
                    </button>
                )}
            </div>

            <RiderMap />

            <div className="grid-right-left" style={{ gridTemplateColumns: '2fr 1fr' }}>
                <div className="stack">
                    {!currentRide ? <BookingForm /> : <RideStatusStepper />}
                </div>

                <div className="stack">
                    {currentRide && <FareReceiptPanel />}
                    {!currentRide && (
                        <div className="card empty-state" style={{ height: '100%' }}>
                            <div className="page-icon-wrap" style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--violet-dim)' }}>
                                <Car size={28} className="text-violet" style={{ opacity: 0.6 }} />
                            </div>
                            <p className="empty-title">Book a ride to see fare details</p>
                            <p className="empty-desc">Pricing updates live based on demand and distance</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RiderPortal;