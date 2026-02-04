from datetime import datetime

AUDIT_LOGS = []

def log_event(event_type: str, details: dict):
    AUDIT_LOGS.append({
        "event": event_type,
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    })

def get_logs():
    return AUDIT_LOGS[::-1]  # latest first

