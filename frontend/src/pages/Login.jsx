export default function Login() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#0f172a",
      color: "white"
    }}>
      <div style={{
        width: 320,
        background: "#020617",
        padding: 24,
        borderRadius: 12,
        border: "1px solid #1e293b"
      }}>
        <h2 style={{ marginBottom: 20 }}>SmartDRM-X Login</h2>

        <input placeholder="Username" />
        <input placeholder="Role (admin / creator / user)" />

        <button className="btn-primary" style={{ width: "100%" }}>
          Login
        </button>
      </div>
    </div>
  );
}

