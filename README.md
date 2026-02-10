# SmartDRM-X: Blockchain & AI-Powered Digital Rights Management

SmartDRM-X is a research-grade decentralized platform for managing digital rights, ensuring secure asset distribution, and analyzing user behavior for piracy detection.

## 🚀 Key Features

- **Decentralized Asset Registration**: Assets are hashed and registered on an Ethereum-compatible blockchain (Ganache).
- **AES-128 Encryption**: Assets are encrypted upon upload and only decrypted for authorized users.
- **Institutional Licensing**: Support for individual and group-based access control.
- **AI Behavioral Analysis**: Detects abnormal access patterns, high-frequency downloads, and piracy risks.
- **Immutable Audit Logs**: All critical actions (Access, Grant, Revoke) are cryptographically logged.

## 🛠 Tech Stack

- **Frontend**: Vanilla JS, HTML, CSS, Chart.js
- **Backend**: FastAPI (Python), SQLAlchemy, SQLite
- **Blockchain**: Multi-chain support (Ethereum/Polygon) for tamper-proof licensing.
- **AI Analytics**: Deep learning models for user behavior analysis and risk scoring.
- **Security**: Robust AES-256-GCM encryption for assets and BCrypt hashing for credentials.
- **Frontend**: Lightweight, high-performance Vanilla JavaScript architecture.

## 📦 Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js
- Ganache (GUI or CLI) running on port `7545`

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Frontend (Vanilla JS)
Since the frontend is now pure HTML/JS, you can serve it using any static file server.

1.  **Navigate to frontend directory**:
    ```bash
    cd frontend
    ```
2.  **Start a simple HTTP server**:
    ```bash
    python3 -m http.server 5173
    ```
3.  **Access the App**:
    Open [http://localhost:5173](http://localhost:5173) in your browser.
    You will be automatically redirected to `pages/login.html`.

## 🧪 Testing

### API Tests
See `tests/api_test_flow.sh` for a curl-based test sequence.

### Manual Verification
1. Register/Login as a "Creator".
2. Upload a file via the "Upload" page. Verify the "Asset Hash" and "TX Hash".
3. Go to "Assets" -> "My Uploads" and click "Grant License" to another user.
4. Login as the other user.
5. Go to "Assets" -> "Shared With Me" and download the file.
6. Check "AI Analytics" for risk scores based on download activity.

## 📚 Documentation
- [Architecture Overview](docs/architecture.md)
- [API Documentation](http://127.0.0.1:8000/docs)
