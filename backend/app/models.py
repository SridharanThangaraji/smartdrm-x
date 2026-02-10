"""
This module defines the SQLAlchemy ORM models representing the SmartDRM-X database schema.
It includes models for User accounts, Asset metadata, License agreements, Audit logs for security, 
and Group structures for institutional access control.
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user") # creator, user, admin

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    asset_hash = Column(String, unique=True, index=True)
    tx_hash = Column(String)
    encryption_key_id = Column(String) # Reserved for future key rotation support
    created_at = Column(DateTime, default=datetime.utcnow)

class License(Base):
    __tablename__ = "licenses"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Null for group licenses
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    tx_hash = Column(String)
    expires_at = Column(DateTime)
    access_limit = Column(Integer)
    access_used = Column(Integer, default=0)
    active = Column(Boolean, default=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String)
    details = Column(String) # JSON-formatted details
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    admin_id = Column(Integer, ForeignKey("users.id"))

class UserGroup(Base):
    __tablename__ = "user_groups"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    group_id = Column(Integer, ForeignKey("groups.id"))

