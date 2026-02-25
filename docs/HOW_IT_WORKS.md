# How SmartDRM-X Works End-to-End

This document explains how the system works from a user’s first visit through upload, licensing, download, and analytics.

---

## 1. Overview

SmartDRM-X is a **digital rights management (DRM)** platform that:

1. Lets users **upload** files that are **encrypted** and stored securely.
2. Registers each asset’s hash on a **blockchain** (or mock) for integrity.
3. Lets asset owners **grant licenses** to other users or groups (with expiry and download limit).
4. Allows licensed users to **download** files; the backend checks the license and **decrypts** on the fly.
5. **Logs** all important events (upload, grant, revoke, access, denials) and uses them for **AI risk** scoring.

Everything is tied together by: **Frontend (browser)** → **Backend (FastAPI)** → **Database (SQLite)** + **Encrypted storage** + **Blockchain (optional)**.

---

## 2. System Components

| Component | Role |
|-----------|------|
| **Frontend** | Static HTML/JS at `http://127.0.0.1:5173`. Login, dashboard, upload, assets, AI analytics. Calls backend API with Bearer token. |
| **Backend** | FastAPI at `http://127.0.0.1:8000`. Auth, asset CRUD, licenses, download, AI, audit. Uses SQLite and local encrypted storage. |
| **Database** | SQLite (`backend/smartdrm.db`). Users, assets, licenses, groups, audit_logs. |
| **Storage** | Encrypted files in `backend/app/asset/storage/*.enc`. AES-256-GCM; key in `backend/secret.key`. |
| **Blockchain** | Optional. Ganache on port 8545 (or mock). Registers asset hashes and license tx hashes. |

---

## 3. End-to-End Flow (High Level)

```
┌─────────────┐     HTTP + Bearer token      ┌─────────────┐     ┌──────────────┐
│   Browser   │ ───────────────────────────► │   FastAPI   │────►│   SQLite     │
│  (Frontend) │ ◄─────────────────────────── │   Backend   │     │   + Storage  │
└─────────────┘     JSON / file stream       └──────┬──────┘     └──────────────┘
                                                     │
                                                     │ (optional)
                                                     ▼
                                              ┌──────────────┐
                                              │  Blockchain  │
                                              │  (Ganache)   │
                                              └──────────────┘
```

- **Login:** Browser sends username/password → backend checks DB → returns token `user_id:username`.
- **All other requests:** Browser sends `Authorization: Bearer <token>`; backend resolves user and enforces permissions.

### 3.1 Canonical workflow (request–approve–download)

The main end-to-end flow is:

1. **Admin (add asset to blockchain)** – Admin uploads a file; it is encrypted, stored, and **registered on the blockchain**.
2. **User (sees assets, requests access)** – User opens **Request Access → Catalog**, sees assets provided by admin/others, and submits a **request**.
3. **Admin (approve)** – Admin sees the request under **Incoming requests**, approves it (sets duration and download limit); a **license** is created (and can be recorded on-chain).
4. **User (can read / view / download)** – User finds the asset under **Assets → Shared with me** and **downloads** it (license is checked).
5. **AI audits** – **AI Analytics** and **audit logs** track usage, risk, and events (e.g. access requested, approved, downloads).

---

## 4. User Journeys (Step by Step)

### 4.1 Registration & Login

1. User opens **http://127.0.0.1:5173** → redirected to **Login**.
2. **Register:** Click “Register” → enter username, password, role (Creator/Researcher or Admin) → `POST /auth/register` → user row in DB → redirect to Login.
3. **Login:** Enter credentials → `POST /auth/login` → backend checks BCrypt hash → returns `{ username, role, token }`. Frontend stores `token` and `user` in `localStorage`, redirects to **Dashboard**.
4. **Protected pages:** Every app page (except login/register) checks `localStorage.token`; if missing, redirects to Login. API sends `Authorization: Bearer <token>`. Backend dependency `get_current_user` parses token and loads user from DB.

**API:** `POST /auth/register`, `POST /auth/login`, `GET /auth/me` (with Bearer).

---

### 4.2 Upload Asset

