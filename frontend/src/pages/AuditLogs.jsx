import { useEffect, useState } from "react";

const severityColors = {
  LOW: "border-green-500 text-green-400",
  HIGH: "border-red-500 text-red-400",
  INFO: "border-blue-500 text-blue-400",
};

export default function Audit() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/audit/logs")
      .then(res => res.json())
      .then(setLogs);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Security Audit Logs</h1>

      <div className="space-y-4">
        {logs.map((log, i) => (
          <div
            key={i}
            className={`bg-slate-900 border-l-4 p-4 rounded ${severityColors[log.severity] || "border-slate-500"}`}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">
                {log.event.replace("_", " ")}
              </h3>
              <span className="text-xs opacity-70">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>

            <p className="text-sm text-slate-400">
              Actor: <span className="text-white">{log.actor}</span> ·
              Severity: <span className="font-semibold">{log.severity}</span>
            </p>

            <div className="mt-2 text-sm">
              {log.event === "AI_ANALYSIS" && (
                <>
                  <p>Downloads: {log.details.downloads}</p>
                  <p>IP Count: {log.details.ip_count}</p>
                  <p className="font-semibold">
                    Risk Level: {log.details.risk}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

