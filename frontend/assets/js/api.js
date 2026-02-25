const API_BASE_URL = "http://127.0.0.1:8000";

class API {
    static get token() {
        return localStorage.getItem("token");
    }

    static get headers() {
        const h = {
            "Content-Type": "application/json"
        };
        if (this.token) {
            h["Authorization"] = `Bearer ${this.token}`;
        }
        return h;
    }

    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: this.headers,
            ...options
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 401) {
                localStorage.clear();
                const text = await response.text();
                let errBody = {};
                try { errBody = JSON.parse(text); } catch (_) {}
                const msg = errBody.detail || "Invalid credentials or session expired";
                const errMsg = typeof msg === "string" ? msg : (Array.isArray(msg) ? msg.map(m => m.msg || m).join(", ") : "Unauthorized");
                if (!window.location.pathname.endsWith("login.html")) {
                    window.location.href = "login.html";
                }
                throw new Error(errMsg);
            }

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse JSON. Raw response:", text);
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
            }

            if (!response.ok) {
                const msg = Array.isArray(data.detail) ? data.detail.map(d => d.msg || d).join(", ") : (data.detail || "API Request Failed");
                throw new Error(msg);
            }
            return data;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    // Auth
    static async login(username, password) {
        // Form encoded for OAuth2 standard, but our backend accepts JSON
        return this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });
    }

    static async register(username, password, role) {
        return this.request("/auth/register", {
            method: "POST",
            body: JSON.stringify({ username, password, role })
        });
    }

    static async getMe() {
        return this.request("/auth/me");
    }

    // Assets
    static async getOwnedAssets() {
        return this.request("/asset/list");
    }

    static async getSharedAssets() {
        return this.request("/asset/list/shared");
    }

    static async uploadAsset(formData) {
        const h = {};
        if (this.token) h["Authorization"] = `Bearer ${this.token}`;

        const response = await fetch(`${API_BASE_URL}/asset/upload`, {
            method: "POST",
            headers: h,
            body: formData
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.detail || (Array.isArray(data.detail) ? data.detail.map(d => d.msg || d).join(", ") : "Upload failed"));
        }
        return data;
    }

    static async grantLicense(data) {
        return this.request("/asset/license/issue", {
            method: "POST",
            body: JSON.stringify(data)
        });
    }

    static async downloadAsset(assetHash, filename) {
        const response = await fetch(`${API_BASE_URL}/asset/download/${assetHash}`, {
            headers: this.token ? { "Authorization": `Bearer ${this.token}` } : {}
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || "Download failed");
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "download";
        a.click();
        URL.revokeObjectURL(url);
    }

    // Request for access (catalog, request, approve, deny)
    static async getCatalog() {
        return this.request("/asset/catalog");
    }
    static async createAccessRequest(assetId, message) {
        return this.request("/asset/request", {
            method: "POST",
            body: JSON.stringify({ asset_id: assetId, message: message || null })
        });
    }
    static async getMyRequests() {
        return this.request("/asset/requests/mine");
    }
    static async getIncomingRequests() {
        return this.request("/asset/requests/incoming");
    }
    static async approveRequest(requestId, expiryDays, accessLimit) {
        return this.request(`/asset/request/${requestId}/approve`, {
            method: "POST",
            body: JSON.stringify({ expiry_days: expiryDays || 7, access_limit: accessLimit || 10 })
        });
    }
    static async denyRequest(requestId) {
        return this.request(`/asset/request/${requestId}/deny`, { method: "POST" });
    }

    // AI
    static async getDashboardStats() {
        // Using "me" endpoint or specific stats endpoint if available
        // Based on previous code, there was `ai.getDashboardStats`
        // Let's assume `/ai/dashboard/$user_id`
        // We'll fix this in implementation
        const userId = this.token.split(':')[0];
        return this.request(`/ai/dashboard/${userId}`);
    }

    static async getRiskAnalysis(userId) {
        const id = userId || this.token?.split(":")[0];
        return this.request(`/ai/analyze/${id}`);
    }

    // Audit
    static async getLogs() {
        return this.request("/audit/logs");
    }
}
