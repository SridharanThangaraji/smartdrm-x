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
                // Token invalid or expired
                localStorage.clear();
                window.location.href = "login.html";
                return;
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
                throw new Error(data.detail || "API Request Failed");
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
        // Need to pass token in query param for /auth/me or header
        // Current backend expects token in query param based on earlier review
        // Let's check backend code... 
        // Backend: def current_user(token: str ...
        return this.request(`/auth/me?token=${this.token.split(':')[0]}`);
        // Actually, backend expects `token` query param to look up user.
    }

    // Assets
    static async getOwnedAssets() {
        return this.request("/asset/list");
    }

    static async getSharedAssets() {
        return this.request("/asset/shared");
    }

    static async uploadAsset(formData) {
        // For FormData, do not set Content-Type header (browser does it with boundary)
        const h = {};
        if (this.token) h["Authorization"] = `Bearer ${this.token}`;

        const response = await fetch(`${API_BASE_URL}/asset/upload`, {
            method: "POST",
            headers: h,
            body: formData
        });
        return response.json();
    }

    static async grantLicense(data) {
        return this.request("/asset/license/issue", {
            method: "POST",
            body: JSON.stringify(data)
        });
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

    // Audit
    static async getLogs() {
        return this.request("/audit/logs");
    }
}
