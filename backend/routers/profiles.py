from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import UserProfile
from schemas import UserProfile as UserProfileSchema, UserProfileCreate, UserProfileUpdate

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


@router.get("/", response_model=List[UserProfileSchema])
def get_profiles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all user profiles"""
    profiles = db.query(UserProfile).offset(skip).limit(limit).all()
    return profiles


@router.get("/firebase/{firebase_uid}", response_model=UserProfileSchema)
def get_profile_by_firebase_uid(firebase_uid: str, db: Session = Depends(get_db)):
    """Get a user profile by Firebase UID"""
    profile = db.query(UserProfile).filter(UserProfile.firebase_uid == firebase_uid).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/email/{email}", response_model=UserProfileSchema)
def get_profile_by_email(email: str, db: Session = Depends(get_db)):
    """Get a user profile by email"""
    profile = db.query(UserProfile).filter(UserProfile.email == email).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/{profile_id}", response_model=UserProfileSchema)
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    """Get a specific user profile by ID"""
    profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.post("/", response_model=UserProfileSchema)
def create_profile(profile: UserProfileCreate, db: Session = Depends(get_db)):
    """Create a new user profile"""
    # Check if profile already exists
    existing = db.query(UserProfile).filter(
        (UserProfile.firebase_uid == profile.firebase_uid) |
        (UserProfile.email == profile.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    db_profile = UserProfile(**profile.dict())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.put("/{profile_id}", response_model=UserProfileSchema)
def update_profile(profile_id: int, profile_update: UserProfileUpdate, db: Session = Depends(get_db)):
    """Update a user profile"""
    db_profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    update_data = profile_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_profile, field, value)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.put("/firebase/{firebase_uid}", response_model=UserProfileSchema)
def update_profile_by_firebase_uid(firebase_uid: str, profile_update: UserProfileUpdate, db: Session = Depends(get_db)):
    """Update a user profile by Firebase UID"""
    db_profile = db.query(UserProfile).filter(UserProfile.firebase_uid == firebase_uid).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    update_data = profile_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_profile, field, value)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.delete("/{profile_id}")
def delete_profile(profile_id: int, db: Session = Depends(get_db)):
    """Delete a user profile"""
    db_profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    db.delete(db_profile)
    db.commit()
    return {"message": "Profile deleted successfully"}

