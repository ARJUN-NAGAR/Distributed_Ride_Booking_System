const GlassCard = ({ children, className = '', glow = '' }) => {
  const glowClass = glow ? `glow-${glow}` : '';
  return (
    <div className={`glass-card p-5 ${glowClass} ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
