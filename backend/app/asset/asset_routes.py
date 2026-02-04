from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
import hashlib

from backend.app.blockchain.contract_interface import (
    register_asset_on_chain,
    issue_license_on_chain
)
from backend.app.utils.audit_logger import log_event

router = APIRouter()

# -------------------- UTILITY --------------------
def hash_file(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()

# -------------------- UPLOAD ASSET --------------------
@router.post("/upload")
async def upload_asset(file: UploadFile = File(...)):
    content = await file.read()
    asset_hash = hash_file(content)

    tx_hash = register_asset_on_chain(asset_hash)

    # Audit log
    log_event("ASSET_UPLOADED", {
        "filename": file.filename,
        "asset_hash": asset_hash,
        "tx_hash": tx_hash
    })

    return {
        "status": "asset_uploaded",
        "asset_hash": asset_hash,
        "tx_hash": tx_hash
    }

# -------------------- LICENSE ISSUE --------------------
class LicenseRequest(BaseModel):
    asset_id: int
    user_address: str
    expiry_time: int
    access_limit: int

@router.post("/license/issue")
def issue_license(req: LicenseRequest):
    tx_hash = issue_license_on_chain(
        req.asset_id,
        req.user_address,
        req.expiry_time,
        req.access_limit
    )

    # Audit log
    log_event("LICENSE_ISSUED", {
        "asset_id": req.asset_id,
        "user_address": req.user_address,
        "expiry_time": req.expiry_time,
        "access_limit": req.access_limit,
        "tx_hash": tx_hash
    })

    return {
        "status": "license_issued",
        "tx_hash": tx_hash
    }

