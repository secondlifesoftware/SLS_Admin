"""
Seed script to create user profiles for the specified users.
Run this after initializing the database.
"""
from database import SessionLocal
from models import UserProfile
from sqlalchemy.exc import IntegrityError

# User profiles data
profiles_data = [
    {
        "firebase_uid": "dks1018_uid",  # This should be replaced with actual Firebase UID
        "email": "dks1018@gmail.com",
        "name": "Darius Smith",
        "phone": "7706963187",
        "company": "Second Life Software",
        "role": "Administrator",
        "bio": "Founder and CEO of Second Life Software. Passionate about building innovative software solutions that transform businesses. With expertise in full-stack development and strategic planning, I lead our team in delivering exceptional results for clients.",
    },
    {
        "firebase_uid": "darius_uid",  # This should be replaced with actual Firebase UID
        "email": "darius@secondlifesoftware.com",
        "name": "Darius Smith",
        "phone": "470-630-6086",
        "company": "Second Life Software",
        "role": "Administrator",
        "bio": "Co-founder and Technical Lead at Second Life Software. Specializing in enterprise software architecture and development. Dedicated to creating scalable solutions that drive business growth and operational efficiency.",
    },
    {
        "firebase_uid": "info_uid",  # This should be replaced with actual Firebase UID
        "email": "info@secondlifesoftware.com",
        "name": "Customer Service",
        "phone": "470-630-6086",
        "company": "Second Life Software",
        "role": "Administrator",
        "bio": "Customer Service team at Second Life Software. We are here to assist you with any questions, support requests, or inquiries about our services. Our goal is to provide exceptional customer experience and ensure your satisfaction.",
    },
    {
        "firebase_uid": "katia_uid",  # This should be replaced with actual Firebase UID
        "email": "katia@secondlifesoftware.com",
        "name": "Katerina Smith",
        "phone": "9704811365",
        "company": "Second Life Software",
        "role": "Administrator",
        "bio": "Operations Manager at Second Life Software. Focused on streamlining business processes, managing client relationships, and ensuring smooth project delivery. Committed to excellence in every aspect of our operations.",
    },
]

def seed_profiles():
    db = SessionLocal()
    
    try:
        created_count = 0
        updated_count = 0
        
        for profile_data in profiles_data:
            # Check if profile exists by email
            existing = db.query(UserProfile).filter(
                UserProfile.email == profile_data["email"]
            ).first()
            
            if existing:
                # Update existing profile
                for key, value in profile_data.items():
                    if key != "firebase_uid" or not existing.firebase_uid:
                        setattr(existing, key, value)
                updated_count += 1
                print(f"Updated profile for {profile_data['email']}")
            else:
                # Create new profile
                profile = UserProfile(**profile_data)
                db.add(profile)
                created_count += 1
                print(f"Created profile for {profile_data['email']}")
        
        db.commit()
        print(f"\n✅ Successfully processed {len(profiles_data)} profiles:")
        print(f"   - Created: {created_count}")
        print(f"   - Updated: {updated_count}")
        print("\n⚠️  Note: You may need to update the firebase_uid values with actual Firebase UIDs")
        print("   after users log in for the first time, or update them manually in the database.")
        
    except IntegrityError as e:
        db.rollback()
        print(f"❌ Error: {e}")
    except Exception as e:
        db.rollback()
        print(f"❌ Unexpected error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Seeding user profiles...")
    seed_profiles()

