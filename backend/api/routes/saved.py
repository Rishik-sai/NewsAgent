from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime as dt
import json

from db.database import get_db
from db.models import User, SavedArticle, Conversation
from api.routes.auth import get_current_user

router = APIRouter()

class SavedArticleCreate(BaseModel):
    headline: str
    url: str
    source: str
    timestamp: str
    summary: str
    conversation_id: int = None

class SavedArticleResponse(BaseModel):
    id: int
    headline: str
    url: str
    source: str
    timestamp: str
    summary: str
    conversation_id: int = None
    created_at: dt
    
    class Config:
        from_attributes = True

@router.post("/save", response_model=SavedArticleResponse)
def save_article(article: SavedArticleCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if already saved
    existing = db.query(SavedArticle).filter(SavedArticle.user_id == current_user.id, SavedArticle.url == article.url).first()
    if existing:
        return existing
        
    db_article = SavedArticle(
        user_id=current_user.id,
        conversation_id=article.conversation_id,
        headline=article.headline,
        url=article.url,
        source=article.source,
        timestamp=article.timestamp,
        summary=article.summary
    )
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

@router.delete("/save/{article_id}")
def unsave_article(article_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_article = db.query(SavedArticle).filter(SavedArticle.id == article_id, SavedArticle.user_id == current_user.id).first()
    if not db_article:
        raise HTTPException(status_code=404, detail="Saved article not found")
        
    db.delete(db_article)
    db.commit()
    return {"message": "Unsaved successfully"}

@router.get("/saved", response_model=List[SavedArticleResponse])
def get_saved_articles(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    articles = db.query(SavedArticle).filter(SavedArticle.user_id == current_user.id).order_by(SavedArticle.created_at.desc()).all()
    return articles
