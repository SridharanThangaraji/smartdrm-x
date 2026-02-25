document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("file-input");
    const dropArea = document.getElementById("drop-area");
    const fileLabel = document.getElementById("file-label");

    function setFile(file) {
        if (file) {
            fileLabel.textContent = file.name;
            dropArea.classList.add("dragover");
            dropArea.style.borderColor = "var(--accent-blue)";
        } else {
            fileLabel.textContent = "Choose a file or drag it here";
            dropArea.classList.remove("dragover");
            dropArea.style.borderColor = "";
        }
    }

    if (dropArea) {
        dropArea.addEventListener("click", () => fileInput.click());
        dropArea.addEventListener("dragover", (e) => { e.preventDefault(); dropArea.classList.add("dragover"); });
        dropArea.addEventListener("dragleave", () => dropArea.classList.remove("dragover"));
        dropArea.addEventListener("drop", (e) => {
            e.preventDefault();
            dropArea.classList.remove("dragover");
            const file = e.dataTransfer?.files?.[0];
            if (file) {
                fileInput.files = e.dataTransfer.files;
                setFile(file);
            }
        });
    }

    fileInput.addEventListener("change", (e) => {
        setFile(e.target.files[0] || null);
    });

    document.getElementById("upload-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        if (!file) { alert("Please select a file."); return; }

        const btn = e.target.querySelector("button");
        const originalText = btn.textContent;
        btn.textContent = "Encrypting…";
        btn.disabled = true;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await API.uploadAsset(formData);
            alert("Upload complete.\nAsset hash: " + (res.asset_hash || "").slice(0, 16) + "…\nRegistered on-chain.");
            window.location.href = "assets.html";
        } catch (err) {
            alert("Upload failed: " + err.message);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
});
