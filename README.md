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

### Quick start (run both from project root)
```bash
# From project root: install deps then run backend + frontend together
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
- **Backend**: http://127.0.0.1:8000  
- **Frontend**: http://127.0.0.1:5173 (redirects to login)  
- Stop with `Ctrl+C`.

Options: `python run.py --backend-only` or `python run.py --frontend-only` to run a single part.

### Backend-only setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r app/requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend-only (Vanilla JS)
From project root after starting the backend (or use `run.py --frontend-only`):
```bash
cd frontend && python3 -m http.server 5173
```
Open [http://localhost:5173](http://localhost:5173); you are redirected to `pages/login.html`.

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
- [**How it works end-to-end**](docs/HOW_IT_WORKS.md) – User journeys, data flow, APIs, and how to run
- [Architecture Overview](docs/architecture.md)
- [Manual testing checklist](docs/manual_testing.md)
- [API docs (Swagger)](http://127.0.0.1:8000/docs) when the backend is running
