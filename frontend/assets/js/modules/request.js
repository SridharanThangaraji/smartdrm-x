document.addEventListener("DOMContentLoaded", () => {
    loadIncoming();
    loadCatalog();
    loadMine();
});

function esc(s) {
    if (s == null) return "";
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
}

function formatDate(v) {
    if (!v) return "—";
    try {
        const d = typeof v === "string" ? new Date(v) : v;
        return isNaN(d.getTime()) ? v : d.toLocaleString();
    } catch (_) { return v; }
}

async function loadIncoming() {
    const tbody = document.getElementById("incoming-body");
    try {
        const list = await API.getIncomingRequests();
        if (!list || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: var(--text-secondary);">No pending requests for your content.</td></tr>`;
            return;
        }
        tbody.innerHTML = list.map(({ request_id, asset, requester_username, message, created_at }) => `
            <tr>
                <td>${esc(asset?.filename)}</td>
                <td>${esc(requester_username)}</td>
                <td>${esc(message || "—")}</td>
                <td>${formatDate(created_at)}</td>
                <td>
                    <button type="button" class="btn-sm btn-primary" data-approve="${request_id}">Approve</button>
                    <button type="button" class="btn-sm btn-secondary" data-deny="${request_id}" style="margin-left:6px">Deny</button>
                </td>
            </tr>
        `).join("");
        tbody.querySelectorAll("[data-approve]").forEach(btn => {
            btn.addEventListener("click", () => approve(parseInt(btn.dataset.approve, 10)));
        });
        tbody.querySelectorAll("[data-deny]").forEach(btn => {
            btn.addEventListener("click", () => deny(parseInt(btn.dataset.deny, 10)));
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center error-msg">${esc(e.message)}</td></tr>`;
    }
}

function approve(requestId) {
    const days = prompt("License duration (days):", "7");
    const limit = prompt("Access limit (downloads):", "10");
    if (days == null || limit == null) return;
    API.approveRequest(requestId, parseInt(days, 10) || 7, parseInt(limit, 10) || 10)
        .then(() => { alert("Request approved. The user can now download from Shared with me."); loadIncoming(); loadMine(); })
        .catch(err => alert("Error: " + err.message));
}

function deny(requestId) {
    if (!confirm("Deny this access request?")) return;
    API.denyRequest(requestId)
        .then(() => { alert("Request denied."); loadIncoming(); loadMine(); })
        .catch(err => alert("Error: " + err.message));
}

async function loadCatalog() {
    const tbody = document.getElementById("catalog-body");
    try {
        const list = await API.getCatalog();
        if (!list || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center" style="color: var(--text-secondary);">No requestable assets. Assets that admins or other owners have uploaded will appear here so you can request access.</td></tr>`;
            return;
        }
        tbody.innerHTML = list.map(({ asset, owner_username }) => `
            <tr>
                <td>${esc(asset?.filename)}</td>
                <td>${esc(owner_username)}</td>
                <td>
                    <button type="button" class="btn-sm btn-primary" data-asset-id="${asset?.id}">Request access</button>
                </td>
            </tr>
        `).join("");
        tbody.querySelectorAll("[data-asset-id]").forEach(btn => {
            btn.addEventListener("click", () => requestAccess(parseInt(btn.dataset.assetId, 10)));
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center error-msg">${esc(e.message)}</td></tr>`;
    }
}

function requestAccess(assetId) {
    const message = prompt("Optional message to the owner (e.g. purpose):", "");
    if (message === null) return;
    API.createAccessRequest(assetId, message || null)
        .then(() => { alert("Request sent. The owner can approve or deny from this page."); loadCatalog(); loadMine(); })
        .catch(err => alert("Error: " + err.message));
}

async function loadMine() {
    const tbody = document.getElementById("mine-body");
    try {
        const list = await API.getMyRequests();
        if (!list || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--text-secondary);">You haven’t sent any requests yet.</td></tr>`;
            return;
        }
        tbody.innerHTML = list.map(({ asset, owner_username, status, created_at }) => {
            let badge = "badge-info";
            if (status === "approved") badge = "badge-success";
            if (status === "denied") badge = "badge-danger";
            return `
            <tr>
                <td>${esc(asset?.filename)}</td>
                <td>${esc(owner_username)}</td>
                <td><span class="badge ${badge}">${esc(status)}</span></td>
                <td>${formatDate(created_at)}</td>
            </tr>
        `;
        }).join("");
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center error-msg">${esc(e.message)}</td></tr>`;
    }
}
