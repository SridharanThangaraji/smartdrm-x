import StatCard from "../components/StatCard";

export default function Dashboard() {
  return (
    <>
      <h1>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
        <StatCard title="Assets" value="12" />
        <StatCard title="Licenses" value="38" />
        <StatCard title="AI Alerts" value="2" />
        <StatCard title="Blockchain" value="OK" />
      </div>
    </>
  );
}

