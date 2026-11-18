import { useAuth } from "../hooks/useAuth.js";
import { Bell, ChevronDown } from "lucide-react";

// Topbar shows the page header, notifications, and user info
export default function Topbar() {
  const { user } = useAuth();

  const roleLabel = {
    admin: "Administration",
    officer: "Ward Operations",
    citizen: "My Account",
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      <div className="crumb">
        <span>Municipal services</span>
        <b>/</b>
        <strong>{roleLabel[user.role]}</strong>
      </div>
      <div className="top-actions">
        <button className="icon-button">
          <Bell size={19} />
          <i />
        </button>
        <div className="user-menu">
          <span className="avatar">{initials}</span>
          <div>
            <b>{user.name}</b>
            <small>{user.role}</small>
          </div>
          <ChevronDown size={15} />
        </div>
      </div>
    </header>
  );
}
