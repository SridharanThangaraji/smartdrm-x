document.addEventListener("DOMContentLoaded", async () => {
    try {
        const userId = API.token ? API.token.split(":")[0] : null;

        const [stats, analysis, logs] = await Promise.all([
            userId ? API.getDashboardStats().catch(() => null) : null,
            userId ? API.getRiskAnalysis(userId).catch(() => null) : null,
            API.getLogs().catch(() => [])
        ]);

        updateRiskDisplay(analysis || stats);
        renderLogs(logs || []);
        renderChart();
    } catch (error) {
        console.error("AI Analytics Error:", error);
        document.getElementById("risk-score-display").textContent = "—";
        document.getElementById("logs-body").innerHTML = `<tr><td colspan="4" class="text-center error-msg">Failed to load</td></tr>`;
    }
});

function updateRiskDisplay(data) {
    const scoreEl = document.getElementById("risk-score-display");
    const reasonsEl = document.getElementById("risk-reasons");

    const level = data?.risk_level || "LOW";
    const score = data?.risk_score != null ? data.risk_score : null;
    const reasons = data?.reasons || [];

    scoreEl.textContent = score != null ? score : level;
    scoreEl.title = "Risk level: " + level;

    if (level === "HIGH") scoreEl.style.color = "var(--danger)";
    else if (level === "MEDIUM") scoreEl.style.color = "var(--warning)";
    else scoreEl.style.color = "var(--success)";

    if (reasons.length) {
        reasonsEl.innerHTML = "<p style='margin-bottom:6px; font-size:11px; text-transform:uppercase; color: var(--text-secondary);'>Factors</p><ul>" +
            reasons.map(r => "<li>" + escapeHtml(r) + "</li>").join("") + "</ul>";
    } else {
        reasonsEl.innerHTML = "<p style='color: var(--text-secondary);'>No notable factors in the last 24h.</p>";
    }
}

function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
}

function formatDetails(details) {
    if (details == null) return "—";
    if (typeof details === "object") return JSON.stringify(details);
    try {
        const o = JSON.parse(details);
        return typeof o === "object" ? JSON.stringify(o) : details;
    } catch (_) {
        return details;
    }
}

function renderLogs(logs) {
    const tbody = document.getElementById("logs-body");
    if (!logs || logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--text-secondary);">No recent audit events.</td></tr>`;
        return;
    }

    tbody.innerHTML = logs.slice(0, 15).map(log => {
        const time = log.timestamp ? new Date(log.timestamp).toLocaleString() : "—";
        const severity = getSeverity(log.event_type);
        return `<tr>
            <td>${escapeHtml(time)}</td>
            <td>${escapeHtml(log.event_type || "—")}</td>
            <td><span class="mono" style="font-size:12px;">${escapeHtml(formatDetails(log.details))}</span></td>
            <td><span class="badge badge-${severity}">${severity}</span></td>
        </tr>`;
    }).join("");
}

function getSeverity(type) {
    if (!type) return "info";
    if (type.includes("DENIED") || type.includes("REVOKED")) return "danger";
    if (type.includes("LICENSE") || type.includes("GRANT")) return "warning";
    return "info";
}

function renderChart() {
    const canvas = document.getElementById("activity-chart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    new Chart(ctx, {
        type: "line",
        data: {
            labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
            datasets: [{
                label: "Access requests",
                data: [12, 19, 3, 5, 2, 3],
                borderColor: "#3b82f6",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: "#334155" }, ticks: { color: "#94a3b8" } },
                x: { grid: { color: "#334155" }, ticks: { color: "#94a3b8" } }
            }
        }
    });
}
