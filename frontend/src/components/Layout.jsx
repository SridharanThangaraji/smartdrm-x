import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="app">
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Topbar />
        <div className="main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}


