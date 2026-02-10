"""
This module handles user authentication and session management.
It provides endpoints for registration, login (using BCrypt for secure hashing), 
and a dependency for fetching the current authenticated user from a Bearer token.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt
from app.database import get_db
from app import models

router = APIRouter()
security = HTTPBearer()

def get_current_user(auth: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Dependency to extract user from Bearer token format 'user_id:username'."""
    token = auth.credentials
    try:
        user_id = int(token.split(":")[0])
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except (ValueError, IndexError):
        raise HTTPException(status_code=401, detail="Invalid token format")

class UserRegister(BaseModel):
    username: str
    password: str
    role: str = "user"

class UserLogin(BaseModel):
    username: str
    password: str

@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    new_user = models.User(username=user.username, hashed_password=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "user_created", "user_id": new_user.id}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), db_user.hashed_password.encode('utf-8')):
         raise HTTPException(status_code=401, detail="Invalid username or password")
    
    return {
        "username": db_user.username,
        "role": db_user.role,
        "token": f"{db_user.id}:{db_user.username}"
    }

@router.get("/me")
def current_me(user: models.User = Depends(get_current_user)):
    return {"id": user.id, "username": user.username, "role": user.role}
