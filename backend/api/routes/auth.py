from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt
from pydantic import BaseModel

from db.database import get_db
from db.models import User
from core.security import verify_password, get_password_hash, create_access_token
from config import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

class UserRegister(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    dob: str
    preferences: str
    email_opt_in: bool

class UserResponse(BaseModel):
    email: str
    first_name: str
    last_name: str
    dob: str
    preferences: str
    languages: str
    email_opt_in: bool
    
    class Config:
        from_attributes = True

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserResponse)
def register(user: UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        dob=user.dob,
        preferences=user.preferences,
        email_opt_in=1 if user.email_opt_in else 0
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

class PreferencesUpdate(BaseModel):
    preferences: str
    languages: str
    email_opt_in: bool

@router.put("/me/preferences", response_model=UserResponse)
def update_preferences(prefs: PreferencesUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.preferences = prefs.preferences
    current_user.languages = prefs.languages
    current_user.email_opt_in = 1 if prefs.email_opt_in else 0
    db.commit()
    db.refresh(current_user)
    return current_user

class ProfileUpdate(BaseModel):
    first_name: str
    last_name: str
    dob: str

@router.put("/me/profile", response_model=UserResponse)
def update_profile(profile: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.first_name = profile.first_name
    current_user.last_name = profile.last_name
    current_user.dob = profile.dob
    db.commit()
    db.refresh(current_user)
    return current_user

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

@router.put("/me/password")
def update_password(passwords: PasswordUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(passwords.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = get_password_hash(passwords.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
