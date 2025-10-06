from pydantic import BaseModel
from typing import Optional


class ChatResponse(BaseModel):
    """Response model for chat messages"""
    message: str
    confidence: float = 1.0
    sources: Optional[list[str]] = None


class SharedState(BaseModel):
    """Shared state model for UI synchronization"""
    conversation_id: str = "default"
    user_preferences: dict = {}
    context: str = ""