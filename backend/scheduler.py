from apscheduler.schedulers.background import BackgroundScheduler
from db.database import SessionLocal
from db.models import User
from agent.tools.news_api import fetch_everything
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scheduler")

def send_daily_news_email():
    logger.info("Starting daily news email job...")
    db = SessionLocal()
    try:
        # Find users opted in
        users = db.query(User).filter(User.email_opt_in == 1).all()
        for user in users:
            logger.info(f"Generating news for {user.email} (Topics: {user.preferences})")
            
            # Simple simulation: fetch news based on first preference or generic topic
            topic = user.preferences.split(",")[0] if user.preferences else "World News"
            articles = fetch_everything(query=topic)
            
            top_articles = articles[:3] # take top 3
            
            logger.info(f"--- EMAIL TO: {user.email} ---")
            logger.info(f"Subject: Your Daily News Update - {topic}")
            logger.info(f"Hi {user.first_name},\nHere is your daily update based on your preferences:")
            for art in top_articles:
                logger.info(f"- {art.get('title')} ({art.get('url')})")
            logger.info("----------------------------------\n")
            
    except Exception as e:
        logger.error(f"Error sending daily emails: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Schedule to run every day at 8:00 AM. 
    # For testing purposes, you could change this to minutes=1 to see it run repeatedly.
    scheduler.add_job(send_daily_news_email, 'cron', hour=8, minute=0)
    scheduler.start()
    logger.info("APScheduler started for daily news emails.")
