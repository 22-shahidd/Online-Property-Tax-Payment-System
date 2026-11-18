import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Landmark, LogOut, BarChart3, Receipt, Users, ShieldCheck, Settings2, Home, Building2, CreditCard, FileText, ClipboardList, Search, WalletCards } from "lucide-react";

// Sidebar shows navigation links based on the user's role
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation links for each role
  const links = {
    admin: [
      { to: "/admin/dashboard", label: "Overview", icon: BarChart3 },
      { to: "/admin/reports", label: "Payment Reports", icon: Receipt },
      { to: "/admin/users", label: "Manage Users", icon: Users },
      { to: "/admin/officers", label: "Add Officer", icon: ShieldCheck },
      { to: "/admin/rates", label: "Tax Rates", icon: Settings2 },
    ],
    officer: [
      { to: "/officer/dashboard", label: "Overview", icon: BarChart3 },
      { to: "/officer/verify", label: "Verify Properties", icon: ClipboardList },
      { to: "/officer/search", label: "Search Properties", icon: Search },
      { to: "/officer/payment", label: "Offline Payment", icon: WalletCards },
      { to: "/officer/grievances", label: "Grievances", icon: FileText },
    ],
    citizen: [
      { to: "/citizen/dashboard", label: "My Dashboard", icon: Home },
      { to: "/citizen/add-property", label: "Add Property", icon: Building2 },
      { to: "/citizen/pay-tax", label: "Pay Property Tax", icon: CreditCard },
      { to: "/citizen/grievances", label: "My Grievances", icon: FileText },
    ],
  };

  const roleLabel = {
    admin: "Municipal Admin",
    officer: "Ward Officer",
    citizen: "Citizen Portal",
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="side-brand">
        <span className="brand-mark">
          <Landmark size={21} />
        </span>
        <div>
          <b>Nagarpalika</b>
          <small>Property tax portal</small>
        </div>
      </div>

      {/* Role badge */}
      <div className="role-switch">
        <span className="avatar small">{user.name.charAt(0).toUpperCase()}</span>
        <div>
          <b>{roleLabel[user.role]}</b>
          <small>Signed in</small>
        </div>
      </div>

      {/* Navigation links */}
      <nav>
        <p className="nav-label">Workspace</p>
        {links[user.role].map((link) => {
          const Icon = link.icon;
          return (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? "active" : "")}>
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="side-bottom">
        {/* <div className="help-card">
          <p>Need assistance?</p>
          <span>Visit the citizen help desk for support.</span>
        </div> */}
        <button className="logout" onClick={logout}>
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </aside>
  );
}
