document.addEventListener("DOMContentLoaded", () => {
    loadAssets();
});

async function loadAssets() {
    const tbody = document.getElementById("assets-body");
    try {
        const owned = await API.getOwnedAssets();

        if (owned.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary)">No assets found.</td></tr>`;
            return;
        }

        tbody.innerHTML = owned.map(item => `
            <tr>
                <td>${item.filename}</td>
                <td><span class="mono">${item.asset_hash.substring(0, 12)}...</span></td>
                <td>${new Date(item.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-sm btn-primary" onclick="window.openGrantModal('${item.id}')">Grant License</button>
                </td>
            </tr>
        `).join("");

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="error-msg">Failed to load assets: ${error.message}</td></tr>`;
    }
}

// Global scope for onclick
window.openGrantModal = (assetId) => {
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
