from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import httpx
import re
import json
import logging

from db.database import get_db
from db.models import User, Conversation, Message, SavedArticle
from api.routes.auth import get_current_user
from agent.llm import get_llm
from langchain_core.messages import SystemMessage, HumanMessage

router = APIRouter()
logger = logging.getLogger(__name__)


def _scrape_google_trends(lang: str = 'en') -> list[dict]:
    """Scrape trending topics from Google News RSS."""
    trending = []
    try:
        import xml.etree.ElementTree as ET
        
        # Determine region parameters for Google News
        lang_lower = lang.lower()
        
        # Default to US English
        hl, gl, ceid = "en-US", "US", "US:en"
        
        if lang_lower in ['en-in', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'ur']:
            hl, gl, ceid = "en-IN", "IN", "IN:en"
        elif lang_lower in ['en-uk', 'en-gb']:
            hl, gl, ceid = "en-GB", "GB", "GB:en"
        elif lang_lower in ['es', 'es-es', 'spanish']:
            hl, gl, ceid = "es-ES", "ES", "ES:es"
        elif lang_lower in ['fr', 'fr-fr', 'french']:
            hl, gl, ceid = "fr", "FR", "FR:fr"
        elif lang_lower in ['de', 'de-de', 'german']:
            hl, gl, ceid = "de", "DE", "DE:de"

        url = f"https://news.google.com/rss?hl={hl}&gl={gl}&ceid={ceid}"
        
        with httpx.Client(timeout=8, follow_redirects=True) as client:
            resp = client.get(url)
            root = ET.fromstring(resp.text)
            
        items = root.findall('.//item')
        titles = [item.find('title').text for item in items if item.find('title') is not None]

        # Convert to hashtag-like trends by extracting key noun phrases
        seen = set()
        stopwords = {'that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'says', 'said', 'after', 'over', 'were', 'what', 'when', 'which', 'there', 'their', 'about', 'news', 'report', 'latest', 'today', 'times', 'live', 'channel', 'free', 'online', 'watch', 'updates', 'headlines', 'breaking', 'world', 'service'}
        for title in titles:
            # Clean title: Remove source which is usually after ' - '
            if ' - ' in title:
                title = title.rsplit(' - ', 1)[0]
                
            title = re.sub(r'[^\w\s-]', '', title).strip()
            words = [w for w in title.split() if len(w) > 3 and w.lower() not in stopwords]
            
            if len(words) >= 2:
                tag = '#' + ''.join(w.capitalize() for w in words[:2]).replace('-', '')
                if tag not in seen:
                    seen.add(tag)
                    trending.append({
                        "tag": tag,
                        "label": ' '.join(w.capitalize() for w in words[:4])
                    })
                    
            if len(trending) >= 6:
                break
    except Exception as e:
        logger.warning(f"Google News RSS scrape failed: {e}")

    # Fallback static trends if scrape fails
    if not trending:
        trending = [
            {"tag": "#AI", "label": "Artificial Intelligence"},
            {"tag": "#ClimateChange", "label": "Climate Change"},
            {"tag": "#Technology", "label": "Technology"},
            {"tag": "#GlobalPolitics", "label": "Global Politics"},
            {"tag": "#Economics", "label": "Economics"},
            {"tag": "#Health", "label": "Health & Medicine"},
        ]

    # Explicitly translate the trends to the requested language using the LLM
    if lang.lower() not in ['en', 'english', 'en-in', 'en-us']:
        llm = get_llm(temperature=0.3)
        if llm:
            try:
                prompt = (
                    f"You are a translation assistant. Translate the following list of trending news topics into the language corresponding to code '{lang}'. "
                    f"Return ONLY valid JSON in the exact same structure: a list of objects with 'tag' and 'label' keys. "
                    f"Keep the tags as single words or camelCase. Keep labels concise."
                )
                response = llm.invoke([
                    SystemMessage(content=prompt),
                    HumanMessage(content=json.dumps(trending))
                ])
                # Find JSON block
                content = response.content
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1]
                translated = json.loads(content.strip())
                if isinstance(translated, list) and len(translated) > 0:
                    trending = translated
            except Exception as e:
                logger.warning(f"Trend translation failed: {e}")

    return trending


