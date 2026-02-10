# System Architecture

## Overview
SmartDRM-X follows a modular, service-oriented architecture separating the Presentation Layer (Frontend), Logic Layer (Backend), and Persistence Layers (Database & Blockchain).

## Modules

### Security Layer
- **Encryption**: AES-256-GCM (Galois/Counter Mode) for authenticated encryption of digital assets.
- **Hashing**: BCrypt for secure credential storage.
- **Blockchain**: Smart contracts for decentralized license verification.

### 1. DRM Module (`backend/app/drm`)
- **Access Control**: Validates presence of a valid `License` record in the database before allowing decryption.
- **Storage**: Encrypted files are stored in `backend/app/asset/storage` (simulating S3/IPFS).

### 2. Permissions Module (`backend/app/asset`)
- **License Issuance**: Creates a `License` record linking `User` and `Asset`. Records transaction hash on Blockchain.
- **Institutional Support**: Implements `Group` and `UserGroup` models. Licenses can be issued to a `Group`, granting access to all members.
- **Revocation**: Sets `active=False` on the license record.

### 3. AI Engine (`backend/app/ai_engine`)
- **Feature Extraction**: Queries `AuditLog` for user activity (Downloads/24h, Unique IPs, Denials).
- **Anomaly Detection**: Uses rule-based heuristics to assign a Risk Score (0-100) and Level (LOW/MEDIUM/HIGH).
- **Integration**: Exposed via `/ai/analyze/{user_id}` and visible on the Admin Dashboard.

### 4. Blockchain (`backend/app/blockchain`)
- **Contracts**: Solidity contracts (LicenseManager) handle the immutable registry of assets and licenses.
- **Web3 Interface**: `web3.py` acts as the bridge between FastAPI and Ganache.

## Data Flow

1. **Upload**: Client -> API -> Encryption -> Storage (Disk) + Registration (Blockchain) + Metadata (DB).
2. **Access**: Client -> API -> Auth Check -> License Check (DB/Group) -> Decryption -> Response.
3. **Audit**: Every action triggers a `log_event` call, saving to `audit_logs` table.

## Database Schema
- **Users**: Credentials, Roles.
- **Assets**: Filename, Hash, OwnerID.
- **Licenses**: AssetID, UserID/GroupID, Expiry.
- **Groups**: Institutional groupings.
- **AuditLogs**: JSON details of all events.
