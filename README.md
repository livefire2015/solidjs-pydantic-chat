# SolidJS + PydanticAI Chat Application

A modern chat application demonstrating the integration of **SolidJS** (frontend) with **PydanticAI** (backend) using the **AG-UI protocol** for real-time streaming communication.

## Architecture

- **Frontend**: SolidJS + TailwindCSS
- **Backend**: FastAPI + PydanticAI
- **Communication**: RESTful API for chat messages
- **Build System**: Vite for frontend, uv for Python backend

## Features

- ✅ AI-powered chat with PydanticAI
- ✅ Tool execution (calculator, knowledge search)
- ✅ Type-safe communication using Pydantic and TypeScript
- ✅ Clean, modern UI with TailwindCSS styling
- ✅ Fast development with hot reload
- ✅ Professional project structure following FastAPI conventions

## Prerequisites

- **Node.js** (v16+)
- **Python** (3.11+)
- **uv** (Python package manager)
- **OpenAI API Key** (for the AI agent)

## Setup

### 1. Install Frontend Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Set up Backend

The backend is already set up with `uv`. Dependencies are managed in `app/pyproject.toml`.

### 3. Configure Environment

Create a `.env` file in the `app/` directory:

```bash
cd app
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## Running the Application

### Option 1: Run Both Frontend and Backend Together

```bash
npm run dev:full
```

This will start:
- Backend server on `http://localhost:8000`
- Frontend dev server on `http://localhost:5173`

### Option 2: Run Separately

**Backend:**
```bash
npm run backend
# OR
cd app && uv run python -m uvicorn main:app --reload
```

**Frontend:**
```bash
npm run dev
```

## Usage

1. Open your browser to `http://localhost:5173`
2. Start chatting with the AI assistant
3. Try these example prompts:
   - "What is 2 + 2?" (triggers calculator tool)
   - "Search for information about Python" (triggers knowledge search tool)
   - "How are you today?" (general conversation)

## Project Structure

```
├── app/                     # Python backend (follows FastAPI conventions)
│   ├── __init__.py          # Python package
│   ├── main.py              # FastAPI app entry point
│   ├── agent.py             # PydanticAI agent with tools
│   ├── models.py            # Pydantic data models
│   ├── .env                 # Environment variables (not in git)
│   ├── .env.example         # Environment variables template
│   ├── pyproject.toml       # uv project configuration
│   ├── uv.lock              # Dependency lock file
│   └── .venv/               # Virtual environment
├── src/                     # SolidJS frontend
│   ├── components/
│   │   ├── ChatInterface.tsx # Main chat UI container
│   │   ├── MessageList.tsx   # Display messages
│   │   └── MessageInput.tsx  # User input component
│   ├── services/
│   │   ├── agui-service.ts   # Chat service for API communication
│   │   └── types.ts          # TypeScript type definitions
│   └── App.tsx              # Main app component
└── package.json             # Frontend dependencies & scripts
```

## Key Technologies

- **[SolidJS](https://solidjs.com/)**: Reactive UI framework
- **[PydanticAI](https://ai.pydantic.dev/)**: Type-safe AI agent framework
- **[FastAPI](https://fastapi.tiangolo.com/)**: Modern Python web framework
- **[TailwindCSS](https://tailwindcss.com/)**: Utility-first CSS framework
- **[uv](https://github.com/astral-sh/uv)**: Fast Python package manager

## API Endpoints

- `GET /` - Health check
- `POST /agent` - Chat endpoint for AI messages
- `GET /health` - Backend health status

## Development

### Frontend Scripts

- `npm run dev` - Start frontend dev server
- `npm run build` - Build for production
- `npm run serve` - Preview production build

### Backend Scripts

- `npm run backend` - Start backend server
- `cd app && uv add <package>` - Add Python dependencies

## Troubleshooting

### Common Issues

1. **Backend fails to start**: Make sure OpenAI API key is set in `app/.env`
2. **CORS errors**: Verify backend is running on port 8000
3. **Build errors**: Try `npm install --legacy-peer-deps`
4. **Import errors**: Make sure you're running from the correct directory

### Debug Mode

The backend runs with reload enabled by default. For additional debugging:

```bash
cd app
OPENAI_API_KEY="your-key" uv run python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Running with uvicorn directly

You can also run the backend using the standard uvicorn command:

```bash
uvicorn app.main:app --reload
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## License

MIT
