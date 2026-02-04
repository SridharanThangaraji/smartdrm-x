import { useState } from "react";
import { uploadAsset } from "../services/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    const res = await uploadAsset(file);
    setResult(res);
  };

  return (
    <div className="card">
      <h2>Upload Asset</h2>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <button className="btn-primary" onClick={handleUpload}>
        Upload & Register
      </button>

      {result && (
        <div style={{ marginTop: 12 }}>
          <p>Asset Hash: {result.asset_hash}</p>
          <p>TX Hash: {result.tx_hash}</p>
        </div>
      )}
    </div>
  );
}

