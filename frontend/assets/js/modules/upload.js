document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("file-input");

    fileInput.addEventListener("change", (e) => {
        if (e.target.files[0]) {
            document.getElementById("file-label").innerText = e.target.files[0].name;
            // Add visual feedback
            document.querySelector(".upload-zone div").style.borderColor = "var(--accent-blue)";
        }
    });

    document.getElementById("upload-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        if (!file) { alert("Please select a file"); return; }

        const btn = e.target.querySelector("button");
        const originalText = btn.innerText;
        btn.innerText = "Processing Encryption...";
        btn.disabled = true;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await API.uploadAsset(formData);
            alert(`Success! Asset Hash: ${res.asset_hash}\nTransaction verified on Blockchain.`);
            window.location.href = "assets.html";
        } catch (err) {
            alert("Upload Failed: " + err.message);
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });
});
