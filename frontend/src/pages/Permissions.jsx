import { useState } from "react";
import { issueLicense } from "../services/api";

export default function Permissions() {
  const [form, setForm] = useState({
    asset_id: "",
    user_address: "",
    expiry_time: "",
    access_limit: "",
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    const res = await issueLicense({
      asset_id: Number(form.asset_id),
      user_address: form.user_address,
      expiry_time: Number(form.expiry_time),
      access_limit: Number(form.access_limit),
    });
    setResult(res);
  };

  return (
    <div className="card">
      <h2>Grant License</h2>

      <input name="asset_id" placeholder="Asset ID" onChange={handleChange} />
      <input
        name="user_address"
        placeholder="User Address (0x...)"
        onChange={handleChange}
      />
      <input
        name="expiry_time"
        placeholder="Expiry Time (epoch)"
        onChange={handleChange}
      />
      <input
        name="access_limit"
        placeholder="Access Limit"
        onChange={handleChange}
      />

      <button className="btn-primary" onClick={submit}>
        Issue License
      </button>

      {result && (
        <pre style={{ marginTop: 16 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

