import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Assets from "./pages/Assets";
import Permissions from "./pages/Permissions";
import AIAnalytics from "./pages/AIAnalytics";
import AuditLogs from "./pages/AuditLogs";
import Admin from "./pages/Admin";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* App Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/permissions" element={<Permissions />} />
        <Route path="/ai" element={<AIAnalytics />} />
        <Route path="/audit" element={<AuditLogs />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}

