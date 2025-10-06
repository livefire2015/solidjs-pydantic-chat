import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from pydantic import BaseModel
from typing import List

from agent import agent, AgentDeps


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

        return ChatResponse(message=result.data)
    except Exception as e:
        print(f"Error running agent: {e}")
        # Return error as response
        return ChatResponse(message=f"Error: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Backend is running"}


def main():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
