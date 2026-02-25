document.addEventListener("DOMContentLoaded", async () => {
    const statAssets = document.getElementById("stat-assets");
    const statLicenses = document.getElementById("stat-licenses");
    const statRisk = document.getElementById("stat-risk");

    try {
        const stats = await API.getDashboardStats();
        statAssets.textContent = stats.total_assets ?? 0;
        statLicenses.textContent = stats.active_licenses ?? 0;

        const level = (stats.risk_level || "LOW").toUpperCase();
        statRisk.textContent = level.charAt(0) + level.slice(1).toLowerCase();

        if (level === "HIGH") statRisk.style.color = "var(--danger)";
        else if (level === "MEDIUM") statRisk.style.color = "var(--warning)";
        else statRisk.style.color = "var(--success)";
    } catch (error) {
        console.error("Dashboard Load Error:", error);
        statAssets.textContent = "—";
        statLicenses.textContent = "—";
        statRisk.textContent = "—";
        statRisk.style.color = "var(--text-secondary)";
    }
});
