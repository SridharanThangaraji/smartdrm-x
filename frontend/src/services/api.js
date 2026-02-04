const API = "http://127.0.0.1:8000";

export async function uploadAsset(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API}/asset/upload`, {
    method: "POST",
    body: formData,
  });

  return res.json();
}

export async function issueLicense(data) {
  const res = await fetch("http://127.0.0.1:8000/asset/license/issue", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function analyzeAI(data) {
  const res = await fetch("http://127.0.0.1:8000/ai/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

