import React from "react";

// StatusBadge shows a colored badge based on the status text
// Wrapped in React.memo because it is a simple presentational component
const StatusBadge = React.memo(function StatusBadge({ status }) {
  // Convert status to a CSS-friendly class name
  const tone = status.toLowerCase().replace(/_/g, "-");

  // Map of status to display label
  const labels = {
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
    unpaid: "Unpaid",
    paid: "Paid",
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    active: "Active",
    inactive: "Inactive",
    online: "Online",
    offline: "Offline",
  };

  return <span className={`status status-${tone}`}>{labels[status] || status}</span>;
});

export default StatusBadge;
