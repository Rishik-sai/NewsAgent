from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    first_name = Column(String, default="")
    last_name = Column(String, default="")
    dob = Column(String, default="") # Format: YYYY-MM-DD
    preferences = Column(Text, default="") # Comma-separated topics
    languages = Column(Text, default="") # JSON or comma-separated languages
    email_opt_in = Column(Integer, default=1) # 1 for True, 0 for False (SQLite boolean)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    saved_articles = relationship("SavedArticle", back_populates="user", cascade="all, delete-orphan")

class SavedArticle(Base):
    __tablename__ = "saved_articles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="SET NULL"), index=True, nullable=True)
    headline = Column(String)
    url = Column(String)
    source = Column(String)
    timestamp = Column(String)
    summary = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="saved_articles")
    conversation = relationship("Conversation", back_populates="saved_articles")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    saved_articles = relationship("SavedArticle", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    role = Column(String) # 'user' or 'agent'
    content = Column(Text)
    message_type = Column(String) # 'response', 'error'
    data_json = Column(Text) # JSON string for any additional data (e.g. articles)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    conversation = relationship("Conversation", back_populates="messages")
