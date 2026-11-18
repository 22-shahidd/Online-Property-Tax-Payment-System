import React from "react";

// StatsCard is a small reusable card for showing a statistic
// Wrapped in React.memo so it only re-renders when props change
const StatsCard = React.memo(function StatsCard({ label, value, detail, icon: Icon, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
});

export default StatsCard;
