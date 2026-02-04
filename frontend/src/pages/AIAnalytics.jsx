import { useState } from "react";
import { analyzeAI } from "../services/api";

export default function AiAnalytics() {
  const [downloads, setDownloads] = useState("");
  const [ipCount, setIpCount] = useState("");
  const [result, setResult] = useState(null);

  const submit = async () => {
    const res = await analyzeAI({
      downloads: Number(downloads),
      ip_count: Number(ipCount),
    });
    setResult(res.analysis_result);
  };

  const getColor = () => {
    if (!result) return "#64748b";
    if (result === "low") return "#22c55e";
    if (result === "medium") return "#facc15";
    return "#ef4444";
  };

  return (
    <div className="card">
      <h2>AI Usage Analysis</h2>

      <input
        placeholder="Download Count"
        value={downloads}
        onChange={(e) => setDownloads(e.target.value)}
      />

      <input
        placeholder="Unique IP Count"
        value={ipCount}
        onChange={(e) => setIpCount(e.target.value)}
      />

      <button className="btn-primary" onClick={submit}>
        Analyze
      </button>

      {result && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            backgroundColor: getColor(),
            color: "black",
            fontWeight: 600,
          }}
        >
          Risk Level: {result.toUpperCase()}
        </div>
      )}
    </div>
  );
}

