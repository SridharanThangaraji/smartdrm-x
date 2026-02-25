from datetime import datetime
import json
from app.database import SessionLocal
from app import models

def log_event(event_type: str, details: dict):
    db = SessionLocal()
    try:
        user_id = details.get("user_id") or details.get("issued_by") or details.get("revoked_by")
        
        log = models.AuditLog(
            event_type=event_type,
            details=json.dumps(details),
            timestamp=datetime.utcnow(),
            user_id=user_id
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Audit Log Error: {e}")
    finally:
        db.close()

def get_logs():
    db = SessionLocal()
    try:
        logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(100).all()
        return [
            {
                "id": log.id,
                "event_type": log.event_type,
                "details": log.details,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "user_id": log.user_id,
            }
            for log in logs
        ]
    finally:
        db.close()

