import { NavLink } from 'react-router-dom';
import { Car, Radio, BarChart3, Zap } from 'lucide-react';
import useDriverStore from '../../store/useDriverStore';

const navItems = [
  { to: '/', label: 'Rider Portal', desc: 'Book & track rides', icon: Car },
  { to: '/driver', label: 'Driver Simulator', desc: 'GPS telemetry', icon: Radio },
  { to: '/ops', label: 'Ops Console', desc: 'System monitoring', icon: BarChart3 },
];

const Sidebar = () => {
  const { isOnline } = useDriverStore();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Zap size={16} color="#fff" />
        </div>
        <div>
          <div className="brand-title">RideDispatch</div>
          <div className="brand-sub">Distributed System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, label, desc, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <div className="nav-icon-wrap">
                  <Icon size={15} color={isActive ? 'var(--violet)' : 'var(--text-muted)'} />
                </div>
                <div>
                  <div className="nav-label">{label}</div>
                  <div className="nav-desc">{desc}</div>
                </div>
                {isActive && <div className="nav-dot" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-pill">
          <div className="status-row">
            <div className={`dot ${isOnline ? 'dot-green' : 'dot-green'}`} />
            <span className="status-text">Services Active</span>
          </div>
          <div className="status-ports">:8082 · :8083 · :8084</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
