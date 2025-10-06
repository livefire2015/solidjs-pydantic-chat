from pydantic_ai import Agent, RunContext
from dataclasses import dataclass
from typing import Optional
import asyncio

from models import ChatResponse, SharedState


@dataclass
class AgentDeps:
    """Dependencies for the agent"""
    user_id: Optional[str] = None


# Create the PydanticAI agent
agent = Agent[AgentDeps, str](
    'openai:gpt-4o-mini',  # Using a cost-effective model for demo
    instructions="""You are a helpful AI assistant.
    You can have conversations and help users with various tasks.
    Keep your responses conversational and helpful."""
)


@agent.tool
async def search_knowledge(ctx: RunContext[AgentDeps], query: str) -> str:
    """Search internal knowledge base"""
    # Simulate a knowledge search with a delay
    await asyncio.sleep(1)
    return f"Found relevant information about '{query}'. This is a simulated search result."


@agent.tool
async def calculate(ctx: RunContext[AgentDeps], expression: str) -> str:
    """Perform simple calculations"""
    try:
        # Basic safety check - only allow simple math expressions
        allowed_chars = set('0123456789+-*/().')
        if not all(c in allowed_chars or c.isspace() for c in expression):
            return "Error: Only basic math operations are allowed"

        result = eval(expression)
        return f"The result of {expression} is {result}"
    except Exception as e:
        return f"Error calculating {expression}: {str(e)}"


@agent.instructions
async def personalized_instructions(ctx: RunContext[AgentDeps]) -> str:
    """Generate instructions based on context"""
    if ctx.deps.user_id:
        return f"You are helping user {ctx.deps.user_id}. Be personalized and helpful."
    return "Provide helpful and accurate information to the user."