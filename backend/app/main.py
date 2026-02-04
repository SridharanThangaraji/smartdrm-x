from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.auth.auth_routes import router as auth_router
from backend.app.asset.asset_routes import router as asset_router
from backend.app.ai_engine.model import analyze_usage
from backend.app.utils.audit_logger import log_event, get_logs

app = FastAPI(
    title="SmartDRM-X API",
    description="Blockchain & AI-powered DRM System",
    version="1.0"
)

# -------------------- CORS --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- ROUTERS --------------------
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(asset_router, prefix="/asset", tags=["Asset"])

# -------------------- ROOT --------------------
@app.get("/")
def root():
    return {"status": "SmartDRM-X Backend Running"}

# -------------------- AI ANALYSIS --------------------
class AIRequest(BaseModel):
    downloads: int
    ip_count: int

@app.post("/ai/analyze")
def ai_analyze(req: AIRequest):
    result = analyze_usage({
        "downloads": req.downloads,
        "ip_count": req.ip_count
    })

    # Audit log
    log_event("AI_ANALYSIS", {
        "downloads": req.downloads,
        "ip_count": req.ip_count,
        "result": result
    })

    return {"analysis_result": result}

# -------------------- AUDIT LOGS --------------------
@app.get("/audit/logs")
def fetch_audit_logs():
    return get_logs()

