"""
This module provides AI-driven analytics for user behavior and risk assessment.
It includes endpoints for analyzing individual user risk scores and aggregating 
system-wide dashboard statistics for administrators and individual users.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth.auth_routes import get_current_user
from app.ai_engine.model import analyze_usage

router = APIRouter()

@router.get("/analyze/{user_id}")
def analyze_user_risk(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_user)):
    """Triggers risk analysis for a specific user ID."""
    if admin.role != "admin" and admin.id != user_id:
         raise HTTPException(status_code=403, detail="Unauthorized access to user analytics")
    return analyze_usage(user_id)

@router.get("/dashboard/stats")
@router.get("/dashboard/{user_id}")
async def get_dashboard_stats(user_id: int = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Fetch aggregated KPIs for the user dashboard."""
    target_id = user_id if user_id and current_user.role == "admin" else current_user.id
    
    # KPIs: Assets owned and licenses issued for those assets
    assets_count = db.query(models.Asset).filter(models.Asset.owner_id == target_id).count()
    license_count = db.query(models.License).join(models.Asset).filter(models.Asset.owner_id == target_id).count()
    
    return {
        "total_assets": assets_count,
        "active_licenses": license_count,
        "risk_level": analyze_usage(target_id)["risk_level"]
    }
