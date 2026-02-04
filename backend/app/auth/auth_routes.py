from fastapi import APIRouter

router = APIRouter()

@router.post("/login")
def login(username: str):
    return {
        "username": username,
        "role": "creator",
        "token": "demo-token-123"
    }

@router.get("/me")
def current_user():
    return {
        "username": "demo_user",
        "role": "creator"
    }
