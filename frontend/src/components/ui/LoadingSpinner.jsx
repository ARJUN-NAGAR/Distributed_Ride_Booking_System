const LoadingSpinner = ({ size = 'md', color = 'violet' }) => {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  const colorMap = {
    violet: 'border-violet-500',
    emerald: 'border-emerald-500',
    amber: 'border-amber-500',
  };

  return (
    <div
      className={`${sizeMap[size]} border-2 ${colorMap[color]} border-t-transparent rounded-full animate-spin`}
    />
  );
};

export default LoadingSpinner;
