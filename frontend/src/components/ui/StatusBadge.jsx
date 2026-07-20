import { RIDE_STATUSES } from '../../constants/rideStatuses';

const StatusBadge = ({ status, size = 'md' }) => {
  const config = RIDE_STATUSES[status] || RIDE_STATUSES['REQUESTED'];
  const sizeClass = size === 'lg' ? 'text-sm px-4 py-2' : 'text-xs px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border font-semibold ${config.bg} ${config.color} ${sizeClass}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
