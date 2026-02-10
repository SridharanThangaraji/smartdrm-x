// Main Dashboard Logic

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    loadUserProfile();
    loadView("dashboard"); // Default view

    // Logout
    document.getElementById("logout-btn").addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "index.html";
    });
});

function checkAuth() {
    if (!localStorage.getItem("token")) {
        window.location.href = "index.html";
    }
}

function loadUserProfile() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    document.getElementById("display-username").innerText = user.username || "Guest";
    document.getElementById("display-role").innerText = user.role || "Researcher";
    document.getElementById("user-avatar").innerText = (user.username || "U")[0].toUpperCase();
}

// Router
async function loadView(viewName) {
    // Update Sidebar
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    const activeNav = document.querySelector(`[data-view='${viewName}']`);
    if (activeNav) activeNav.classList.add("active");

    const contentArea = document.getElementById("content-area");
    contentArea.innerHTML = '<div class="loading-spinner">Loading Data...</div>';

    try {
        if (viewName === "dashboard") await renderDashboard(contentArea);
        else if (viewName === "assets") await renderAssets(contentArea);
        else if (viewName === "upload") await renderUpload(contentArea);
        else if (viewName === "ai") await renderAI(contentArea);
    } catch (e) {
        contentArea.innerHTML = `<div class="error-msg">Error loading view: ${e.message}</div>`;
    }
}

// ---------------- VIEWS ---------------- //

async function renderDashboard(container) {
    const stats = await API.getDashboardStats();

    container.innerHTML = `
        <h1 class="page-title">Executive Dashboard</h1>
        <div class="grid grid-cols-4">
            <div class="card stat-card">
                <div class="label">Total Assets</div>
                <div class="value">${stats.total_assets || 0}</div>
            </div>
            <div class="card stat-card">
                <div class="label">Active Licenses</div>
                <div class="value">${stats.active_licenses || 0}</div>
            </div>
            <div class="card stat-card">
                <div class="label">Threat Level</div>
                <div class="value">${stats.risk_level || "Low"}</div>
            </div>
            <div class="card stat-card">
                <div class="label">System Status</div>
                <div class="value" style="color: var(--success)">Online</div>
            </div>
        </div>
        
        <div class="grid grid-cols-2" style="margin-top: 32px">
             <div class="card">
                <h2>Quick Actions</h2>
                <div style="display: flex; gap: 16px;">
                    <button class="btn btn-primary" onclick="loadView('upload')">Upload Asset</button>
                    <button class="btn btn-primary" onclick="loadView('assets')" style="background: var(--bg-card); border: 1px solid var(--border-color)">Manage Assets</button>
                </div>
             </div>
        </div>
    `;
}

async function renderAssets(container) {
    const owned = await API.getOwnedAssets();

    let html = `
        <h1 class="page-title">Asset Repository</h1>
        <div class="card">
            <h2>My Uploaded Assets</h2>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Filename</th>
                            <th>Hash (Blockchain)</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    if (owned.length === 0) {
        html += `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary)">No assets found.</td></tr>`;
    } else {
        owned.forEach(item => {
            html += `
                <tr>
                    <td>${item.filename}</td>
                    <td><span class="mono">${item.asset_hash.substring(0, 12)}...</span></td>
                    <td>${new Date(item.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn-sm btn-primary" onclick="window.openGrantModal('${item.id}')">Grant License</button>
                    </td>
                </tr>
            `;
        });
    }

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

async function renderUpload(container) {
    container.innerHTML = `
        <h1 class="page-title">Secure Upload</h1>
        <div class="card" style="max-width: 600px; margin: 0 auto;">
            <h2>Upload New Asset</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                Files are automatically encrypted with AES-256 before storage. A hash is generated and stored on the Ethereum blockchain.
            </p>
            <form id="upload-form">
                <div class="upload-zone" id="drop-zone">
                    <input type="file" id="file-input" required style="display: none">
                    <div style="padding: 40px; border: 2px dashed var(--border-color); border-radius: 8px; text-align: center; cursor: pointer;"
                         onclick="document.getElementById('file-input').click()">
                        <div style="font-size: 32px; margin-bottom: 12px;">📄</div>
                        <span id="file-label">Click to select file</span>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 20px;">Encrypt & Upload</button>
            </form>
        </div>
    `;

    const fileInput = document.getElementById("file-input");
    fileInput.addEventListener("change", (e) => {
        if (e.target.files[0]) {
            document.getElementById("file-label").innerText = e.target.files[0].name;
        }
    });

    document.getElementById("upload-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        if (!file) { alert("Please select a file"); return; }

        const btn = e.target.querySelector("button");
        btn.innerText = "Processing...";
        btn.disabled = true;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await API.uploadAsset(formData);
            alert(`Success! Asset Hash: ${res.asset_hash}`);
            loadView("assets");
        } catch (err) {
            alert("Upload Failed: " + err.message);
        } finally {
            btn.innerText = "Encrypt & Upload";
            btn.disabled = false;
        }
    });
}

async function renderAI(container) {
    const userId = JSON.parse(localStorage.getItem("user")).id;
    const stats = await API.getDashboardStats();

    container.innerHTML = `
        <h1 class="page-title">AI Analytics</h1>
        <div class="grid grid-cols-2">
            <div class="card">
                <h2>Risk Analysis</h2>
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; font-weight: 700; color: ${getRiskColor(stats.risk_level)}">
                        ${stats.risk_level}
                    </div>
                    <p>Current Threat Score</p>
                </div>
            </div>
            <div class="card">
                 <h2>Activity Log</h2>
                 <p>Monitoring user behavior for anomalies...</p>
                 <div id="activity-chart"></div> 
            </div>
        </div>
    `;
}

function getRiskColor(level) {
    if (level === "High") return "var(--danger)";
    if (level === "Medium") return "var(--warning)";
    return "var(--success)";
}

// Modals
window.openGrantModal = (assetId) => {
    // Simple alert implementation for prototype speed
    const username = prompt("Enter recipient username:");
    if (!username) return;

    const days = prompt("License duration (days):", "7");
    const limit = prompt("Access limit (count):", "10");

    if (username && days && limit) {
        API.grantLicense({
            asset_id: parseInt(assetId),
            user_username: username,
            expiry_days: parseInt(days),
            access_limit: parseInt(limit)
        }).then(() => {
            alert("License issued on blockchain!");
        }).catch(err => {
            alert("Error: " + err.message);
        });
    }
};
