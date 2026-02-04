import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2>SmartDRM-X</h2>
      <ul>
        <NavItem to="/dashboard" label="Dashboard" />
        <NavItem to="/assets" label="Assets" />
        <NavItem to="/upload" label="Upload" />
        <NavItem to="/permissions" label="Permissions" />
        <NavItem to="/ai" label="AI Analytics" />
        <NavItem to="/audit" label="Audit Logs" />
        <NavItem to="/admin" label="Admin" />
      </ul>
    </div>
  );
}

function NavItem({ to, label }) {
  return (
    <li>
      <NavLink
        to={to}
        style={({ isActive }) => ({
          color: isActive ? "white" : "#94a3b8",
          fontWeight: isActive ? "600" : "400",
          textDecoration: "none",
        })}
      >
        {label}
      </NavLink>
    </li>
  );
}

