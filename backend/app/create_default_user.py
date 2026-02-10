"""
This utility script ensures that a default administrative user exists in the system.
On backend startup, it checks for an 'admin' user and creates it with default credentials 
if missing, or upgrades its password to a secure BCrypt hash if it was previously insecure.
"""
import bcrypt
from app.database import SessionLocal
from app import models

def create_default_user():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == "admin").first()
        hashed_admin_pwd = bcrypt.hashpw(b"admin", bcrypt.gensalt()).decode('utf-8')
        
        if not user:
            print("Seeding default admin user...")
            db.add(models.User(username="admin", hashed_password=hashed_admin_pwd, role="admin"))
            db.commit()
            print("Default 'admin' user created.")
        elif not user.hashed_password.startswith("$2"):
            print("Upgrading admin password to secure BCrypt hash...")
            user.hashed_password = hashed_admin_pwd
            db.commit()
            print("Admin password updated successfully.")
        else:
            print("Default admin user is already present and secure.")
    except Exception as e:
        print(f"Error during default user seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_default_user()
