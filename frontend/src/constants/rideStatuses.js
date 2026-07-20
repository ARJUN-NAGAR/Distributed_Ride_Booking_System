export const RIDE_STATUSES = {
  REQUESTED: {
    label: 'Requested',
    description: 'Your ride request is submitted',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    dot: 'bg-amber-400',
    step: 0,
  },
  MATCHING: {
    label: 'Matching',
    description: 'Finding the best driver for you',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/30',
    dot: 'bg-violet-400',
    step: 1,
  },
  DRIVER_REVIEWING: {
    label: 'Driver Reviewing',
    description: 'Driver is reviewing your request...',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    dot: 'bg-amber-400',
    step: 2,
  },
  ACCEPTED: {
    label: 'Accepted',
    description: 'Driver has accepted your ride',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    dot: 'bg-emerald-400',
    step: 3,
  },
  DRIVER_ARRIVING: {
    label: 'Driver Arriving',
    description: 'Driver is on the way to your location',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    dot: 'bg-emerald-400',
    step: 4,
  },
  RIDE_STARTED: {
    label: 'Ride Started',
    description: 'You are on your way',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/30',
    dot: 'bg-violet-400',
    step: 5,
  },
  COMPLETED: {
    label: 'Completed',
    description: 'Ride completed successfully',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    dot: 'bg-emerald-400',
    step: 6,
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Ride was cancelled',
    color: 'text-crimson-400',
    bg: 'bg-crimson-500/10 border-crimson-500/30',
    dot: 'bg-crimson-400',
    step: -1,
  },
  FAILED: {
    label: 'Failed',
    description: 'No driver found — ride auto-cancelled',
    color: 'text-crimson-400',
    bg: 'bg-crimson-500/10 border-crimson-500/30',
    dot: 'bg-crimson-400',
    step: -1,
  },
};

export const RIDE_STEPS = [
  'REQUESTED',
  'MATCHING',
  'DRIVER_REVIEWING',
  'ACCEPTED',
  'DRIVER_ARRIVING',
  'RIDE_STARTED',
  'COMPLETED',
];

export const TERMINAL_STATES = ['COMPLETED', 'CANCELLED', 'FAILED'];

export const KAFKA_TOPICS = [
  { topic: 'ride.requested', color: 'text-amber-400' },
  { topic: 'ride.matched', color: 'text-emerald-400' },
  { topic: 'ride.matching-failed', color: 'text-crimson-400' },
];
