from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class ChatResponse(BaseModel):
    """Response model for chat messages"""
    message: str
    confidence: float = 1.0
    sources: Optional[list[str]] = None


class AgentProposal(BaseModel):
    """Model for agent proposals requiring human review"""
    id: str
    action: str
    description: str
    parameters: Dict[str, Any]
    reasoning: str
    confidence: float
    requires_approval: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class SharedState(BaseModel):
    """Shared state model for UI synchronization with human-in-the-loop features"""
    conversation_id: str = "default"
    user_preferences: Dict[str, Any] = {}
    context: str = ""

    # Human-in-the-loop state
    agent_thoughts: List[str] = []
    current_task: Optional[str] = None
    current_step: Optional[str] = None
    progress: float = 0.0
    proposals: List[AgentProposal] = []

    # State versioning for delta tracking
    version: int = 1
    last_updated: str = Field(default_factory=lambda: datetime.now().isoformat())

    # Agent reasoning state
    reasoning_chain: List[str] = []
    working_memory: Dict[str, Any] = {}
    next_actions: List[str] = []