1. User goes to **Upload** → selects (or drags) a file → clicks “Encrypt & upload”.
2. Frontend: `POST /asset/upload` with `FormData` (file) and `Authorization: Bearer <token>`.
3. Backend:
   - Reads file bytes.
   - **Encrypts** with AES-256-GCM (`app/drm/encryption.py`), key from `secret.key`.
   - Computes **SHA-256** of encrypted content → `asset_hash`.
   - If same hash exists in DB → returns “asset_already_exists”.
   - Writes encrypted bytes to `backend/app/asset/storage/<asset_hash>.enc`.
   - Calls **blockchain** `register_asset_on_chain(asset_hash)` → gets `tx_hash` (or `0x_mock_tx` if mock).
   - Inserts row in **assets** (owner_id, filename, asset_hash, tx_hash).
   - Writes **audit** event `ASSET_UPLOADED`.
4. Response: `{ status, asset_hash, tx_hash }`. Frontend shows success and redirects to **Assets**.

**API:** `POST /asset/upload` (multipart/form-data).

---

### 4.3 Request access (catalog → approve → download)

1. **Catalog:** User (e.g. normal user) opens **Request Access**. Frontend calls `GET /asset/catalog` → backend returns assets the user does *not* own and does *not* already have a license or pending request for (i.e. assets provided by admin/others that can be requested).
2. **Request:** User clicks **Request access** on an asset → optional message → `POST /asset/request` with `{ asset_id, message }`. Backend creates an **AccessRequest** (pending). **Audit:** `ACCESS_REQUESTED`.
3. **Incoming (owner):** Admin/owner opens **Request Access → Incoming requests**, sees pending requests. **Approve:** `POST /asset/request/<id>/approve` with duration and download limit → backend creates a **License** (and may call `issue_license_on_chain`). **Audit:** request approved, license issued. **Deny:** `POST /asset/request/<id>/deny` → request status set to denied.
4. **Download:** Once approved, the requester sees the asset under **Assets → Shared with me** and can download as in **4.5** (license checked, decrypt, audit).

**APIs:** `GET /asset/catalog`, `POST /asset/request`, `GET /asset/requests/incoming`, `GET /asset/requests/mine`, `POST /asset/request/<id>/approve`, `POST /asset/request/<id>/deny`.

---

### 4.4 Grant License (direct)

1. On **Assets** → “My Uploaded Assets”, user clicks **Grant license** on a row.
2. Frontend prompts: recipient username, duration (days), access limit (number of downloads).
3. Frontend: `POST /asset/license/issue` with `{ asset_id, user_username, expiry_days, access_limit }` and Bearer token.
4. Backend:
   - Ensures asset exists and `asset.owner_id == current_user.id`.
   - Resolves `user_username` to target user ID.
   - Computes `expires_at = now + expiry_days`.
   - Optionally calls **blockchain** `issue_license_on_chain(...)` → `tx_hash`.
   - Inserts **License** (asset_id, user_id, expires_at, access_limit, access_used=0, tx_hash).
   - **Audit:** `LICENSE_ISSUED`.
5. Recipient can now see the asset under **Shared With Me** and download (within limit and before expiry).

**API:** `POST /asset/license/issue`.

---

### 4.5 Download (Licensed User)

1. User goes to **Assets** → “Shared With Me” → clicks **Download** on a row.
2. Frontend: `GET /asset/download/<asset_hash>` with Bearer token. Response is a **blob** (binary). Frontend creates an `<a download>` and triggers save.
3. Backend:
   - Loads asset by `asset_hash`.
   - If current user is **not** the owner: checks **License** (user_id or group membership, active, not expired, `access_used < access_limit`). If no valid license → 403 and **audit** `ASSET_ACCESS_DENIED`.
   - If valid license: increments `license.access_used`, commits.
   - Reads encrypted file from `storage/<asset_hash>.enc`, **decrypts** with AES-GCM.
   - **Audit:** `ASSET_ACCESSED`.
   - Returns decrypted bytes as `application/octet-stream` with `Content-Disposition: attachment; filename=...`.
4. User gets the original file on disk.

**API:** `GET /asset/download/{asset_hash}`.

---

### 4.6 Revoke License

