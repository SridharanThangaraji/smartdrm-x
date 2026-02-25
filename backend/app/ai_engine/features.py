from app.database import SessionLocal
from app import models
from datetime import datetime, timedelta
import json
from sqlalchemy import func

def extract_features(user_id: int):
    """
    Extracts behavioral features for a user from audit logs.
    """
    db = SessionLocal()
    try:
        # Time window: Last 24 hours
        time_limit = datetime.utcnow() - timedelta(hours=24)
        
        # 1. Download Count
        downloads = db.query(models.AuditLog).filter(
            models.AuditLog.user_id == user_id,
            models.AuditLog.event_type == "ASSET_ACCESSED",
            models.AuditLog.timestamp > time_limit
        ).count()

        # 2. Denied Access Count
        denied = db.query(models.AuditLog).filter(
            models.AuditLog.user_id == user_id,
            models.AuditLog.event_type == "ASSET_ACCESS_DENIED",
            models.AuditLog.timestamp > time_limit
        ).count()

        # 3. Unique Assets Accessed
        # Requires parsing JSON 'details' which is hard in SQL query if stored as string.
        # Ideally we'd have normalized tables or use JSON type (Postgres).
        # For SQLite/Prototype, fetching recent logs and parsing in python is acceptable.
        recent_logs = db.query(models.AuditLog).filter(
            models.AuditLog.user_id == user_id,
            models.AuditLog.timestamp > time_limit
        ).all()

        unique_assets = set()
        ips = set() # TODO: Capture IP in logs
        
        for log in recent_logs:
            try:
                details = json.loads(log.details or "{}")
            except (json.JSONDecodeError, TypeError):
                details = {}
            if "asset_hash" in details:
                unique_assets.add(details["asset_hash"])
            if "ip_address" in details:
                ips.add(details["ip_address"])

        return {
            "downloads_24h": downloads,
            "denied_24h": denied,
            "unique_assets_24h": len(unique_assets),
            "unique_ips_24h": len(ips)
        }
    finally:
        db.close()
