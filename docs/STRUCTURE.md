# SmartDRM-X Directory Structure

Clean layout after cleanup. Use **root `.venv`** and **`python run.py`** from project root.

```
SmartDRM-X/
├── .venv/                 # Python virtualenv (create with python -m venv .venv)
├── .gitignore
├── run.py                 # Single entry: starts backend + frontend
├── requirements.txt      # Python deps (root; for run.py)
├── README.md
├── docs/
│   ├── STRUCTURE.md      # This file
│   ├── HOW_IT_WORKS.md
│   ├── architecture.md
│   ├── conference_paper.md
│   ├── conference_paper.pdf
│   ├── conference_paper_full.html
│   └── ...
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI app
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── create_default_user.py
│   │   ├── auth/         # Auth routes
│   │   ├── asset/        # Asset + license routes, storage/
│   │   │   └── storage/  # Encrypted .enc files (gitignored)
│   │   ├── blockchain/   # Web3 + contract interface
│   │   ├── drm/          # AES-GCM encryption
│   │   ├── ai_engine/    # Risk + dashboard
│   │   └── utils/        # Audit logger, helpers
│   ├── app/requirements.txt
│   └── smartdrm.db       # SQLite (gitignored; created at runtime)
├── frontend/
│   ├── index.html        # Redirects to pages/login.html
│   ├── pages/            # login, register, dashboard, upload, assets, ai
│   └── assets/
│       ├── css/
│       └── js/           # api, auth, components, modules/
├── blockchain/           # Solidity contracts, ABI (optional)
└── tests/
```

**Do not commit:** `.venv/`, `__pycache__/`, `backend/smartdrm.db`, `backend/secret.key`, `backend/app/asset/storage/*.enc`.
