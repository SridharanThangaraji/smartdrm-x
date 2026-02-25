document.addEventListener("DOMContentLoaded", () => {
    loadOwnedAssets();
    loadSharedAssets();
});

function formatDate(value) {
    if (!value) return "—";
    try {
        const d = typeof value === "string" ? new Date(value) : value;
        return isNaN(d.getTime()) ? value : d.toLocaleDateString();
    } catch (_) {
        return value;
    }
}

function formatDateTime(value) {
    if (!value) return "—";
    try {
        const d = typeof value === "string" ? new Date(value) : value;
        return isNaN(d.getTime()) ? value : d.toLocaleString();
    } catch (_) {
        return value;
    }
}

async function loadOwnedAssets() {
    const tbody = document.getElementById("assets-body");
    try {
        const owned = await API.getOwnedAssets();

        if (!owned || owned.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--text-secondary)">No uploaded assets yet. <a href="upload.html">Upload your first asset</a>.</td></tr>`;
            return;
        }

        tbody.innerHTML = owned.map(item => `
            <tr>
                <td>${escapeHtml(item.filename || "—")}</td>
                <td><span class="mono">${escapeHtml((item.asset_hash || "").substring(0, 14))}…</span></td>
                <td>${formatDate(item.created_at)}</td>
                <td>
                    <button type="button" class="btn-sm btn-primary" data-asset-id="${item.id}">Grant license</button>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll("[data-asset-id]").forEach(btn => {
            btn.addEventListener("click", () => openGrantModal(btn.dataset.assetId));
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center error-msg">Failed to load: ${escapeHtml(error.message)}</td></tr>`;
    }
}

async function loadSharedAssets() {
    const tbody = document.getElementById("shared-body");
    try {
        const shared = await API.getSharedAssets();

        if (!shared || shared.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--text-secondary)">No assets shared with you yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = shared.map(({ asset, license }) => {
            const usesLeft = (license.access_limit != null && license.access_used != null)
                ? Math.max(0, license.access_limit - license.access_used)
                : "—";
            return `
            <tr>
                <td>${escapeHtml(asset?.filename || "—")}</td>
                <td>${usesLeft}</td>
                <td>${formatDateTime(license?.expires_at)}</td>
                <td>
                    <button type="button" class="btn-sm btn-primary" data-hash="${escapeHtml(asset?.asset_hash)}" data-filename="${escapeHtml(asset?.filename || "download")}">Download</button>
                </td>
            </tr>
        `;
        }).join("");

        tbody.querySelectorAll("[data-hash]").forEach(btn => {
            btn.addEventListener("click", () => {
                const hash = btn.dataset.hash;
                const filename = btn.dataset.filename;
                if (hash) API.downloadAsset(hash, filename).catch(err => alert("Download failed: " + err.message));
            });
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center error-msg">Failed to load: ${escapeHtml(error.message)}</td></tr>`;
    }
}

function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
}

function openGrantModal(assetId) {
    const username = prompt("Enter recipient username:");
    if (!username) return;

    const days = prompt("License duration (days):", "7");
    const limit = prompt("Access limit (downloads):", "10");

    if (username && days && limit) {
        API.grantLicense({
            asset_id: parseInt(assetId, 10),
            user_username: username.trim(),
            expiry_days: parseInt(days, 10) || 7,
            access_limit: parseInt(limit, 10) || 10
        }).then(() => {
            alert("License issued successfully.");
            loadSharedAssets();
        }).catch(err => {
            alert("Error: " + err.message);
        });
    }
}

window.openGrantModal = openGrantModal;
