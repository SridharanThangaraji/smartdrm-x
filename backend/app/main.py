"""
This is the main entry point for the SmartDRM-X FastAPI backend. 
It initializes the application, configures CORS middleware, registers all API routers (Auth, Asset, AI), 
and handles the initial database setup and default user seeding on startup.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.auth.auth_routes import router as auth_router
from app.asset.asset_routes import router as asset_router
from app.ai_engine.routes import router as ai_router
from app.utils.audit_logger import get_logs

# Initialize Database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartDRM-X API",
    description="Blockchain & AI-powered Digital Rights Management System",
    version="1.0"
)

# Configure CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(asset_router, prefix="/asset", tags=["Asset"])
app.include_router(ai_router, prefix="/ai", tags=["AI"])

@app.get("/")
def root():
    return {"status": "SmartDRM-X Backend is operational"}

@app.get("/audit/logs")
def fetch_audit_logs():
    return get_logs()

@app.on_event("startup")
def startup_event():
    from app.create_default_user import create_default_user
    create_default_user()
