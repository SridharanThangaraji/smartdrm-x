# SmartDRM-X: Blockchain & AI-Powered Digital Rights Management

SmartDRM-X is a research-grade, decentralized platform for managing digital rights and licensing of digital assets. It combines **AES-256-GCM encryption**, **Ethereum smart contracts**, and an **AI-driven behavioral analytics engine** to provide end-to-end secure content distribution with tamper-proof audit trails.

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [System Architecture](#system-architecture)
4. [Full Pipeline](#full-pipeline)
5. [Module Reference](#module-reference)
6. [Database Schema](#database-schema)
7. [Smart Contract](#smart-contract)
8. [AI Analytics Engine](#ai-analytics-engine)
9. [Audit Log System](#audit-log-system)
10. [Installation](#installation)
11. [Usage — Full User Journey](#usage--full-user-journey)
12. [API Reference](#api-reference)
13. [Testing](#testing)
14. [Configuration & Environment](#configuration--environment)
15. [Docker](#docker)
16. [Project Structure](#project-structure)
17. [Tech Stack](#tech-stack)
18. [Academic Context](#academic-context)

---

## Overview

SmartDRM-X addresses the problem of unenforceable digital rights management in conventional systems. The core thesis: every significant DRM action — asset registration, license issuance, license revocation — must be immutably recorded on-chain, and every consumer interaction must be continuously scored for anomalous behavior that signals piracy risk.

The system implements three distinct concerns as separate, composable layers:

| Layer | Concern | Technology |
|---|---|---|
| **Security** | Encrypt assets at rest, authenticate users | AES-256-GCM, BCrypt |
| **Trust** | Immutable proof-of-ownership and licensing | Ethereum / Solidity |
| **Intelligence** | Behavioral monitoring and piracy risk scoring | Rule-based AI engine |

These layers are exposed through a **FastAPI** REST backend and a lightweight **Vanilla JS** frontend dashboard.

---

## Key Features

- **AES-256-GCM Asset Encryption** — every uploaded file is encrypted with authenticated encryption before being written to disk; the nonce is prepended to the ciphertext (format: `[12-byte nonce][ciphertext+tag]`).
- **Blockchain-Anchored Registration** — asset SHA-256 hashes and license transactions are submitted to the `SmartDRMX` Solidity contract on Ganache, returning verifiable transaction hashes stored in the database.
- **Graceful Mock Mode** — if Ganache is unreachable, the system automatically falls back to mock transaction hashes so the full workflow remains testable without a live blockchain.
- **Dual-Mode Licensing** — licenses can be issued to individual users or to institutional groups; download authorization checks both.
- **Access Request Workflow** — users can browse a catalog of assets and submit access requests; creators approve or deny them to produce licenses.
- **AI Risk Scoring** — a four-signal rule engine evaluates every user's last 24 hours of activity and returns a score (0–100) and level (LOW / MEDIUM / HIGH).
- **Immutable Audit Log** — every sensitive event is written to an `audit_logs` table with a JSON detail blob and UTC timestamp.
- **Interactive Dashboard** — Chart.js-powered frontend with pages for login, registration, upload, asset management, license requests, and AI analytics.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER / FRONTEND                           │
│                    Vanilla JS  •  Chart.js  •  HTML5                │
│  pages: login  register  dashboard  upload  assets  request  ai     │
└────────────────────────────┬────────────────────────────────────────┘
                             │  HTTP / REST  (port 5173 → 8000)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FastAPI BACKEND  :8000                         │
│                                                                     │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │
│  │  /auth      │  │  /asset          │  │  /ai                   │ │
│  │  register   │  │  upload          │  │  analyze/{user_id}     │ │
│  │  login      │  │  download        │  │  dashboard/stats       │ │
│  │  /me        │  │  list/owned      │  │  dashboard/{user_id}   │ │
│  └──────┬──────┘  │  list/shared     │  └──────────┬─────────────┘ │
│         │         │  license/issue   │             │               │
│         │         │  license/revoke  │             │               │
│         │         │  groups/create   │             │               │
│         │         │  groups/add_user │             │               │
│         │         │  catalog         │             │               │
│         │         │  request         │             │               │
│         │         │  request/approve │             │               │
│         │         │  request/deny    │             │               │
│         │         └────────┬─────────┘             │               │
│         │                  │                        │               │
│  ┌──────▼──────────────────▼────────────────────────▼────────────┐ │
│  │                    Core Services Layer                         │ │
│  │                                                                │ │
│  │  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐  │ │
│  │  │  DRM Engine  │  │  Blockchain      │  │  AI Engine       │  │ │
│  │  │  encryption  │  │  web3_client     │  │  features        │  │ │
│  │  │  AES-256-GCM │  │  contract_iface  │  │  detector        │  │ │
│  │  │  license_mgr │  │  SmartDRMX.sol   │  │  model           │  │ │
│  │  └──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘  │ │
│  │         │                   │                      │            │ │
│  │  ┌──────▼──────┐  ┌─────────▼──────────┐          │            │ │
│  │  │  secret.key │  │  Ganache / Mock     │          │            │ │
│  │  │  (AES key)  │  │  (port 7545/8545)   │          │            │ │
│  │  └─────────────┘  └────────────────────┘          │            │ │
│  │                                                    │            │ │
│  │  ┌──────────────────────────────────────────────── ▼──────────┐ │ │
│  │  │  SQLAlchemy ORM  →  SQLite  (smartdrm.db)                  │ │ │
│  │  │  tables: users  assets  licenses  audit_logs               │ │ │
│  │  │          groups  user_groups  access_requests              │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Utils: audit_logger  •  helpers  •  logger                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │    Filesystem Storage        │
              │  backend/app/asset/storage/  │
              │  <asset_hash>.enc  (binary)  │
              └─────────────────────────────┘
```

---

## Full Pipeline

The complete lifecycle of a digital asset from upload to access-controlled download, including all cross-cutting concerns:

### Step 1 — Authentication

A user registers with a `username`, `password`, and `role` (`creator`, `user`, or `admin`). The password is hashed with **BCrypt** (salt rounds via `bcrypt.gensalt()`) before storage. Login returns a bearer token of the form `{user_id}:{username}`. All subsequent API calls carry this token in the `Authorization: Bearer` header.

### Step 2 — Asset Upload & Encryption

```
Client uploads file
        │
        ▼
[backend] read raw bytes
        │
        ▼
encrypt_data(bytes)
  ├─ generate 12-byte random nonce (os.urandom)
  └─ AES-256-GCM.encrypt(nonce, plaintext, aad=None)
     → ciphertext_with_tag
  → stored blob = nonce(12 B) || ciphertext_with_tag
        │
        ▼
SHA-256 hash of encrypted blob  →  asset_hash (hex string)
        │
        ▼
write  storage/<asset_hash>.enc
        │
        ▼
register_asset_on_chain(asset_hash)
  ├─ calls SmartDRMX.registerAsset(hash, transferable=True)
  └─ returns tx_hash  (or "0x_mock_registration_success" if offline)
        │
        ▼
INSERT INTO assets (filename, asset_hash, tx_hash, owner_id)
        │
        ▼
log_event("ASSET_UPLOADED", {...})
```

The SHA-256 hash is computed over the **encrypted** blob, not the plaintext, which means the hash acts as a content-addressed identifier for the ciphertext. Duplicate detection uses this hash.

### Step 3 — Blockchain Registration

The `SmartDRMX` Solidity contract (deployed to Ganache) stores an `Asset` struct on-chain:

```solidity
struct Asset {
    address owner;
    string  assetHash;
    uint256 createdAt;
    bool    transferable;
}
```

The `registerAsset` function emits an `AssetRegistered(assetId, owner, assetHash)` event. The returned transaction hash is persisted in the `assets.tx_hash` column, providing immutable, verifiable proof of registration timestamp.

### Step 4 — License Issuance

The asset owner calls `POST /asset/license/issue` specifying either a `user_username` (individual license) or `group_id` (institutional license), plus `expiry_days` and `access_limit`. The backend:

1. Verifies the requester owns the asset.
2. Resolves the target user ID (if individual).
3. Computes `expires_at = utcnow + expiry_days`.
4. Calls `issue_license_on_chain(asset_id, user_address, expiry_timestamp, access_limit)` on the smart contract.
5. Stores a `License` row linking the asset, grantee, expiry, and tx_hash.
6. Emits `LICENSE_ISSUED` to the audit log.

The on-chain `License` struct mirrors this:

```solidity
struct License {
    uint256 expiryTime;
    uint256 accessLimit;
    uint256 accessUsed;
    bool    active;
}
```

### Step 5 — Access Request Workflow (Optional Path)

Instead of a creator proactively issuing licenses, a consumer can:

1. Browse `GET /asset/catalog` — lists all assets not owned by the caller and not already licensed.
2. Submit `POST /asset/request` with `asset_id` and an optional message.
3. The creator sees the pending request via `GET /asset/requests/incoming`.
4. Creator calls `POST /asset/request/{id}/approve` (auto-creates a license) or `POST /asset/request/{id}/deny`.

### Step 6 — Download & Decryption

```
GET /asset/download/{asset_hash}
        │
        ▼
fetch Asset record by hash
        │
        ▼
if caller is NOT owner:
  ├─ get all group memberships for caller
  ├─ query License WHERE:
  │    asset_id = asset.id
  │    active = True
  │    expires_at > now
  │    access_used < access_limit
  │    (user_id = caller.id  OR  group_id IN caller_groups)
  └─ if no valid license → 403 + log ASSET_ACCESS_DENIED
        │
        ▼
license.access_used += 1  →  commit
        │
        ▼
read storage/<asset_hash>.enc
        │
        ▼
decrypt_data(blob)
  ├─ nonce = blob[:12]
  └─ AES-256-GCM.decrypt(nonce, blob[12:], aad=None)
     → plaintext bytes
        │
        ▼
log_event("ASSET_ACCESSED", {...})
        │
        ▼
return Response(plaintext, Content-Disposition: attachment)
```

### Step 7 — AI Behavioral Analysis & Risk Scoring

After download events accumulate in the audit log, any admin (or the user themselves) can request a risk analysis via `GET /ai/analyze/{user_id}`. The engine runs a three-stage pipeline:

```
extract_features(user_id)
  ├─ query audit_logs WHERE user_id=X AND timestamp > (now - 24h)
  ├─ downloads_24h    = COUNT(ASSET_ACCESSED)
  ├─ denied_24h       = COUNT(ASSET_ACCESS_DENIED)
  ├─ unique_assets_24h = COUNT(distinct asset_hash in JSON details)
  └─ unique_ips_24h   = COUNT(distinct ip_address in JSON details)

        │
        ▼

detect_anomaly(features)
  ├─ Rule 1: downloads_24h > 50  → +40 pts  "High download volume"
  │          downloads_24h > 20  → +20 pts  "Moderate download volume"
  ├─ Rule 2: denied_24h > 5      → +30 pts  "Multiple access denials"
  ├─ Rule 3: unique_assets > 15  → +20 pts  "Accessing many different assets"
  └─ Rule 4: unique_ips > 3      → +25 pts  "Multiple IP addresses used"

        │
        ▼

risk_score = min(sum, 100)
risk_level = HIGH (≥70) | MEDIUM (≥30) | LOW (<30)
```

---

## Module Reference

### `backend/app/main.py`

Application entry point. Initializes the FastAPI instance, registers CORS middleware (open in research mode), mounts the three routers under `/auth`, `/asset`, and `/ai`, and seeds default users on startup.

Key endpoints registered directly here:
- `GET /` — health check
- `GET /audit/logs` — fetch the 100 most-recent audit events

### `backend/app/auth/auth_routes.py`

Handles registration, login, and the `get_current_user` dependency injected across all protected routes.

- **`UserRegister`** — Pydantic model: `username`, `password`, `role` (default `"user"`).
- **`UserLogin`** — Pydantic model: `username`, `password`.
- **`get_current_user()`** — Parses `Authorization: Bearer {user_id}:{username}`, resolves the integer user ID, and returns the `User` ORM object. Returns HTTP 401 for malformed or nonexistent tokens.
- Passwords are hashed with `bcrypt.hashpw` and verified with `bcrypt.checkpw`.

### `backend/app/asset/asset_routes.py`

The largest module. Manages the entire asset lifecycle.

| Function | Purpose |
|---|---|
| `upload_asset()` | Encrypts, stores, hashes, registers on-chain, seeds DB record |
| `issue_license()` | Validates ownership, creates License, calls contract |
| `download_asset()` | Authorizes via ownership or valid license, decrypts, streams |
| `list_owned_assets()` | Returns assets owned by current user |
| `list_shared_assets()` | Returns assets licensed to current user (individual or group) |
| `revoke_license()` | Sets `license.active = False` |
| `create_group()` | Creates a named Group with current user as admin |
| `add_user_to_group()` | Adds a member to an admin-owned group |
| `list_requestable_assets()` | Catalog: assets the user can request |
| `create_access_request()` | Submits a pending access request |
| `list_my_requests()` | Shows requester's own request history |
| `list_incoming_requests()` | Shows creator's pending inbound requests |
| `approve_access_request()` | Approves request + issues license atomically |
| `deny_access_request()` | Marks request denied |

Helper functions `_get_group_ids_for_user`, `_get_asset_or_404`, `_find_valid_license`, and `_load_and_decrypt_from_storage` are extracted to keep route handlers concise.

### `backend/app/drm/encryption.py`

Wraps Python's `cryptography` library's `AESGCM` for AES-256-GCM.

- On first run, generates a 32-byte key and writes it to `secret.key`.
- Subsequent runs load the persisted key.
- **`encrypt_data(data)`** — prepends a fresh 12-byte random nonce to the ciphertext+tag.
- **`decrypt_data(data)`** — slices the nonce from `data[:12]` and decrypts `data[12:]`.

> **Production note**: In a production deployment, the key should be stored in a hardware security module (HSM) or secrets vault (e.g., HashiCorp Vault, AWS KMS) rather than a local file.

### `backend/app/drm/license_manager.py`

Utility helper that constructs an in-memory license descriptor dict. Used internally for defaults:

```python
generate_license(days=7, access_limit=5)
# → { issued_at, expires_at, access_limit, access_used, active }
```

### `backend/app/blockchain/web3_client.py`

Initializes a `Web3` connection to `http://127.0.0.1:8545` (Ganache default). If connection fails, replaces `web3.eth` with a `MagicMock` so the rest of the backend continues to function. This is the **mock mode** that keeps the system fully testable offline.

### `backend/app/blockchain/contract_interface.py`

High-level wrapper over the `SmartDRMX` Solidity contract.

- Loads the compiled ABI from `blockchain/contracts/SmartDRMX_ABI.json`.
- Hardcodes the deployed contract address (`0x609A56CbBf4Ec216b62243Ecad64E8824d4b1C50`) — update this after redeployment.
- **`register_asset_on_chain(asset_hash)`** — calls `registerAsset(hash, transferable=True)`, waits for receipt, returns the tx hash hex string.
- **`issue_license_on_chain(asset_id, user_address, expiry_timestamp, access_limit)`** — calls `issueLicense(...)` with 3,000,000 gas, returns tx hash.
- All exceptions fall back to mock hash strings (`0x_mock_registration_success`, `0x_mock_license_success`).

### `backend/app/ai_engine/`

Three-file pipeline:

| File | Responsibility |
|---|---|
| `features.py` | Queries audit_logs table; extracts 4 behavioral signals over the last 24 h |
| `detector.py` | Applies rule-based scoring to feature dict; returns score, level, reasons |
| `model.py` | Thin orchestrator: calls `extract_features` then `detect_anomaly` |
| `routes.py` | FastAPI router exposing `/ai/analyze/{user_id}` and `/ai/dashboard/stats` |

### `backend/app/utils/audit_logger.py`

- **`log_event(event_type, details_dict)`** — opens its own DB session, persists an `AuditLog` row, closes session. Thread-safe for concurrent requests.
- **`get_logs()`** — returns the 100 most-recent logs ordered by `timestamp DESC`.

### `backend/app/models.py`

SQLAlchemy ORM definitions for all seven tables (see [Database Schema](#database-schema)).

### `backend/app/database.py`

Configures the SQLite engine (`smartdrm.db` relative to the backend working directory), `SessionLocal` factory, and the `get_db` FastAPI dependency.

### `backend/app/create_default_user.py`

Seeds two users at startup if they do not exist:

| Username | Password | Role |
|---|---|---|
| `admin` | `admin` | `admin` |
| `demo` | `demo` | `user` |

If the admin account exists but has a non-BCrypt password (legacy plain text), it is automatically upgraded.

### `run.py`

Single entry point that launches both servers as subprocesses:

```
python run.py                  # starts backend :8000 + frontend :5173
python run.py --backend-only   # starts only FastAPI
python run.py --frontend-only  # starts only the static file server
```

Uses `subprocess.Popen` with `sys.stdout`/`sys.stderr` passthrough. Registers `SIGINT`/`SIGTERM` handlers to cleanly terminate both processes. Prints a runtime summary on startup including blockchain connectivity status.

---

## Database Schema

All tables are managed by SQLAlchemy and automatically created on startup via `Base.metadata.create_all(bind=engine)`.

```
users
  id              INTEGER  PK
  username        TEXT     UNIQUE
  hashed_password TEXT
  role            TEXT     default="user"  -- "creator" | "user" | "admin"

assets
  id              INTEGER  PK
  owner_id        INTEGER  FK → users.id
  filename        TEXT
  asset_hash      TEXT     UNIQUE INDEX    -- SHA-256 of encrypted blob
  tx_hash         TEXT                    -- blockchain transaction hash
  encryption_key_id TEXT                  -- reserved for key rotation
  created_at      DATETIME default=utcnow

licenses
  id              INTEGER  PK
  asset_id        INTEGER  FK → assets.id
  user_id         INTEGER  FK → users.id   NULLABLE  (null for group licenses)
  group_id        INTEGER  FK → groups.id  NULLABLE  (null for individual licenses)
  tx_hash         TEXT                    -- blockchain transaction hash
  expires_at      DATETIME
  access_limit    INTEGER
  access_used     INTEGER  default=0
  active          BOOLEAN  default=True

audit_logs
  id              INTEGER  PK
  event_type      TEXT                    -- see Audit Log Events table
  details         TEXT                    -- JSON blob
  timestamp       DATETIME default=utcnow
  user_id         INTEGER  FK → users.id  NULLABLE

groups
  id              INTEGER  PK
  name            TEXT     UNIQUE
  admin_id        INTEGER  FK → users.id

user_groups
  id              INTEGER  PK
  user_id         INTEGER  FK → users.id
  group_id        INTEGER  FK → groups.id

access_requests
  id              INTEGER  PK
  asset_id        INTEGER  FK → assets.id
  requester_id    INTEGER  FK → users.id
  status          TEXT     default="pending"  -- "pending" | "approved" | "denied"
  message         TEXT     NULLABLE
  created_at      DATETIME default=utcnow
  resolved_at     DATETIME NULLABLE
```

---

## Smart Contract

The Solidity contract lives at `blockchain/contracts/SmartDRMX.sol` and targets Solidity `^0.8.20`.

### Contract: `SmartDRMX`

**State variables**

```solidity
uint256 public assetCount;
mapping(uint256 => Asset) public assets;
mapping(uint256 => mapping(address => License)) public licenses;
```

**Functions**

| Function | Modifier | Description |
|---|---|---|
| `registerAsset(hash, transferable)` | `public` | Increments `assetCount`, stores Asset struct, emits `AssetRegistered` |
| `issueLicense(assetId, user, expiry, limit)` | `public` | Requires `msg.sender == asset.owner`; stores License struct, emits `LicenseIssued` |
| `requestAccess(assetId)` | `public` | Validates license validity, increments `accessUsed`, emits `AccessGranted` |
| `transferOwnership(assetId, newOwner)` | `public` | Requires owner + `transferable==true`; updates `asset.owner`, emits `OwnershipTransferred` |

**Events**

```solidity
event AssetRegistered(uint256 assetId, address owner, string assetHash);
event LicenseIssued(uint256 assetId, address user);
event AccessGranted(uint256 assetId, address user);
event OwnershipTransferred(uint256 assetId, address newOwner);
```

The compiled ABI is at `blockchain/contracts/SmartDRMX_ABI.json`. The contract is deployed to Ganache at the address hardcoded in `contract_interface.py`. After redeployment update `CONTRACT_ADDRESS` in that file.

---

## AI Analytics Engine

### Design Philosophy

The AI engine deliberately uses an interpretable rule-based approach rather than a black-box ML model. This is appropriate for a research prototype where **explainability** (which rules fired and why) is as important as detection accuracy. The engine can be extended to a trained anomaly-detection model (e.g., Isolation Forest via scikit-learn, which is already in `requirements.txt`) without changing the interface.

### Feature Extraction (`features.py`)

Opens a fresh database session and aggregates the last 24 hours of audit log entries for the target user:

| Feature | Source query |
|---|---|
| `downloads_24h` | `COUNT(*)` of `ASSET_ACCESSED` events |
| `denied_24h` | `COUNT(*)` of `ASSET_ACCESS_DENIED` events |
| `unique_assets_24h` | Distinct `asset_hash` values parsed from JSON detail blobs |
| `unique_ips_24h` | Distinct `ip_address` values from JSON detail blobs (populated when IP capture is enabled) |

### Anomaly Detection Rules (`detector.py`)

```
Signal                    Threshold    Score    Reason
─────────────────────────────────────────────────────
downloads_24h             > 50         +40      High download volume
downloads_24h             > 20         +20      Moderate download volume
denied_24h                > 5          +30      Multiple access denials
unique_assets_24h         > 15         +20      Accessing many different assets
unique_ips_24h            > 3          +25      Multiple IP addresses used
─────────────────────────────────────────────────────
Risk level:  score ≥ 70 → HIGH  |  score ≥ 30 → MEDIUM  |  < 30 → LOW
Maximum capped at 100.
```

### API Response

```json
{
  "risk_score": 65,
  "risk_level": "MEDIUM",
  "reasons": [
    "Moderate download volume",
    "Multiple access denials"
  ]
}
```

### Dashboard Stats (`/ai/dashboard/stats`)

Returns KPIs for the current user (or any user if caller is admin):

```json
{
  "total_assets": 12,
  "active_licenses": 5,
  "risk_level": "LOW"
}
```

---

## Audit Log System

Every security-significant event produces an `AuditLog` row via `log_event()`. The logger opens its own SQLAlchemy session (not the request-scoped session) to ensure events are committed even if the outer transaction rolls back.

### Event Types

| Event Type | Trigger |
|---|---|
| `ASSET_UPLOADED` | Successful upload; includes `filename`, `asset_hash`, `encryption: AES-256-GCM`, `user_id` |
| `ASSET_ACCESSED` | Successful authorized download; includes `asset_hash`, `user_id` |
| `ASSET_ACCESS_DENIED` | Download attempt with no valid license; includes `asset_hash`, `user_id` |
| `LICENSE_ISSUED` | License created by owner; includes `asset_id`, `tx_hash` |
| `LICENSE_REVOKED` | License deactivated; includes `license_id` |
| `ACCESS_REQUESTED` | User submits access request; includes `asset_id`, `requester_id`, `request_id` |
| `ACCESS_REQUEST_APPROVED` | Owner approves request; includes `request_id`, `license_id` |
| `ACCESS_REQUEST_DENIED` | Owner denies request; includes `request_id` |

### Retrieving Logs

```bash
curl http://127.0.0.1:8000/audit/logs
```

Returns up to 100 most-recent entries in descending chronological order. Each entry:

```json
{
  "id": 42,
  "event_type": "ASSET_ACCESSED",
  "details": "{\"asset_hash\": \"ab12...\", \"user_id\": 3}",
  "timestamp": "2025-05-17T10:23:44",
  "user_id": 3
}
```

The AI feature extractor parses the `details` JSON column to compute per-user behavioral signals.

---

## Installation

### Prerequisites

| Requirement | Notes |
|---|---|
| Python 3.9+ | 3.10 or 3.11 recommended |
| pip / venv | Standard library |
| Ganache GUI or CLI | Optional; system runs in mock mode without it |

> Ganache CLI: `npm install -g ganache` then `ganache --port 7545`
>
> Ganache GUI: download from [trufflesuite.com/ganache](https://trufflesuite.com/ganache/)
>
> The backend's `web3_client.py` connects to port **8545** by default (Ganache CLI default). If using Ganache GUI on port **7545**, update `GANACHE_URL` in `backend/app/blockchain/web3_client.py`.

### Step 1 — Clone the repository

```bash
git clone <repository-url>
cd smartdrm-x
```

### Step 2 — Create and activate a virtual environment

```bash
python -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Windows (cmd.exe)
.venv\Scripts\activate.bat
```

### Step 3 — Install Python dependencies

```bash
pip install -r requirements.txt
```

The `requirements.txt` at the project root installs all backend dependencies:

```
fastapi           # ASGI web framework
uvicorn           # ASGI server
python-multipart  # multipart form data (file uploads)
pydantic          # request/response validation
sqlalchemy        # ORM
web3              # Ethereum client
scikit-learn      # ML toolkit (AI engine extension point)
pandas            # data manipulation
numpy             # numerical computing
python-dotenv     # environment variable loading
cryptography      # AES-256-GCM primitives
passlib[bcrypt]   # BCrypt password hashing
pytest            # test runner
httpx             # HTTP client (used by TestClient)
```

### Step 4 — (Optional) Start Ganache

```bash
# Ganache CLI (port 7545 example)
ganache --port 7545 --deterministic

# Then update GANACHE_URL in backend/app/blockchain/web3_client.py:
# GANACHE_URL = "http://127.0.0.1:7545"
```

If Ganache is not running, the backend starts in **mock mode** — all blockchain calls return mock transaction hashes. All DRM and licensing functionality remains fully operational.

### Step 5 — Deploy the Smart Contract (Optional)

If you want real on-chain transactions:

1. Open Ganache and note the RPC server URL and a funded account address.
2. Deploy `blockchain/contracts/SmartDRMX.sol` using Truffle, Hardhat, or Remix.
3. Copy the deployed contract address into `CONTRACT_ADDRESS` in `backend/app/blockchain/contract_interface.py`.
4. Ensure the compiled ABI at `blockchain/contracts/SmartDRMX_ABI.json` matches your deployment.

### Step 6 — Run the application

```bash
# Start both backend and frontend together
python run.py
```

| Service | URL |
|---|---|
| Backend API | http://127.0.0.1:8000 |
| Interactive API docs (Swagger) | http://127.0.0.1:8000/docs |
| ReDoc API docs | http://127.0.0.1:8000/redoc |
| Frontend dashboard | http://127.0.0.1:5173 |

Stop with `Ctrl+C`. Both subprocesses are terminated cleanly.

**Individual service start:**

```bash
# Backend only
python run.py --backend-only

# Frontend only (requires backend to already be running)
python run.py --frontend-only

# Direct uvicorn (from backend/ directory)
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Usage — Full User Journey

### Default Credentials

Two accounts are seeded automatically on first startup:

| Username | Password | Role |
|---|---|---|
| `admin` | `admin` | `admin` |
| `demo` | `demo` | `user` |

Change these immediately in any non-research deployment.

---

### Journey A — Creator Role

#### 1. Register a Creator account

```bash
curl -X POST http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secure123", "role": "creator"}'
```

Response:
```json
{"status": "user_created", "user_id": 3}
```

#### 2. Log in and capture the token

```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secure123"}'
```

Response:
```json
{"username": "alice", "role": "creator", "token": "3:alice"}
```

Export for reuse:
```bash
ALICE_TOKEN="3:alice"
```

#### 3. Upload an asset

```bash
curl -X POST http://127.0.0.1:8000/asset/upload \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -F "file=@/path/to/document.pdf"
```

Response:
```json
{
  "status": "asset_uploaded",
  "asset_hash": "a3f2c1d4e5b6...",
  "tx_hash": "0x7f3a9b1c..."
}
```

Record the `asset_hash` and the internal `asset_id` (query `/asset/list` to get the ID).

#### 4. List owned assets to get the asset ID

```bash
curl http://127.0.0.1:8000/asset/list \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

#### 5. Issue a license to a specific user

```bash
curl -X POST http://127.0.0.1:8000/asset/license/issue \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "asset_id": 1,
    "user_username": "bob",
    "expiry_days": 14,
    "access_limit": 5
  }'
```

Response:
```json
{"status": "license_issued", "license_id": 1}
```

#### 6. Issue an institutional (group) license

```bash
# Create a group
curl -X POST "http://127.0.0.1:8000/asset/groups/create?name=ResearchTeam" \
  -H "Authorization: Bearer $ALICE_TOKEN"

# Add user to group
curl -X POST "http://127.0.0.1:8000/asset/groups/add_user?group_id=1&username=carol" \
  -H "Authorization: Bearer $ALICE_TOKEN"

# Issue group license
curl -X POST http://127.0.0.1:8000/asset/license/issue \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "asset_id": 1,
    "group_id": 1,
    "expiry_days": 30,
    "access_limit": 100
  }'
```

#### 7. Review incoming access requests

```bash
curl http://127.0.0.1:8000/asset/requests/incoming \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

#### 8. Approve a request

```bash
curl -X POST http://127.0.0.1:8000/asset/request/1/approve \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"expiry_days": 7, "access_limit": 3}'
```

#### 9. Revoke a license

```bash
curl -X POST "http://127.0.0.1:8000/asset/license/revoke?license_id=1" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

---

### Journey B — Licensee / Consumer Role

#### 1. Register and log in

```bash
curl -X POST http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "bob", "password": "pass456", "role": "user"}'

BOB_TOKEN="4:bob"  # substitute actual token from login response
```

#### 2. Browse the catalog

```bash
curl http://127.0.0.1:8000/asset/catalog \
  -H "Authorization: Bearer $BOB_TOKEN"
```

Returns assets Bob does not own and does not already have a license for, including the owner's username.

#### 3. Request access to an asset

```bash
curl -X POST http://127.0.0.1:8000/asset/request \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"asset_id": 1, "message": "I need this for my research project."}'
```

Response:
```json
{"status": "request_submitted", "request_id": 1}
```

#### 4. Check request status

```bash
curl http://127.0.0.1:8000/asset/requests/mine \
  -H "Authorization: Bearer $BOB_TOKEN"
```

#### 5. Download the asset (once license is granted)

```bash
curl -X GET http://127.0.0.1:8000/asset/download/a3f2c1d4e5b6... \
  -H "Authorization: Bearer $BOB_TOKEN" \
  --output document.pdf
```

The server verifies Bob has an active, non-expired, non-exhausted license, decrements `access_used`, decrypts the stored `.enc` file on the fly, and streams the plaintext back.

#### 6. View shared assets

```bash
curl http://127.0.0.1:8000/asset/list/shared \
  -H "Authorization: Bearer $BOB_TOKEN"
```

Returns all assets accessible to Bob via individual or group licenses, including license metadata (expiry, usage count).

---

### Journey C — Admin Role

#### Check risk score for any user

```bash
ADMIN_TOKEN="1:admin"

curl http://127.0.0.1:8000/ai/analyze/4 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### View dashboard stats for a specific user

```bash
curl http://127.0.0.1:8000/ai/dashboard/4 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Review audit trail

```bash
curl http://127.0.0.1:8000/audit/logs \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## API Reference

### Authentication

All protected endpoints require:
```
Authorization: Bearer {user_id}:{username}
```

The token is returned by `POST /auth/login`.

---

### `/auth` — Authentication Routes

| Method | Path | Auth | Body / Params | Description |
|---|---|---|---|---|
| `POST` | `/auth/register` | No | `{username, password, role}` | Create a new user account |
| `POST` | `/auth/login` | No | `{username, password}` | Authenticate; returns token |
| `GET` | `/auth/me` | Yes | — | Return current user's profile |

**Register request body:**

```json
{
  "username": "alice",
  "password": "supersecret",
  "role": "creator"
}
```

**Login response:**

```json
{
  "username": "alice",
  "role": "creator",
  "token": "3:alice"
}
```

---

### `/asset` — Asset & License Management

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/asset/upload` | Yes | Upload file; encrypts + registers on-chain |
| `GET` | `/asset/download/{asset_hash}` | Yes | Authorized download + decryption |
| `GET` | `/asset/list` | Yes | List assets owned by current user (alias: `/list/owned`) |
| `GET` | `/asset/list/owned` | Yes | List assets owned by current user |
| `GET` | `/asset/list/shared` | Yes | List assets licensed to current user |
| `GET` | `/asset/catalog` | Yes | Browse licensable assets (not owned, not already licensed) |
| `POST` | `/asset/license/issue` | Yes | Issue individual or group license |
| `POST` | `/asset/license/revoke` | Yes | Deactivate a license (owner only) |
| `POST` | `/asset/groups/create` | Yes | Create a named institutional group |
| `POST` | `/asset/groups/add_user` | Yes | Add a member to an owned group |
| `POST` | `/asset/request` | Yes | Submit access request for an asset |
| `GET` | `/asset/requests/mine` | Yes | List my own access requests |
| `GET` | `/asset/requests/incoming` | Yes | List pending requests for my assets |
| `POST` | `/asset/request/{id}/approve` | Yes | Approve request; auto-issues license |
| `POST` | `/asset/request/{id}/deny` | Yes | Deny an access request |

**Upload response:**

```json
{
  "status": "asset_uploaded",
  "asset_hash": "a3f2c1d4e5b6...",
  "tx_hash": "0x7f3a9b1c..."
}
```

**License issue request body:**

```json
{
  "asset_id": 1,
  "user_username": "bob",
  "group_id": null,
  "expiry_days": 7,
  "access_limit": 10
}
```

**Download** — returns raw bytes with `Content-Disposition: attachment; filename=<original_filename>` and `Content-Type: application/octet-stream`.

---

### `/ai` — AI Analytics

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/ai/analyze/{user_id}` | Yes | Admin or self | Run risk analysis for a user |
| `GET` | `/ai/dashboard/stats` | Yes | Any | Dashboard KPIs for current user |
| `GET` | `/ai/dashboard/{user_id}` | Yes | Admin | Dashboard KPIs for any user |

**Risk analysis response:**

```json
{
  "risk_score": 45,
  "risk_level": "MEDIUM",
  "reasons": [
    "Moderate download volume",
    "Multiple access denials"
  ]
}
```

**Dashboard stats response:**

```json
{
  "total_assets": 8,
  "active_licenses": 3,
  "risk_level": "LOW"
}
```

---

### System Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | No | Health check — returns `{"status": "SmartDRM-X Backend is operational"}` |
| `GET` | `/audit/logs` | No | Most recent 100 audit events |
| `GET` | `/docs` | No | Swagger UI (interactive API explorer) |
| `GET` | `/redoc` | No | ReDoc API documentation |
| `GET` | `/openapi.json` | No | OpenAPI 3.0 schema |

---

## Testing

### Automated Tests (pytest)

The test suite in `tests/test_api.py` contains 50+ tests covering:

- Root/health endpoints
- Auth registration (success, duplicate, missing fields, edge cases)
- Auth login (success, wrong credentials, token format)
- Auth `/me` with valid, invalid, and missing tokens
- Asset upload, download, list (protected route enforcement)
- License issue and revoke (authorization checks)
- AI analytics routes (authorization checks)
- CORS and content-type headers
- OpenAPI schema and documentation availability

**Run all tests:**

```bash
cd /path/to/smartdrm-x

# Activate the virtual environment first
source .venv/bin/activate

pytest tests/test_api.py -v
```

**Run a specific test:**

```bash
pytest tests/test_api.py::test_login_default_admin_200 -v
```

**Run with coverage:**

```bash
pip install pytest-cov
pytest tests/ --cov=backend/app --cov-report=term-missing
```

The test suite uses FastAPI's `TestClient` (backed by `httpx`) which runs the ASGI app in-process — no server startup required. The default admin user is seeded automatically by the startup hook.

---

### Browser / E2E Tests (Playwright)

End-to-end browser tests live at `tests/browser/flow.spec.js` and are configured by `playwright.config.js`.

```bash
# Install Playwright and browsers
npm install
npx playwright install

# Run E2E tests (requires backend to be running)
npx playwright test
```

---

### Shell-based API Flow Test

A curl-driven integration test script is provided at `tests/api_test_flow.sh`. It exercises the full creator → upload → license → consumer → download pipeline:

```bash
chmod +x tests/api_test_flow.sh
./tests/api_test_flow.sh
```

The script:
1. Registers a `creator` user
2. Logs in and captures the token
3. Uploads a test file (`secret.txt`)
4. Registers a `consumer` user
5. Issues a license from creator to consumer
6. Logs in as consumer and downloads the file
7. Verifies the downloaded content
8. Cleans up temp files

---

### Manual Verification Checklist

1. Open the frontend at `http://127.0.0.1:5173`.
2. Register a new Creator account.
3. Log in; you are redirected to the dashboard.
4. Navigate to **Upload** and upload any file. Observe the returned `Asset Hash` and `TX Hash`.
5. Navigate to **Assets > My Uploads** and confirm the file appears.
6. Click **Grant License** and enter a second user's username, set expiry and access limit.
7. Log out and log in as the second user.
8. Navigate to **Assets > Shared With Me**. The asset should appear.
9. Click **Download** and verify the file decrypts correctly.
10. Navigate to **AI Analytics** and observe the risk score reflecting the download activity.
11. Visit `http://127.0.0.1:8000/audit/logs` and confirm `ASSET_ACCESSED` and `LICENSE_ISSUED` events are present.

---

## Configuration & Environment

### Key Files

| File | Purpose |
|---|---|
| `backend/secret.key` | 32-byte AES-256 key; auto-generated on first run |
| `backend/smartdrm.db` | SQLite database |
| `backend/app/blockchain/contract_interface.py` | Contains `CONTRACT_ADDRESS` — update after redeployment |
| `backend/app/blockchain/web3_client.py` | Contains `GANACHE_URL` — update to match your Ganache port |

### Changing Ganache Port

The backend defaults to port **8545** (Ganache CLI default). If using Ganache GUI (port 7545):

```python
# backend/app/blockchain/web3_client.py
GANACHE_URL = "http://127.0.0.1:7545"
```

### Key Rotation

The `encryption_key_id` column on the `assets` table is reserved for future key rotation support. Currently all assets share the single global key in `secret.key`. For production, implement per-asset keys managed via a vault service.

### Production Hardening Checklist

- [ ] Replace `secret.key` file-based key storage with HSM / KMS
- [ ] Replace SQLite with PostgreSQL or another production database
- [ ] Set `allow_origins` in CORS middleware to the specific frontend domain instead of `"*"`
- [ ] Implement JWT-based authentication with short expiry and refresh tokens
- [ ] Enable HTTPS (TLS termination via reverse proxy such as nginx)
- [ ] Change default admin/demo passwords
- [ ] Move `CONTRACT_ADDRESS` and `GANACHE_URL` to environment variables
- [ ] Add rate limiting middleware
- [ ] Enable IP capture in audit logs to power the `unique_ips_24h` AI signal

---

## Docker

A `Dockerfile` is provided at `docker/Dockerfile` for containerized deployment. See `docker/README.md` for usage instructions.

```bash
docker build -f docker/Dockerfile -t smartdrm-x .
docker run -p 8000:8000 smartdrm-x
```

---

## Project Structure

```
smartdrm-x/
├── run.py                          # Unified launcher (backend + frontend)
├── requirements.txt                # Python dependencies
├── secret.key                      # AES-256 encryption key (auto-generated)
├── smartdrm.db                     # SQLite database (auto-created)
│
├── backend/
│   ├── smartdrm.db                 # Backend-local DB
│   ├── secret.key                  # Backend-local key file
│   └── app/
│       ├── main.py                 # FastAPI app factory + router registration
│       ├── models.py               # SQLAlchemy ORM models
│       ├── database.py             # Engine, session, get_db dependency
│       ├── create_default_user.py  # Startup user seeding
│       ├── requirements.txt        # Backend-specific requirements (mirrors root)
│       │
│       ├── auth/
│       │   └── auth_routes.py      # /auth endpoints + get_current_user dependency
│       │
│       ├── asset/
│       │   ├── asset_routes.py     # /asset endpoints (upload, license, download, groups)
│       │   ├── hashing.py          # SHA-256 utility
│       │   └── storage/            # Encrypted .enc files (content-addressed by hash)
│       │
│       ├── drm/
│       │   ├── encryption.py       # AES-256-GCM encrypt/decrypt
│       │   ├── license_manager.py  # License descriptor generator
│       │   └── access_control.py   # Access control helpers
│       │
│       ├── blockchain/
│       │   ├── web3_client.py      # Web3 connection + mock fallback
│       │   └── contract_interface.py # register_asset_on_chain, issue_license_on_chain
│       │
│       ├── ai_engine/
│       │   ├── features.py         # Behavioral feature extraction from audit logs
│       │   ├── detector.py         # Rule-based anomaly scoring
│       │   ├── model.py            # Pipeline orchestrator
│       │   └── routes.py           # /ai endpoints
│       │
│       └── utils/
│           ├── audit_logger.py     # log_event() + get_logs()
│           ├── helpers.py          # Shared utilities
│           └── logger.py           # Logging configuration
│
├── blockchain/
│   └── contracts/
│       ├── SmartDRMX.sol           # Solidity smart contract source
│       └── SmartDRMX_ABI.json      # Compiled ABI for Web3 calls
│
├── frontend/
│   ├── index.html                  # Root redirect to login
│   └── pages/
│       ├── login.html              # Authentication page
│       ├── register.html           # Registration page
│       ├── dashboard.html          # KPI summary (Chart.js)
│       ├── upload.html             # Asset upload form
│       ├── assets.html             # My uploads + shared with me
│       ├── request.html            # Catalog browser + request submission
│       └── ai.html                 # AI analytics and risk scores
│
├── tests/
│   ├── conftest.py                 # pytest configuration
│   ├── test_api.py                 # 50+ API unit/integration tests
│   ├── test_default_login.py       # Default credential tests
│   ├── api_test_flow.sh            # curl-based end-to-end test
│   └── browser/
│       └── flow.spec.js            # Playwright E2E tests
│
├── docs/
│   ├── HOW_IT_WORKS.md             # Detailed end-to-end data flow
│   ├── architecture.md             # Architecture overview
│   ├── manual_testing.md           # Manual testing checklist
│   ├── conference_paper.md         # Research paper (Markdown)
│   └── reviews/                    # Review presentations and materials
│
├── docker/
│   ├── Dockerfile                  # Container build file
│   └── README.md                   # Docker usage instructions
│
└── paper/
    └── drm-conference/
        ├── conference_paper.md     # Conference submission
        └── IEEE_SmartDRM_X_Paper.docx
```

---

## Tech Stack

| Component | Technology | Version / Notes |
|---|---|---|
| **API Framework** | FastAPI | Python ASGI; async-capable |
| **ASGI Server** | Uvicorn | Production-grade ASGI server |
| **ORM** | SQLAlchemy | Declarative models; SQLite in dev |
| **Database** | SQLite | `smartdrm.db`; swap for Postgres in production |
| **Encryption** | `cryptography` (Python) | AES-256-GCM via `AESGCM` primitive |
| **Password Hashing** | `bcrypt` (via `passlib`) | Adaptive cost factor |
| **Blockchain** | Ethereum / Ganache | Local dev chain; Solidity 0.8.20 |
| **Web3 Client** | `web3.py` | Python Ethereum client |
| **Smart Contract** | Solidity | `SmartDRMX.sol` — asset + license registry |
| **AI / ML** | Rule engine + `scikit-learn` | Interpretable rules; sklearn available for extension |
| **Data** | `pandas`, `numpy` | Available for AI model development |
| **Validation** | Pydantic v2 | Request/response schemas |
| **Frontend** | Vanilla JS, HTML5, CSS | Zero framework dependencies |
| **Charts** | Chart.js | Dashboard visualizations |
| **Testing** | pytest, httpx | In-process TestClient; 50+ tests |
| **E2E Testing** | Playwright | Browser automation |

---

## Academic Context

SmartDRM-X was developed as a research prototype to demonstrate the technical feasibility of combining blockchain-anchored provenance with AI-based behavioral monitoring in a unified DRM platform. The system is designed to be **fully auditable** (every action is logged), **deterministic in its authorization logic** (the license validity check is a pure database query against transparent constraints), and **interpretable in its AI output** (the risk engine explains which rules fired).

The project supports publication material in `docs/conference_paper.md` and `paper/drm-conference/IEEE_SmartDRM_X_Paper.docx`.

For end-to-end data flow documentation see `docs/HOW_IT_WORKS.md`.
For architecture detail see `docs/architecture.md`.
For the interactive API explorer run the backend and visit `http://127.0.0.1:8000/docs`.
