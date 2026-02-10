document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Load Stats
        const stats = await API.getDashboardStats();
        updateRiskDisplay(stats.risk_level);

        // Load Logs
        const logs = await API.getLogs();
        renderLogs(logs);

        // Render Chart (Mock data for now if API doesn't provide time-series)
        // In a real scenario, we'd fetch historical activity
        renderChart();

    } catch (error) {
        console.error("AI Analytics Error:", error);
    }
});

function updateRiskDisplay(level) {
    const el = document.getElementById("risk-score-display");
    el.innerText = level || "Low";

    if (level === "High") el.style.color = "var(--danger)";
    else if (level === "Medium") el.style.color = "var(--warning)";
    else el.style.color = "var(--success)";
}

function renderLogs(logs) {
    const tbody = document.getElementById("logs-body");
    if (!logs || logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center">No recent security events.</td></tr>`;
        return;
    }

    // Sort by new
    // logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    tbody.innerHTML = logs.slice(0, 10).map(log => `
        <tr>
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td>${log.event_type}</td>
            <td>${typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}</td>
            <td><span class="badge badge-${getSeverity(log.event_type)}">${getSeverity(log.event_type)}</span></td>
        </tr>
    `).join("");
}

function getSeverity(type) {
    if (type.includes("DENIED") || type.includes("HIGH")) return "danger";
    if (type.includes("GRANT")) return "warning";
    return "info";
}

function renderChart() {
    const ctx = document.getElementById('activity-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
            datasets: [{
                label: 'Access Requests',
                data: [12, 19, 3, 5, 2, 3], // Mock data
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { grid: { color: '#334155' } },
                x: { grid: { color: '#334155' } }
            }
        }
    });
}
