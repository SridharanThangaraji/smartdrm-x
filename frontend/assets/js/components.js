/**
 * Shared UI Components
 * Renders Sidebar and Topbar dynamically for consistency across pages.
 */

document.addEventListener("DOMContentLoaded", () => {
    renderSidebar();
    renderTopbar();
    checkAuthState();
    highlightActivePage();
});

function checkAuthState() {
    // Skip check for login/register pages
    if (window.location.pathname.includes("login.html") || window.location.pathname.includes("register.html")) return;

    if (!localStorage.getItem("token")) {
        window.location.href = "login.html";
    }
}

function renderSidebar() {
    const sidebarContainer = document.getElementById("sidebar-container");
    if (!sidebarContainer) return;

    const user = JSON.parse(localStorage.getItem("user") || '{"role": "user"}');
    const isAdmin = (user.role || "").toLowerCase() === "admin";

    const navItems = [
        '<div class="nav-label">Platform</div>',
        '<a href="dashboard.html" class="nav-item" data-page="dashboard"><span class="icon">📊</span> Dashboard</a>',
        '<a href="request.html" class="nav-item" data-page="request"><span class="icon">📋</span> Request Access</a>',
        '<a href="assets.html" class="nav-item" data-page="assets"><span class="icon">📦</span> Assets</a>'
    ];
    if (isAdmin) {
        navItems.push('<a href="upload.html" class="nav-item" data-page="upload"><span class="icon">☁️</span> Secure Upload</a>');
        navItems.push('<div class="nav-label">Intelligence</div>');
        navItems.push('<a href="ai.html" class="nav-item" data-page="ai"><span class="icon">🧠</span> AI Analytics</a>');
    }

    sidebarContainer.innerHTML = `
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo-small">S</div>
                <h2>SmartDRM-X</h2>
            </div>
            <nav class="sidebar-nav">
                ${navItems.join("\n                ")}
                <div class="nav-section-bottom">
                    <a href="#" id="logout-btn" class="nav-item logout">
                        <span class="icon">🚪</span> Terminate Session
                    </a>
                </div>
            </nav>
        </aside>
    `;

    document.getElementById("logout-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "login.html";
    });
}

function renderTopbar() {
    const topbarContainer = document.getElementById("topbar-container");
    if (!topbarContainer) return;

    const user = JSON.parse(localStorage.getItem("user") || '{"username": "Guest", "role": "Viewer"}');
    const initial = (user.username || "U")[0].toUpperCase();

    topbarContainer.innerHTML = `
        <header class="topbar">
            <div class="system-status">
                <span class="status-indicator"></span>
                System Operational
            </div>
            <div class="user-profile">
                <div class="user-info">
                    <span class="user-name">${user.username}</span>
                    <span class="user-role">${user.role}</span>
                </div>
                <div class="avatar">${initial}</div>
            </div>
        </header>
    `;
}

function highlightActivePage() {
    const path = window.location.pathname;
    let page = "dashboard";
    if (path.includes("assets")) page = "assets";
    if (path.includes("upload")) page = "upload";
    if (path.includes("request")) page = "request";
    if (path.includes("ai")) page = "ai";

    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add("active");
}
