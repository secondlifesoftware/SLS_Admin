"""
Script to mark specific users as admins in the database
This allows them to bypass rate limiting for AI features
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import UserProfile

def set_admin_users():
    """Mark specific users as admins"""
    db = SessionLocal()
    
    try:
        # List of admin emails
        admin_emails = [
            "dks1018@gmail.com",
            "info@secondlifesoftware.com"
        ]
        
        for email in admin_emails:
            # Find user by email
            user = db.query(UserProfile).filter(UserProfile.email == email).first()
            
            if user:
                user.is_admin = True
                print(f"✅ Marked {email} as admin")
            else:
                print(f"⚠️  User not found: {email}")
        
        db.commit()
        print("\n✅ Admin users updated successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    set_admin_users()
