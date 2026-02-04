from datetime import datetime, timedelta

def generate_license(days: int = 7, access_limit: int = 5):
    return {
        "issued_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=days),
        "access_limit": access_limit,
        "access_used": 0,
        "active": True
    }
