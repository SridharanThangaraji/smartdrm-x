"""
This module manages digital assets and their licensing within SmartDRM-X.
It provides endpoints for uploading encrypted assets, issuing licenses (user or institutional), 
and securely downloading/decrypting assets based on valid license ownership.
All transactions are optionally recorded on a blockchain via the contract interface.
"""
import os
import hashlib
import datetime
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Response
from sqlalchemy import or_
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.auth.auth_routes import get_current_user
from app.drm.encryption import encrypt_data, decrypt_data
from app.blockchain.contract_interface import register_asset_on_chain, issue_license_on_chain
from app.utils.audit_logger import log_event

router = APIRouter()

STORAGE_DIR = os.path.join(os.path.dirname(__file__), "storage")

def hash_data(data: bytes) -> str:
    """Returns SHA-256 hash of provided bytes."""
    return hashlib.sha256(data).hexdigest()

@router.post("/upload")
async def upload_asset(file: UploadFile = File(...), db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    content = await file.read()
    encrypted_content = encrypt_data(content)
    asset_hash = hash_data(encrypted_content)

    if db.query(models.Asset).filter(models.Asset.asset_hash == asset_hash).first():
        return {"status": "asset_already_exists", "asset_hash": asset_hash}

    os.makedirs(STORAGE_DIR, exist_ok=True)
    storage_path = os.path.join(STORAGE_DIR, f"{asset_hash}.enc")
    with open(storage_path, "wb") as f:
        f.write(encrypted_content)

    tx_hash = register_asset_on_chain(asset_hash)
    new_asset = models.Asset(filename=file.filename, asset_hash=asset_hash, tx_hash=tx_hash, owner_id=user.id)
    db.add(new_asset)
    db.commit()

    log_event("ASSET_UPLOADED", {"filename": file.filename, "asset_hash": asset_hash, "encryption": "AES-256-GCM", "user_id": user.id})
    return {"status": "asset_uploaded", "asset_hash": asset_hash, "tx_hash": tx_hash}

class LicenseRequest(BaseModel):
    asset_id: int
    user_username: str = None
    group_id: int = None
    expiry_days: int = 7
    access_limit: int = 10

@router.post("/license/issue")
def issue_license(req: LicenseRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    asset = db.query(models.Asset).filter(models.Asset.id == req.asset_id).first()
    if not asset or asset.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: Asset not found or not owned")

    target_user_id = None
    if req.user_username:
        target_user = db.query(models.User).filter(models.User.username == req.user_username).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found")
        target_user_id = target_user.id
    
    if not target_user_id and not req.group_id:
        raise HTTPException(status_code=400, detail="Must specify user or group")

    now = datetime.datetime.utcnow()
    expires_at = now + datetime.timedelta(days=req.expiry_days)
    
    try:
        tx_hash = issue_license_on_chain(req.asset_id, "0x00...00", int(expires_at.timestamp()), req.access_limit)
    except:
        tx_hash = "0x_mock_failed_chain"

    new_license = models.License(
        asset_id=req.asset_id, user_id=target_user_id, group_id=req.group_id,
        tx_hash=tx_hash, expires_at=expires_at, access_limit=req.access_limit
    )
    db.add(new_license)
    db.commit()

    log_event("LICENSE_ISSUED", {"asset_id": req.asset_id, "tx_hash": tx_hash})
    return {"status": "license_issued", "license_id": new_license.id}

@router.get("/download/{asset_hash}")
def download_asset(asset_hash: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Authorizes and serves decrypted asset bytes."""
    asset = db.query(models.Asset).filter(models.Asset.asset_hash == asset_hash).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Access Authorization (Owner or Licensed)
    if asset.owner_id != user.id:
        now = datetime.datetime.utcnow()
        group_ids = [ug.group_id for ug in db.query(models.UserGroup).filter(models.UserGroup.user_id == user.id).all()]
        
        license_record = db.query(models.License).filter(
            models.License.asset_id == asset.id,
            models.License.active == True,
            models.License.expires_at > now,
            models.License.access_used < models.License.access_limit,
            or_(models.License.user_id == user.id, models.License.group_id.in_(group_ids))
        ).first()

        if not license_record:
            log_event("ASSET_ACCESS_DENIED", {"asset_hash": asset_hash, "user_id": user.id})
            raise HTTPException(status_code=403, detail="No valid license or access limit reached")
        
        license_record.access_used += 1
        db.commit()

    # Serve decrypted file
    storage_path = os.path.join(STORAGE_DIR, f"{asset_hash}.enc")
    if not os.path.exists(storage_path):
        raise HTTPException(status_code=500, detail="Storage integrity failure")

    with open(storage_path, "rb") as f:
        decrypted_content = decrypt_data(f.read())

    log_event("ASSET_ACCESSED", {"asset_hash": asset_hash, "user_id": user.id})
    return Response(content=decrypted_content, media_type="application/octet-stream", headers={"Content-Disposition": f"attachment; filename={asset.filename}"})

@router.get("/list/owned")
@router.get("/list")
def list_owned_assets(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Asset).filter(models.Asset.owner_id == user.id).all()

@router.get("/list/shared")
def list_shared_assets(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Lists assets shared with the current user via individual or group licenses."""
    group_ids = [ug.group_id for ug in db.query(models.UserGroup).filter(models.UserGroup.user_id == user.id).all()]
    licenses = db.query(models.License).filter(
        models.License.active == True,
        models.License.expires_at > datetime.datetime.utcnow(),
        or_(models.License.user_id == user.id, models.License.group_id.in_(group_ids))
    ).all()
    
    return [{"asset": db.query(models.Asset).filter(models.Asset.id == lic.asset_id).first(), "license": lic} for lic in licenses]

@router.post("/license/revoke")
def revoke_license(license_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    lic = db.query(models.License).join(models.Asset).filter(models.License.id == license_id, models.Asset.owner_id == user.id).first()
    if not lic:
        raise HTTPException(status_code=403, detail="Unauthorized: License not found or asset not owned")
    
    lic.active = False
    db.commit()
    log_event("LICENSE_REVOKED", {"license_id": license_id})
    return {"status": "license_revoked"}

@router.post("/groups/create")
def create_group(name: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    group = models.Group(name=name, admin_id=user.id)
    try:
        db.add(group)
        db.commit()
    except:
        raise HTTPException(status_code=400, detail="Group name taken")
    return {"status": "group_created", "group_id": group.id}

@router.post("/groups/add_user")
def add_user_to_group(group_id: int, username: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    group = db.query(models.Group).filter(models.Group.id == group_id, models.Group.admin_id == user.id).first()
    target = db.query(models.User).filter(models.User.username == username).first()
    if not group or not target:
        raise HTTPException(status_code=404, detail="Resource not found or unauthorized")
        
    db.add(models.UserGroup(user_id=target.id, group_id=group.id))
    db.commit()
    return {"status": "user_added"}


# ---------- Request for access (e.g. movie, song) ----------

@router.get("/catalog")
def list_requestable_assets(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """List assets the current user can request (not owner, not already licensed)."""
    sub = db.query(models.License.asset_id).filter(
        models.License.active == True,
        models.License.expires_at > datetime.datetime.utcnow(),
        models.License.user_id == user.id
    )
    group_ids = [ug.group_id for ug in db.query(models.UserGroup).filter(models.UserGroup.user_id == user.id).all()]
    if group_ids:
        sub_group = db.query(models.License.asset_id).filter(
            models.License.active == True,
            models.License.expires_at > datetime.datetime.utcnow(),
            models.License.group_id.in_(group_ids)
        )
        sub = sub.union(sub_group)
    already_licensed = sub.subquery()
    already_requested = db.query(models.AccessRequest.asset_id).filter(
        models.AccessRequest.requester_id == user.id,
        models.AccessRequest.status == "pending"
    ).subquery()
    assets = db.query(models.Asset, models.User.username).join(
        models.User, models.Asset.owner_id == models.User.id
    ).filter(
        models.Asset.owner_id != user.id
    ).filter(
        ~models.Asset.id.in_(already_licensed)
    ).filter(
        ~models.Asset.id.in_(already_requested)
    ).all()
    return [
        {"asset": a, "owner_username": uname}
        for a, uname in assets
    ]

class AccessRequestCreate(BaseModel):
    asset_id: int
    message: str = None

@router.post("/request")
def create_access_request(body: AccessRequestCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Request access to an asset (e.g. movie, song). Owner can approve later."""
    asset = db.query(models.Asset).filter(models.Asset.id == body.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.owner_id == user.id:
        raise HTTPException(status_code=400, detail="You already own this asset")
    existing = db.query(models.License).filter(
        models.License.asset_id == asset.id,
        models.License.active == True,
        models.License.expires_at > datetime.datetime.utcnow(),
        models.License.user_id == user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a license")
    pending = db.query(models.AccessRequest).filter(
        models.AccessRequest.asset_id == body.asset_id,
        models.AccessRequest.requester_id == user.id,
        models.AccessRequest.status == "pending"
    ).first()
    if pending:
        raise HTTPException(status_code=400, detail="You already have a pending request")
    req = models.AccessRequest(asset_id=body.asset_id, requester_id=user.id, message=body.message)
    db.add(req)
    db.commit()
    db.refresh(req)
    log_event("ACCESS_REQUESTED", {"asset_id": body.asset_id, "requester_id": user.id, "request_id": req.id})
    return {"status": "request_submitted", "request_id": req.id}

@router.get("/requests/mine")
def list_my_requests(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """List access requests I made (pending, approved, denied)."""
    reqs = db.query(models.AccessRequest, models.Asset, models.User.username).join(
        models.Asset, models.AccessRequest.asset_id == models.Asset.id
    ).join(
        models.User, models.Asset.owner_id == models.User.id
    ).filter(models.AccessRequest.requester_id == user.id).order_by(models.AccessRequest.created_at.desc()).all()
    return [
        {"request_id": r.id, "asset": a, "owner_username": uname, "status": r.status, "message": r.message, "created_at": r.created_at}
        for r, a, uname in reqs
    ]

@router.get("/requests/incoming")
def list_incoming_requests(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """List pending access requests for assets I own (so I can approve/deny)."""
    reqs = db.query(models.AccessRequest, models.Asset, models.User.username).join(
        models.Asset, models.AccessRequest.asset_id == models.Asset.id
    ).join(
        models.User, models.AccessRequest.requester_id == models.User.id
    ).filter(models.Asset.owner_id == user.id).filter(models.AccessRequest.status == "pending").all()
    return [
        {"request_id": r.id, "asset": a, "requester_username": uname, "message": r.message, "created_at": r.created_at}
        for r, a, uname in reqs
    ]

class ApproveRequestBody(BaseModel):
    expiry_days: int = 7
    access_limit: int = 10

@router.post("/request/{request_id}/approve")
def approve_access_request(request_id: int, body: ApproveRequestBody, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Approve a request: create license and mark request approved."""
    req = db.query(models.AccessRequest).filter(models.AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    asset = db.query(models.Asset).filter(models.Asset.id == req.asset_id).first()
    if not asset or asset.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not your asset")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already resolved")
    now = datetime.datetime.utcnow()
    expires_at = now + datetime.timedelta(days=body.expiry_days)
    try:
        tx_hash = issue_license_on_chain(asset.id, "0x00...00", int(expires_at.timestamp()), body.access_limit)
    except Exception:
        tx_hash = "0x_mock_failed_chain"
    lic = models.License(
        asset_id=asset.id, user_id=req.requester_id, group_id=None,
        tx_hash=tx_hash, expires_at=expires_at, access_limit=body.access_limit
    )
    db.add(lic)
    req.status = "approved"
    req.resolved_at = now
    db.commit()
    log_event("ACCESS_REQUEST_APPROVED", {"request_id": request_id, "license_id": lic.id})
    return {"status": "approved", "license_id": lic.id}

@router.post("/request/{request_id}/deny")
def deny_access_request(request_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Deny a request."""
    req = db.query(models.AccessRequest).filter(models.AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    asset = db.query(models.Asset).filter(models.Asset.id == req.asset_id).first()
    if not asset or asset.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not your asset")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request already resolved")
    req.status = "denied"
    req.resolved_at = datetime.datetime.utcnow()
    db.commit()
    log_event("ACCESS_REQUEST_DENIED", {"request_id": request_id})
    return {"status": "denied"}
