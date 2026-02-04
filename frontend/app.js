const API = "http://127.0.0.1:8000";

async function uploadAsset() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) {
    alert("Select a file first");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API}/asset/upload`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  document.getElementById("uploadResult").textContent =
    JSON.stringify(data, null, 2);
}

async function analyzeAI() {
  const downloads = document.getElementById("downloads").value;
  const ipcount = document.getElementById("ipcount").value;

  const res = await fetch(
    `${API}/ai/analyze?downloads=${downloads}&ip_count=${ipcount}`,
    { method: "POST" }
  );

  const data = await res.json();
  document.getElementById("aiResult").textContent =
    JSON.stringify(data, null, 2);
}

async function checkBlockchain() {
  const res = await fetch(`${API}/blockchain/status`);
  const data = await res.json();

  document.getElementById("bcStatus").textContent =
    JSON.stringify(data, null, 2);
}
