from pydantic_ai import Agent, RunContext
from dataclasses import dataclass
from typing import Optional, Callable, Any
import asyncio
import uuid
from datetime import datetime

from models import ChatResponse, SharedState, AgentProposal


@dataclass
class AgentDeps:
    """Dependencies for the agent"""
    user_id: Optional[str] = None
    state: SharedState = None
    state_callback: Optional[Callable[[SharedState], None]] = None

    def __post_init__(self):
        if self.state is None:
            self.state = SharedState()

    def update_state(self, **kwargs):
        """Update the shared state and trigger callback"""
        for key, value in kwargs.items():
            if hasattr(self.state, key):
                setattr(self.state, key, value)

        self.state.version += 1
        self.state.last_updated = datetime.now().isoformat()

        if self.state_callback:
            self.state_callback(self.state)

    def add_thought(self, thought: str):
        """Add a thought to the agent's reasoning chain"""
        self.state.agent_thoughts.append(f"{datetime.now().strftime('%H:%M:%S')} - {thought}")
        self.state.reasoning_chain.append(thought)
        self.update_state()

    def set_task(self, task: str, step: str = None):
        """Set the current task and optional step"""
        self.state.current_task = task
        self.state.current_step = step
        self.update_state()

    def set_progress(self, progress: float):
        """Update task progress (0.0 to 1.0)"""
        self.state.progress = min(max(progress, 0.0), 1.0)
        self.update_state()

    def create_proposal(self, action: str, description: str, parameters: dict, reasoning: str, confidence: float = 0.8):
        """Create a proposal for human review"""
        proposal = AgentProposal(
            id=str(uuid.uuid4()),
            action=action,
            description=description,
            parameters=parameters,
            reasoning=reasoning,
            confidence=confidence
        )
        self.state.proposals.append(proposal)
        self.update_state()
        return proposal


# Create the PydanticAI agent
agent = Agent[AgentDeps, str](
    'openai:gpt-4o-mini',  # Using a cost-effective model for demo
    instructions="""You are a helpful AI assistant with human-in-the-loop collaboration.

    You should:
    1. Share your thought process by adding thoughts frequently
    2. Break down complex tasks into steps
    3. Update progress as you work
    4. Create proposals for significant actions
    5. Be transparent about your reasoning

    Keep your responses conversational and helpful."""
)


@agent.tool
async def search_knowledge(ctx: RunContext[AgentDeps], query: str) -> str:
    """Search internal knowledge base"""
    ctx.deps.add_thought(f"Starting knowledge search for: {query}")
    ctx.deps.set_task("Knowledge Search", f"Searching for: {query}")
    ctx.deps.set_progress(0.2)

    # Simulate a knowledge search with a delay
    await asyncio.sleep(1)
    ctx.deps.set_progress(0.8)

    result = f"Found relevant information about '{query}'. This is a simulated search result."
    ctx.deps.add_thought(f"Knowledge search completed successfully")
    ctx.deps.set_progress(1.0)

    return result


@agent.tool
async def calculate(ctx: RunContext[AgentDeps], expression: str) -> str:
    """Perform simple calculations"""
    ctx.deps.add_thought(f"Starting calculation: {expression}")
    ctx.deps.set_task("Mathematical Calculation", f"Computing: {expression}")
    ctx.deps.set_progress(0.1)

    try:
        # Basic safety check - only allow simple math expressions
        allowed_chars = set('0123456789+-*/().')
        if not all(c in allowed_chars or c.isspace() for c in expression):
            ctx.deps.add_thought("Calculation failed: Invalid characters detected")
            return "Error: Only basic math operations are allowed"

        ctx.deps.set_progress(0.5)
        result = eval(expression)

        ctx.deps.add_thought(f"Calculation completed: {expression} = {result}")
        ctx.deps.set_progress(1.0)

        return f"The result of {expression} is {result}"
    except Exception as e:
        ctx.deps.add_thought(f"Calculation error: {str(e)}")
        return f"Error calculating {expression}: {str(e)}"


@agent.tool
async def create_document_proposal(ctx: RunContext[AgentDeps], title: str, content: str, doc_type: str = "text") -> str:
    """Create a proposal for document creation that requires human approval"""
    ctx.deps.add_thought(f"Preparing to create document proposal: {title}")
    ctx.deps.set_task("Document Creation", f"Proposing: {title}")

    proposal = ctx.deps.create_proposal(
        action="create_document",
        description=f"Create a {doc_type} document titled '{title}'",
        parameters={
            "title": title,
            "content": content,
            "type": doc_type
        },
        reasoning=f"User requested creation of a {doc_type} document. Content appears appropriate and safe.",
        confidence=0.9
    )

    ctx.deps.add_thought(f"Created proposal {proposal.id} for human review")
    return f"I've created a proposal to create the document '{title}'. Please review it in the state panel before I proceed."


@agent.tool
async def analyze_data_with_reasoning(ctx: RunContext[AgentDeps], data_description: str, analysis_type: str) -> str:
    """Perform data analysis while showing step-by-step reasoning"""
    ctx.deps.add_thought(f"Starting {analysis_type} analysis of: {data_description}")
    ctx.deps.set_task("Data Analysis", f"{analysis_type} analysis")
    ctx.deps.set_progress(0.1)

    # Simulate multi-step analysis
    steps = [
        "Loading and validating data structure",
        "Cleaning and preprocessing data",
        "Applying statistical methods",
        "Interpreting results",
        "Generating insights"
    ]

    for i, step in enumerate(steps):
        ctx.deps.add_thought(f"Step {i+1}: {step}")
        ctx.deps.set_progress((i + 1) / len(steps) * 0.8)
        await asyncio.sleep(0.5)  # Simulate processing time

    # Create working memory entry
    ctx.deps.state.working_memory["last_analysis"] = {
        "type": analysis_type,
        "data": data_description,
        "timestamp": datetime.now().isoformat()
    }

    ctx.deps.add_thought("Analysis completed successfully")
    ctx.deps.set_progress(1.0)

    return f"Completed {analysis_type} analysis of {data_description}. Key findings: [Simulated insights based on the analysis type and data description]"


@agent.instructions
async def personalized_instructions(ctx: RunContext[AgentDeps]) -> str:
    """Generate instructions based on context"""
    if ctx.deps.user_id:
        return f"You are helping user {ctx.deps.user_id}. Be personalized and helpful."
    return "Provide helpful and accurate information to the user."