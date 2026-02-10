document.addEventListener("DOMContentLoaded", async () => {
    try {
        const stats = await API.getDashboardStats();

        document.getElementById("stat-assets").innerText = stats.total_assets || 0;
        document.getElementById("stat-licenses").innerText = stats.active_licenses || 0;

        const riskEl = document.getElementById("stat-risk");
        riskEl.innerText = stats.risk_level || "Low";

        if (stats.risk_level === "High") riskEl.style.color = "var(--danger)";
        else if (stats.risk_level === "Medium") riskEl.style.color = "var(--warning)";
        else riskEl.style.color = "var(--success)";

    } catch (error) {
        console.error("Dashboard Load Error:", error);
    }
});
