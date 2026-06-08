from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime as dt, timezone
import json
import logging

logger = logging.getLogger(__name__)

from agent.graph import app as agent_app
from langchain_core.messages import HumanMessage, AIMessage
from db.database import get_db, SessionLocal
from db.models import User, Conversation, Message
from api.routes.auth import get_current_user

from jose import JWTError, jwt
from config import settings

router = APIRouter()

class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: dt
    
    class Config:
        from_attributes = True

@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conversations = db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc()).all()
    return conversations

@router.get("/conversations/{conv_id}")
def get_conversation_messages(conv_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = db.query(Message).filter(Message.conversation_id == conv_id).order_by(Message.created_at.asc()).all()
    
    result = []
    for msg in messages:
        item = {
            "role": msg.role,
            "type": msg.message_type,
            "content": msg.content
        }
        if msg.data_json:
            try:
                item["data"] = json.loads(msg.data_json)
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse data_json for message {msg.id}")
        result.append(item)
    return result

@router.delete("/conversations/{conv_id}")
def delete_conversation(conv_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # With cascade="all, delete-orphan" on relationships, deleting the conversation
    # will automatically delete associated messages. SavedArticles have SET NULL on conversation_id.
    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted successfully"}

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_json(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)

manager = ConnectionManager()

def _authenticate_ws_token(token: str) -> Optional[str]:
    """Verify a JWT token and return the user email, or None if invalid."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        return email
    except JWTError:
        return None

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str, token: Optional[str] = Query(None)):
    # Authenticate via JWT token passed as query parameter
    if token:
        authenticated_email = _authenticate_ws_token(token)
        if not authenticated_email:
            await websocket.close(code=4001, reason="Invalid authentication token")
            return
        # Use the authenticated email as the client_id for security
        client_id = authenticated_email
    
    await manager.connect(client_id, websocket)
    
    try:
        while True:
            raw_message = await websocket.receive_text()
            
            try:
                msg_data = json.loads(raw_message)
                query = msg_data.get("query", raw_message)
                language = msg_data.get("language", "en-in")
                conversation_id = msg_data.get("conversation_id")
                agent_type = msg_data.get("agent_type", "general")
            except (json.JSONDecodeError, TypeError):
                query = raw_message
                language = "en-in"
                conversation_id = None
                agent_type = "general"
                
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.email == client_id).first()
                if not user:
                    await manager.send_json(client_id, {"type": "error", "message": "User not found"})
                    continue

                if not conversation_id:
                    conv = Conversation(user_id=user.id, title=query[:50] + "..." if len(query) > 50 else query)
                    db.add(conv)
                    db.commit()
                    db.refresh(conv)
                    conversation_id = conv.id
                    await manager.send_json(client_id, {"type": "conversation_created", "conversation_id": conversation_id})
                
                # Save user message
                user_msg = Message(
                    conversation_id=conversation_id,
                    role="user",
                    content=query,
                    message_type="message"
                )
                db.add(user_msg)
                db.commit()
                
                # Fetch history for context
                past_messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
                chat_history = []
                for pm in past_messages:
                    if pm.role == "user":
                        chat_history.append(HumanMessage(content=pm.content or ""))
                    elif pm.role == "agent":
                        # We reconstruct AI message from content or data_json message
                        content = pm.content
                        if not content and pm.data_json:
                            try:
                                data = json.loads(pm.data_json)
                                content = data.get("message", "")
                            except json.JSONDecodeError:
                                logger.warning(f"Failed to parse data_json for message {pm.id}")
                        chat_history.append(AIMessage(content=content or ""))
                
                await manager.send_json(client_id, {"type": "status", "message": "Analyzing your query..."})
                
                state = {
                    "messages": chat_history,
                    "client_id": client_id,
                    "agent_type": agent_type,
                    "intent": "chat",
                    "topic": "",
                    "queries": [],
                    "date_from": "",
                    "date_to": "",
                    "language": language,
                    "raw_articles": [],
                    "translated_articles": [],
                    "response": {}
                }
                
                response_payload = {}
                async for event in agent_app.astream_events(state, version="v2"):
                    kind = event["event"]
                    tags = event.get("tags", [])
                    
                    if kind == "on_chat_model_stream" and "formatter_llm" in tags:
                        chunk = event["data"]["chunk"]
                        if chunk.content:
                            await manager.send_json(client_id, {
                                "type": "stream_chunk", 
                                "content": chunk.content
                            })
                            
                    elif kind == "on_chain_end":
                        node_name = event["name"]
                        node_output = event["data"].get("output", {})
                        
                        if node_name == "intent" and isinstance(node_output, dict):
                            intent = node_output.get("intent", "chat")
                            topic = node_output.get("topic", "")
                            if intent == "search":
                                queries = node_output.get("queries", [])
                                await manager.send_json(client_id, {
                                    "type": "status", 
                                    "message": f"Searching for news on \"{topic or ', '.join(queries)}\"..."
                                })
                            elif intent == "preference":
                                await manager.send_json(client_id, {"type": "status", "message": "Updating preferences..."})
                            else:
                                await manager.send_json(client_id, {"type": "status", "message": "Thinking..."})
                                
                        elif node_name == "fetcher" and isinstance(node_output, dict):
                            raw_count = len(node_output.get("raw_articles", []))
                            await manager.send_json(client_id, {"type": "status", "message": f"Found {raw_count} articles. Preparing digest..."})
                                
                        elif node_name == "formatter" and isinstance(node_output, dict):
                            response_payload = node_output.get("response", {})
                
                # Save agent response
                agent_msg = Message(
                    conversation_id=conversation_id,
                    role="agent",
                    message_type="response",
                    content=response_payload.get("message", ""),
                    data_json=json.dumps(response_payload)
                )
                db.add(agent_msg)
                
                # Update conversation timestamp
                conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
                if conv:
                    conv.updated_at = dt.now(timezone.utc)
                db.commit()
                
                await manager.send_json(client_id, {
                    "type": "response",
                    "data": response_payload
                })
                
            finally:
                db.close()
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"Error handling WebSocket for {client_id}: {e}", exc_info=True)
        try:
            await manager.send_json(client_id, {"type": "error", "message": f"Oops! An internal error occurred: {str(e)}"})
        except Exception:
            pass
        manager.disconnect(client_id)