1. Owner (via API or future UI) revokes a license: `POST /asset/license/revoke` with `license_id`.
2. Backend sets `license.active = False`, **audit** `LICENSE_REVOKED`. Further downloads for that license are denied.

**API:** `POST /asset/license/revoke?license_id=...`.

---

### 4.7 Groups (Institutional Licensing)

- **Create group:** `POST /asset/groups/create?name=...` (current user becomes admin).
- **Add member:** `POST /asset/groups/add_user?group_id=...&username=...`.
- **Issue license to group:** Same `POST /asset/license/issue` with `group_id` instead of `user_username`. Any user in that group can download (subject to expiry and limit).

Logic: on download, backend collects user’s group IDs and allows access if a license exists for that asset with `license.group_id` in that set.

---

### 4.8 Dashboard & AI Risk

1. **Dashboard:** After login, frontend calls `GET /ai/dashboard/<user_id>` (user_id from token). Backend returns `total_assets`, `active_licenses`, and `risk_level` (from AI engine). Frontend shows these and quick links (Upload, Assets, AI).
2. **AI Analytics page:** Frontend calls:
   - `GET /ai/analyze/<user_id>` → `risk_score`, `risk_level`, `reasons` (e.g. “High download volume”).
   - `GET /audit/logs` → last N audit events (timestamp, event_type, details, user_id).
3. **Risk logic (backend):** `app/ai_engine/features.py` pulls from **audit_logs** (last 24h): download count, access denials, unique assets. `detector.py` applies rules (e.g. >50 downloads → +40 score) and maps score to LOW/MEDIUM/HIGH.

**APIs:** `GET /ai/dashboard/<user_id>`, `GET /ai/analyze/<user_id>`, `GET /audit/logs`.

---

## 5. How to Run and Verify

### 5.1 One-command run (recommended)

From project root:

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

- **Backend:** http://127.0.0.1:8000  
- **Frontend:** http://127.0.0.1:5173  
- Stop: `Ctrl+C`

`run.py` uses `.venv/bin/python` if present so uvicorn and dependencies are available.

### 5.2 Quick verification

1. Open http://127.0.0.1:5173 → Login.
2. Use **“Use demo (admin / admin)”** or type `admin` / `admin` → Sign in → Dashboard.
3. **Upload:** Upload asset → one file → “Encrypt & upload” → success → Assets.
4. **Grant:** In “My Uploaded Assets”, Grant license to another user (create them via Register first), then log in as that user → “Shared With Me” → Download.
5. **AI:** Open “AI Analytics” → see risk level and audit table.

### 5.3 API docs

- **Swagger UI:** http://127.0.0.1:8000/docs  
- **ReDoc:** http://127.0.0.1:8000/redoc  

---

## 6. Summary Table: Action → API → Backend Effect

| User action        | API / endpoint              | Main backend effect                                      |
|--------------------|----------------------------|----------------------------------------------------------|
| Register           | `POST /auth/register`      | Insert user (BCrypt password)                            |
| Login              | `POST /auth/login`         | Verify credentials, return token                         |
| Who am I           | `GET /auth/me`             | Return user from Bearer token                            |
| List my assets     | `GET /asset/list`          | Select assets where owner_id = user                      |
| List shared        | `GET /asset/list/shared`   | Licenses for user (or groups) + asset rows               |
| Upload             | `POST /asset/upload`       | Encrypt → store file → DB + blockchain + audit           |
| Grant license      | `POST /asset/license/issue`| Insert license, optional chain tx, audit                 |
| Download           | `GET /asset/download/{hash}` | Check license → decrypt → stream                        |
| Revoke license     | `POST /asset/license/revoke` | Set license.active = False, audit                     |
| Dashboard stats    | `GET /ai/dashboard/{id}`   | Count assets/licenses, run risk model                    |
| Risk analysis      | `GET /ai/analyze/{id}`     | Risk score, level, reasons from audit data               |
| Audit log          | `GET /audit/logs`          | Return recent audit_logs rows                            |

---

## 7. Related Docs

- [Architecture](architecture.md) – Modules, security, data flow.
- [Manual testing](manual_testing.md) – Checklist for QA.
- [README](../README.md) – Setup and quick start.
