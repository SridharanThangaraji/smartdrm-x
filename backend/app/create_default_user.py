"""
Ensures default users exist on backend startup: admin (administrator) and demo (for testing licenses).
"""
import bcrypt
from app.database import SessionLocal
from app import models

DEFAULT_USERS = [
    {"username": "admin", "password": "admin", "role": "admin"},
    {"username": "demo", "password": "demo", "role": "user"},
]

def create_default_user():
    db = SessionLocal()
    try:
        for u in DEFAULT_USERS:
            user = db.query(models.User).filter(models.User.username == u["username"]).first()
            hashed = bcrypt.hashpw(u["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            if not user:
                db.add(models.User(username=u["username"], hashed_password=hashed, role=u["role"]))
                db.commit()
                print(f"Default user '{u['username']}' created.")
            elif u["username"] == "admin" and not user.hashed_password.startswith("$2"):
                user.hashed_password = hashed
                db.commit()
                print("Admin password upgraded to BCrypt.")
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if admin and admin.hashed_password.startswith("$2"):
            print("Default admin user is already present and secure.")
    except Exception as e:
        print(f"Error during default user seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_default_user()