@router.get("/trending")
def get_trending(lang: str = 'en'):
    """Return real-time trending topics scraped from Google News."""
    topics = _scrape_google_trends(lang)
    return {"topics": topics}

class DigestResponse(BaseModel):
    draft_html: str
    message: str

@router.post("/send-digest", response_model=DigestResponse)
def send_digest(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate a professional email digest based on user preferences."""
    topics = current_user.preferences or "Global News, Technology"
    lang = current_user.languages or "en"
    
    # 1. We could scrape for these topics, but for speed, we ask the LLM to generate a professional overview 
    # of recent hypothetical developments in these fields, or summarize general knowledge.
    # In a full prod system, we would fetch fresh articles here.
    llm = get_llm(temperature=0.7)
    if not llm:
        raise HTTPException(status_code=500, detail="LLM not configured.")
        
    prompt = (
        f"You are an expert news curator. Generate a professional Daily Digest Email Draft for a user interested in: {topics}. "
        f"CRITICAL INSTRUCTION: Write the entire email IN THE TARGET LANGUAGE corresponding to: '{lang}'. "
        f"Format it beautifully using HTML (with inline styles, nice typography, maybe a header). "
        f"Include an engaging subject line at the top. Be professional, warm, and highly informative. "
        f"Make up 2-3 realistic recent news summaries for their topics to demonstrate the feature."
    )
    
    try:
        response = llm.invoke([SystemMessage(content=prompt)])
        email_content = response.content.strip()
        
        # Simulate sending the email (in production this would use smtplib/SendGrid)
        logger.info(f"SIMULATED SENDING EMAIL TO {current_user.email}:\n{email_content}")
        
        return {
            "draft_html": email_content,
            "message": f"Professional digest draft generated successfully in '{lang}'."
        }
    except Exception as e:
        logger.error(f"Error generating digest: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate email digest.")


@router.get("/activity")
def get_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return activity stats for the current user from the database."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)

    # Conversations today
    convs_today = db.query(func.count(Conversation.id)).filter(
        Conversation.user_id == current_user.id,
        Conversation.created_at >= today_start
    ).scalar() or 0

    # Total conversations
    convs_total = db.query(func.count(Conversation.id)).filter(
        Conversation.user_id == current_user.id
    ).scalar() or 0

    # Articles saved today
    saved_today = db.query(func.count(SavedArticle.id)).filter(
        SavedArticle.user_id == current_user.id,
        SavedArticle.created_at >= today_start
    ).scalar() or 0

    # Articles saved this week
    saved_week = db.query(func.count(SavedArticle.id)).filter(
        SavedArticle.user_id == current_user.id,
        SavedArticle.created_at >= week_start
    ).scalar() or 0

    # Total articles saved
    saved_total = db.query(func.count(SavedArticle.id)).filter(
        SavedArticle.user_id == current_user.id
    ).scalar() or 0

    # Messages sent today (user role)
    messages_today = db.query(func.count(Message.id)).join(
        Conversation, Message.conversation_id == Conversation.id
    ).filter(
        Conversation.user_id == current_user.id,
        Message.role == "user",
        Message.created_at >= today_start
    ).scalar() or 0

    # Last 5 recent conversations for quick access
    recent_convs = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).limit(3).all()

    return {
        "convs_today": convs_today,
        "convs_total": convs_total,
        "saved_today": saved_today,
        "saved_week": saved_week,
        "saved_total": saved_total,
        "messages_today": messages_today,
        "recent_conversations": [
            {"id": c.id, "title": c.title, "updated_at": c.updated_at.isoformat() if c.updated_at else ""}
            for c in recent_convs
        ],
        "member_since": current_user.created_at.strftime("%b %Y") if current_user.created_at else "N/A"
    }
