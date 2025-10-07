import os
import json
import time
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, AsyncGenerator

from agent import agent, AgentDeps
from models import SharedState


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    message: str


# Set OpenAI API key from environment
# You'll need to set this in your environment: export OPENAI_API_KEY="your-key-here"
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("Warning: OPENAI_API_KEY not set. The agent won't work without it.")

app = FastAPI(title="Chat App Backend", version="1.0.0")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # SolidJS dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Chat App Backend is running!"}


@app.post("/agent")
async def run_agent(request: ChatRequest) -> ChatResponse:
    """Handle chat requests from frontend"""
    try:
        # Create dependencies for this request
        deps = AgentDeps(user_id="default_user")

        # Get the last user message
        last_message = request.messages[-1].content if request.messages else "Hello"

        # Run the agent
        result = await agent.run(last_message, deps=deps)

        return ChatResponse(message=result.output)
    except Exception as e:
        print(f"Error running agent: {e}")
        # Return error as response
        return ChatResponse(message=f"Error: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Backend is running"}


async def generate_agui_events(request: ChatRequest) -> AsyncGenerator[str, None]:
    """Generate AG-UI protocol events for streaming response"""
    run_id = str(uuid.uuid4())

    try:
        # Emit RUN_STARTED event
        run_started_event = {
            "type": "RUN_STARTED",
            "timestamp": int(time.time() * 1000),
            "runId": run_id
        }
        yield f"data: {json.dumps(run_started_event)}\n\n"

        # Create shared state and state callback for streaming state updates
        shared_state = SharedState(conversation_id=run_id)

        def state_callback(state: SharedState):
            """Callback to emit state events when state changes"""
            state_event = {
                "type": "STATE_SNAPSHOT",
                "timestamp": int(time.time() * 1000),
                "state": state.model_dump()
            }
            # Note: This would need to be yielded in a real streaming scenario
            # For now, we'll collect state changes and emit them after

        # Create dependencies for this request
        deps = AgentDeps(
            user_id="default_user",
            state=shared_state,
            state_callback=state_callback
        )

        # Emit initial state snapshot
        initial_state_event = {
            "type": "STATE_SNAPSHOT",
            "timestamp": int(time.time() * 1000),
            "state": shared_state.model_dump()
        }
        yield f"data: {json.dumps(initial_state_event)}\n\n"

        # Get the last user message
        last_message = request.messages[-1].content if request.messages else "Hello"

        # Add initial thoughts
        deps.add_thought(f"Received user message: {last_message}")
        deps.set_task("Processing Request", "Analyzing user input")

        # Emit state update after initial thoughts
        state_update_event = {
            "type": "STATE_DELTA",
            "timestamp": int(time.time() * 1000),
            "delta": {
                "agent_thoughts": shared_state.agent_thoughts,
                "current_task": shared_state.current_task,
                "current_step": shared_state.current_step,
                "version": shared_state.version
            }
        }
        yield f"data: {json.dumps(state_update_event)}\n\n"

        # Run the agent
        result = await agent.run(last_message, deps=deps)

        # Emit final state snapshot
        final_state_event = {
            "type": "STATE_SNAPSHOT",
            "timestamp": int(time.time() * 1000),
            "state": shared_state.model_dump()
        }
        yield f"data: {json.dumps(final_state_event)}\n\n"

        # Emit TEXT_MESSAGE_CONTENT event with the response
        text_content_event = {
            "type": "TEXT_MESSAGE_CONTENT",
            "timestamp": int(time.time() * 1000),
            "content": result.output,
            "delta": False
        }
        yield f"data: {json.dumps(text_content_event)}\n\n"

        # Mark task as completed
        deps.set_task("Request Completed", "Response generated")
        deps.set_progress(1.0)

        # Emit final state update
        completion_state_event = {
            "type": "STATE_DELTA",
            "timestamp": int(time.time() * 1000),
            "delta": {
                "current_task": shared_state.current_task,
                "current_step": shared_state.current_step,
                "progress": shared_state.progress,
                "version": shared_state.version
            }
        }
        yield f"data: {json.dumps(completion_state_event)}\n\n"

        # Emit RUN_FINISHED event
        run_finished_event = {
            "type": "RUN_FINISHED",
            "timestamp": int(time.time() * 1000),
            "runId": run_id,
            "result": {"message": result.output}
        }
        yield f"data: {json.dumps(run_finished_event)}\n\n"

    except Exception as e:
        # Emit RUN_ERROR event on failure
        error_event = {
            "type": "RUN_ERROR",
            "timestamp": int(time.time() * 1000),
            "runId": run_id,
            "error": str(e)
        }
        yield f"data: {json.dumps(error_event)}\n\n"


@app.post("/agent/stream")
async def stream_agent(request: ChatRequest):
    """AG-UI Protocol compliant SSE endpoint for streaming agent responses"""
    return StreamingResponse(
        generate_agui_events(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


def main():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
