# NEWSAgent 📰🤖

**NEWSAgent** is a full-stack, AI-powered personal news assistant built with a **multi-agent LangGraph architecture**. It delivers personalized, real-time news updates across various topics and languages — featuring specialized agents for General, Tech, Finance, and Sports news, real-time WebSocket streaming, AI-powered translation into 19+ languages, user activity insights, and automated daily email digests.

> 🔗 **Live Demo:** [https://newsagent.vercel.app](https://newsagent.vercel.app) _(Frontend)_ · [https://newsagent-backend.onrender.com](https://newsagent-backend.onrender.com) _(Backend API)_

---

## 📑 Table of Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [LangGraph Agent Pipeline](#-langgraph-agent-pipeline)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone the Repository](#1-clone-the-repository)
  - [Backend Setup](#2-backend-setup)
  - [Frontend Setup](#3-frontend-setup)
  - [Docker Setup](#4-docker-setup-optional)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
  - [Backend on Render](#backend-on-render)
  - [Frontend on Vercel](#frontend-on-vercel)
- [Supported Languages](#-supported-languages)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🤖 Multi-Agent Architecture
NEWSAgent uses a hub-and-spoke agent model. Users pick a specialized agent from the **Agent Hub**, and all queries within that session are contextually enriched based on the selected domain:

| Agent | Domain | Specialization |
|-------|--------|----------------|
| 🌐 **General** | Global News | Broad coverage across all topics — politics, science, entertainment, world events |
| 💻 **Tech** | Technology | AI, startups, gadgets, software development, cybersecurity |
| 📈 **Finance** | Markets & Economy | Stock prices, market updates, economic trends, crypto, fintech |
| 🏅 **Sports** | Athletics | Live scores, match highlights, transfers, tournament coverage |

### 📡 Real-Time News Fetching
- **Primary source:** [NewsAPI](https://newsapi.org/) — queries both `/top-headlines` and `/everything` endpoints with domain-restricted, relevancy-sorted results from 20+ premium sources (BBC, CNN, Reuters, Bloomberg, TechCrunch, NDTV, etc.)
- **Fallback source:** [DuckDuckGo Search](https://duckduckgo.com/) — automatic fallback when NewsAPI is unavailable or returns no results
- **Smart deduplication:** Articles are deduplicated by URL and filtered to remove `[Removed]` entries
- **Broadening fallback:** If fewer than 5 articles are found, a secondary broader query is triggered to ensure adequate coverage

### 🌍 AI-Powered Multilingual Support
- **Real-time translation** of article headlines and summaries into 19+ Indian and international languages using LLM-based translation via Groq (Llama 3.3 70B)
- **UI localization** — the entire frontend interface (buttons, labels, headings, status messages) is fully translated using a custom `useTranslation` hook with a comprehensive `translations.ts` file containing 99,000+ characters of translation data
- **Trending topics translation** — Google News trending topics are dynamically translated into the user's preferred language

### 💬 Real-Time Chat with WebSocket Streaming
- **WebSocket-based communication** for instant, bidirectional messaging
- **Token-by-token streaming** — LLM responses are streamed in real-time as they are generated (using LangGraph's `astream_events` with v2 protocol), so users see responses appearing word by word
- **Live status updates** — users see contextual progress messages like _"Analyzing your query..."_, _"Searching for news on 'AI'..."_, _"Found 12 articles. Preparing digest..."_
- **Chat history persistence** — all conversations and messages are stored in the database with full replay support

### 📊 Activity Insights Dashboard
- Conversations today / total
- Articles saved today / this week / total
- Messages sent today
- Recent conversation quick-access list
- Member since date

### 📰 Trending Topics
- Scraped live from **Google News RSS** feeds with region-aware localization (India, US, UK, Spain, France, Germany)
- Extracted into hashtag-formatted trend labels with intelligent stopword filtering
- Click-to-search — clicking a trend auto-sends it as a chat query

### 🔖 Save & Bookmark Articles
- Save any article from chat results with one click
- Dedicated **Saved Articles** page with full article metadata
- Unsave articles to declutter your reading list

### 📧 Personalized Daily Email Digests
- **APScheduler** runs a background cron job at **8:00 AM daily**
- Fetches fresh news based on each user's saved topic preferences
- Generates professional, HTML-formatted email digests via LLM
- Users can opt in/out of email notifications from their profile

### 🔐 Authentication & User Management
- **JWT-based authentication** with secure bcrypt password hashing
- User registration with profile details (name, DOB, preferences, email opt-in)
- Profile management — update personal info, preferences, language, and password
- Protected routes with automatic redirect to login

### 🎨 Premium UI/UX
- **Dark/Light mode** with system preference detection and localStorage persistence
- **Glassmorphism** design with ambient gradient glows and smooth animations
- **Google Fonts (Outfit)** for premium typography
- Fully responsive layout with sidebar, chat area, and insights panel
- Lucide React icons throughout

---

## 📸 Screenshots

> _Add your screenshots here_

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React + Vite)                    │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ AgentHub │  │ ChatArea │  │ Insights │  │ Sidebar            │  │
│  │ (Home)   │  │ (WebSkt) │  │ Panel    │  │ (Nav/Conversations)│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────────────────┘  │
│       │              │              │                                │
│       └──────────────┼──────────────┘                                │
│                      │ WebSocket (ws://...:8000/api/chat/ws/{id})    │
│                      │ REST API  (http://...:8000/api/*)             │
└──────────────────────┼──────────────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────────────┐
│                      ▼      BACKEND (FastAPI)                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  API Layer (FastAPI Routes)                  │    │
│  │  /api/auth/*   /api/chat/*   /api/news/*   /api/insights/*  │    │
│  └─────────────────────────┬───────────────────────────────────┘    │
│                            │                                        │
│  ┌─────────────────────────▼───────────────────────────────────┐    │
│  │              LangGraph Agent Pipeline                        │    │
│  │                                                              │    │
│  │  Intent ──┬──▶ Fetcher ──▶ Translator ──▶ Formatter ──▶ END │    │
│  │  Classifier│                                                 │    │
│  │           └──────────────────────────────▶ Formatter ──▶ END │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                            │                                        │
│  ┌─────────────────────────▼───────────────────────────────────┐    │
│  │                  Data Layer                                  │    │
│  │  SQLAlchemy ORM ──▶ PostgreSQL (prod) / SQLite (dev)         │    │
│  │  Alembic Migrations                                          │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  External Services                                           │    │
│  │  • Groq API (Llama 3.3 70B Versatile)                        │    │
│  │  • NewsAPI (top-headlines + everything)                       │    │
│  │  • DuckDuckGo News (fallback)                                │    │
│  │  • Google News RSS (trending topics)                         │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Background Jobs (APScheduler)                               │    │
│  │  • Daily email digest at 8:00 AM                             │    │
│  └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://react.dev/) | 19.2 | UI library for building component-based interfaces |
| [TypeScript](https://www.typescriptlang.org/) | 6.0 | Static type checking for JavaScript |
| [Vite](https://vitejs.dev/) | 8.0 | Lightning-fast frontend build tool and dev server |
| [Tailwind CSS](https://tailwindcss.com/) | 4.3 | Utility-first CSS framework for rapid styling |
| [React Router DOM](https://reactrouter.com/) | 7.16 | Client-side routing and navigation |
| [Lucide React](https://lucide.dev/) | 1.16 | Beautiful, consistent icon library |
| [React Markdown](https://remarkjs.github.io/react-markdown/) | 10.1 | Render Markdown content (LLM responses with inline links) |
| [jwt-decode](https://github.com/auth0/jwt-decode) | 4.0 | Decode JWT tokens client-side for user info extraction |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| [FastAPI](https://fastapi.tiangolo.com/) | Latest | High-performance async Python web framework |
| [LangGraph](https://langchain-ai.github.io/langgraph/) | Latest | Stateful, multi-step AI agent orchestration framework |
| [LangChain](https://www.langchain.com/) + Groq | Latest | LLM integration layer with Groq's ultra-fast inference |
| [Groq (Llama 3.3 70B)](https://groq.com/) | — | LLM provider for intent classification, summarization, and translation |
| [SQLAlchemy](https://www.sqlalchemy.org/) | Latest | Python SQL toolkit and ORM |
| [PostgreSQL](https://www.postgresql.org/) | 15 | Production relational database |
| [SQLite](https://www.sqlite.org/) | — | Lightweight local development database |
| [Alembic](https://alembic.sqlalchemy.org/) | Latest | Database migration tool for SQLAlchemy |
| [NewsAPI](https://newsapi.org/) | — | Real-time news data from 80,000+ sources |
| [APScheduler](https://apscheduler.readthedocs.io/) | Latest | Background task scheduler for cron jobs |
| [Pydantic Settings](https://docs.pydantic.dev/) | Latest | Environment variable management with validation |
| [python-jose](https://python-jose.readthedocs.io/) | Latest | JWT token creation and verification |
| [Passlib + bcrypt](https://passlib.readthedocs.io/) | Latest | Secure password hashing |
| [httpx](https://www.python-httpx.org/) | Latest | Async HTTP client for Google News RSS scraping |
| [Gunicorn](https://gunicorn.org/) + Uvicorn | Latest | Production ASGI server with multiple workers |

### Infrastructure & DevOps

| Technology | Purpose |
|------------|---------|
| [Docker](https://www.docker.com/) + Docker Compose | Containerized multi-service orchestration |
| [Nginx](https://nginx.org/) | Reverse proxy and static file serving (frontend) |
| [Render](https://render.com/) | Backend deployment with managed PostgreSQL |
| [Vercel](https://vercel.com/) | Frontend deployment with CDN |

---

## 📁 Project Structure

```
news-agent/
├── .env                        # Root environment variables (API keys, secrets)
├── .gitignore                  # Git ignore rules
├── docker-compose.yml          # Multi-container Docker orchestration
├── render.yaml                 # Render.com deployment configuration
├── README.md                   # This file
│
├── backend/                    # Python FastAPI backend
│   ├── Dockerfile              # Backend container (Python 3.11-slim + Gunicorn)
│   ├── requirements.txt        # Python dependencies
│   ├── config.py               # Pydantic settings (env var management)
│   ├── scheduler.py            # APScheduler for daily email digest cron job
│   ├── alembic.ini             # Alembic migration configuration
│   ├── alembic/                # Database migration scripts
│   │
│   ├── agent/                  # LangGraph AI Agent Pipeline
│   │   ├── graph.py            # StateGraph definition & compilation
│   │   ├── state.py            # NewsAgentState TypedDict schema
│   │   ├── llm.py              # Shared LLM factory (ChatGroq wrapper)
│   │   ├── nodes/              # LangGraph processing nodes
│   │   │   ├── intent.py       # Intent classifier (search/preference/chat)
│   │   │   ├── fetcher.py      # News article fetcher with deduplication
│   │   │   ├── personalizer.py # Multilingual article translator
│   │   │   └── formatter.py    # LLM-powered response formatter
│   │   └── tools/              # External service integrations
│   │       └── news_api.py     # NewsAPI client + DuckDuckGo fallback
│   │
│   ├── api/                    # FastAPI application layer
│   │   ├── main.py             # App factory, CORS, router registration, lifespan
│   │   └── routes/             # API route handlers
│   │       ├── auth.py         # Authentication (register, login, profile, password)
│   │       ├── chat.py         # WebSocket chat endpoint + conversation CRUD
│   │       ├── saved.py        # Saved articles CRUD
│   │       └── insights.py     # Trending topics, activity stats, email digest
│   │
│   ├── core/                   # Core utilities
│   │   └── security.py         # Password hashing (bcrypt) + JWT token creation
│   │
│   └── db/                     # Database layer
│       ├── database.py         # SQLAlchemy engine, session, Base
│       └── models.py           # ORM models (User, Conversation, Message, SavedArticle)
│
└── frontend/                   # React TypeScript frontend
    ├── Dockerfile              # Multi-stage build (Node 18 → Nginx Alpine)
    ├── nginx.conf              # Nginx reverse proxy + SPA fallback config
    ├── index.html              # HTML entry point with dark mode script & Google Fonts
    ├── package.json            # NPM dependencies and scripts
    ├── vite.config.ts          # Vite build configuration
    ├── tsconfig.json           # TypeScript configuration
    ├── postcss.config.js       # PostCSS plugins (Tailwind, Autoprefixer)
    │
    └── src/
        ├── main.tsx            # React app entry point with BrowserRouter
        ├── App.tsx             # Route definitions, ProtectedRoute, MainLayout
        ├── index.css           # Global styles (Tailwind imports, custom utilities)
        │
        ├── components/         # Reusable UI components
        │   ├── Sidebar.tsx     # Navigation sidebar with conversation list
        │   ├── ChatArea.tsx    # Chat interface with message rendering & input
        │   ├── InsightsPanel.tsx # Activity stats, trending topics, email digest
        │   └── NewsCard.tsx    # Individual news article card component
        │
        ├── pages/              # Page-level components
        │   ├── AgentHub.tsx    # Agent selection hub (home page)
        │   ├── Login.tsx       # User login form
        │   ├── Register.tsx    # User registration form
        │   ├── Preferences.tsx # User preferences & profile management
        │   ├── Saved.tsx       # Saved articles listing
        │   └── Language.tsx    # Language selection page
        │
        ├── hooks/              # Custom React hooks
        │   ├── useAuth.tsx     # JWT auth state management (login/logout/user)
        │   ├── useWebSocket.ts # WebSocket connection, streaming, message state
        │   └── useTranslation.ts # i18n hook for UI string translation
        │
        └── i18n/
            └── translations.ts # 99KB+ translation dictionary (19+ languages)
```

---

## 🧠 LangGraph Agent Pipeline

NEWSAgent's intelligence is powered by a **LangGraph StateGraph** — a directed acyclic graph (DAG) that orchestrates multi-step AI reasoning. Each user message flows through the following nodes:

```
                    ┌─────────────────┐
                    │   User Message   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Intent Classifier│
                    │  (LLM / Regex)  │
                    └────────┬────────┘
                             │
                   ┌─────────┴──────────┐
                   │                    │
            intent="search"       intent="chat"
                   │               or "preference"
                   ▼                    │
          ┌─────────────────┐           │
          │   News Fetcher   │           │
          │ (NewsAPI / DDGS) │           │
          └────────┬────────┘           │
                   │                    │
                   ▼                    │
          ┌─────────────────┐           │
          │   Translator     │           │
          │  (LLM Batch)    │           │
          └────────┬────────┘           │
                   │                    │
                   └────────┬───────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Response Formatter│
                   │  (LLM Streaming) │
                   └────────┬────────┘
                            │
                            ▼
                        ┌───────┐
                        │  END  │
                        └───────┘
```

### Node Details

#### 1. Intent Classifier (`intent.py`)
- **Input:** User's latest message + conversation history
- **LLM Mode:** Uses `Llama 3.3 70B` (temperature=0) to classify intent as `search`, `preference`, or `chat`
- **Extracts:** topic, search queries (1-3 keywords), date range (relative dates like "yesterday", "last week" parsed to ISO format)
- **Fallback Mode:** Keyword-based heuristic parsing when no API key is configured (useful for local development)

#### 2. News Fetcher (`fetcher.py`)
- **Triggered only for:** `intent == "search"`
- **Process:**
  1. Enriches queries with agent type context (e.g., appends "finance" to queries for the Finance agent)
  2. Calls `fetch_everything()` with date filters and domain restrictions
  3. Calls `fetch_top_headlines()` for additional coverage
  4. Deduplicates articles by URL and filters removed entries
  5. If < 5 results, executes a broader fallback query
- **Output:** Up to 15 raw articles with title, URL, description, source, and published timestamp

#### 3. Translator (`personalizer.py`)
- **Triggered only for:** `intent == "search"` with articles present
- **Skips translation for:** English (`en`, `en-in`)
- **Process:**
  1. Maps raw articles to standardized format (headline, source, timestamp, summary, URL)
  2. Batches all articles (up to 8) into a single LLM call
  3. LLM translates headlines and summaries into the target language using native script (not transliteration)
  4. Merges translations back into the article objects
- **Supported languages:** Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Odia, Malayalam, Punjabi, Assamese, English

#### 4. Response Formatter (`formatter.py`)
- **For search intent:** Uses `Llama 3.3 70B` (temperature=0.7, streaming=true) to generate a conversational summary of the articles with inline Markdown source links — all in the user's target language
- **For chat intent:** Generates a warm, conversational response in the target language, mentioning its news-fetching capabilities
- **For preference intent:** Returns localized confirmation messages (supports Spanish, French, Hindi, English fallback)
- **Output:** JSON payload with `greeting`, `message`, and `articles` array

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:-------------:|
| `POST` | `/api/auth/register` | Register a new user account | ❌ |
| `POST` | `/api/auth/login` | Login and receive JWT access token | ❌ |
| `GET` | `/api/auth/me` | Get current user profile | ✅ |
| `PUT` | `/api/auth/me/preferences` | Update preferences, language, email opt-in | ✅ |
| `PUT` | `/api/auth/me/profile` | Update first name, last name, DOB | ✅ |
| `PUT` | `/api/auth/me/password` | Change password (requires current password) | ✅ |

### Chat & Conversations

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:-------------:|
| `WS` | `/api/chat/ws/{client_id}?token={jwt}` | WebSocket for real-time chat | ✅ (via query param) |
| `GET` | `/api/chat/conversations` | List all user conversations (newest first) | ✅ |
| `GET` | `/api/chat/conversations/{id}` | Get all messages in a conversation | ✅ |
| `DELETE` | `/api/chat/conversations/{id}` | Delete a conversation and its messages | ✅ |

#### WebSocket Message Protocol

**Client → Server:**
```json
{
  "query": "Latest AI news",
  "language": "hi",
  "conversation_id": 5,
  "agent_type": "tech"
}
```

**Server → Client (Event Types):**
```json
// New conversation created
{ "type": "conversation_created", "conversation_id": 12 }

// Processing status updates
{ "type": "status", "message": "Analyzing your query..." }
{ "type": "status", "message": "Searching for news on \"AI\"..." }
{ "type": "status", "message": "Found 8 articles. Preparing digest..." }

// Streaming LLM tokens (word-by-word)
{ "type": "stream_chunk", "content": "Here" }
{ "type": "stream_chunk", "content": " are" }
{ "type": "stream_chunk", "content": " the" }

// Final complete response with articles
{
  "type": "response",
  "data": {
    "greeting": "Here's what I found on \"AI\"!",
    "message": "... full LLM summary with [inline links](https://...) ...",
    "articles": [
      {
        "headline": "OpenAI Launches New Model",
        "source": "TechCrunch",
        "timestamp": "2026-07-10T10:00:00Z",
        "summary": "...",
        "url": "https://..."
      }
    ]
  }
}

// Error
{ "type": "error", "message": "User not found" }
```

### Saved Articles

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:-------------:|
| `POST` | `/api/news/save` | Save/bookmark an article | ✅ |
| `GET` | `/api/news/saved` | Get all saved articles | ✅ |
| `DELETE` | `/api/news/save/{id}` | Remove a saved article | ✅ |

### Insights & Utilities

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:-------------:|
| `GET` | `/api/insights/trending?lang=en` | Get real-time trending topics from Google News | ❌ |
| `GET` | `/api/insights/activity` | Get user activity statistics | ✅ |
| `POST` | `/api/insights/send-digest` | Generate personalized email digest (HTML) | ✅ |

---

## 🗄 Database Schema

The application uses **SQLAlchemy ORM** with support for both **PostgreSQL** (production) and **SQLite** (development). Database migrations are managed with **Alembic**.

```
┌──────────────────────┐       ┌────────────────────────────┐
│        users          │       │       conversations         │
├──────────────────────┤       ├────────────────────────────┤
│ id (PK)              │──┐    │ id (PK)                    │
│ email (UNIQUE)       │  │    │ user_id (FK → users.id)    │◄─┐
│ hashed_password      │  │    │ title                      │  │
│ first_name           │  ├───▶│ created_at                 │  │
│ last_name            │  │    │ updated_at                 │  │
│ dob                  │  │    └──────────┬─────────────────┘  │
│ preferences          │  │               │                    │
│ languages            │  │               │ 1:N                │
│ email_opt_in         │  │               ▼                    │
│ created_at           │  │    ┌────────────────────────────┐  │
└──────────────────────┘  │    │         messages            │  │
                          │    ├────────────────────────────┤  │
                          │    │ id (PK)                    │  │
                          │    │ conversation_id (FK)       │  │
                          │    │ role ('user' | 'agent')    │  │
                          │    │ content                    │  │
                          │    │ message_type               │  │
                          │    │ data_json                  │  │
                          │    │ created_at                 │  │
                          │    └────────────────────────────┘  │
                          │                                    │
                          │    ┌────────────────────────────┐  │
                          │    │      saved_articles         │  │
                          │    ├────────────────────────────┤  │
                          └───▶│ id (PK)                    │  │
                               │ user_id (FK → users.id)    │  │
                               │ conversation_id (FK) ──────┘  │
                               │ headline                      │
                               │ url                           │
                               │ source                        │
                               │ timestamp                     │
                               │ summary                       │
                               │ created_at                    │
                               └────────────────────────────────┘
```

### Relationship Behavior
- **User → Conversations:** One-to-Many, `CASCADE` delete (deleting a user removes all conversations)
- **User → SavedArticles:** One-to-Many, `CASCADE` delete
- **Conversation → Messages:** One-to-Many, `CASCADE` delete (deleting a conversation removes all messages)
- **Conversation → SavedArticles:** One-to-Many, `SET NULL` on delete (saved articles persist even if the conversation is deleted)

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Minimum Version |
|-------------|-----------------|
| **Python** | 3.11+ |
| **Node.js** | 18+ |
| **npm** | 9+ |
| **Docker** _(optional)_ | 20+ |
| **PostgreSQL** _(production only)_ | 15+ |

You will also need API keys for:
- **Groq API** — [Get a free key at groq.com](https://console.groq.com/)
- **NewsAPI** — [Get a free key at newsapi.org](https://newsapi.org/register)

### 1. Clone the Repository

```bash
git clone https://github.com/Rishik-sai/NewsAgent.git
cd NewsAgent/news-agent
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

**Configure environment variables:**

Create a `.env` file in the project root (or `backend/`) with the following:

```env
GROQ_API_KEY="your_groq_api_key_here"
NEWS_API_KEY="your_newsapi_key_here"
JWT_SECRET="your_randomly_generated_secret_key"
ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"

# Optional: Override database (defaults to SQLite for local development)
# DATABASE_URL=postgresql://postgres:password@localhost:5432/newsagent
```

**Run the backend server:**

```bash
# Development mode with auto-reload
uvicorn api.main:app --reload --port 8000

# The API will be available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs (Swagger UI)
# Alternative docs at http://localhost:8000/redoc
```

### 3. Frontend Setup

```bash
# Navigate to frontend (from project root)
cd frontend

# Install Node.js dependencies
npm install

# Start development server
npm run dev

# The frontend will be available at http://localhost:5173
```

**Note:** The frontend connects to the backend WebSocket at `ws://localhost:8000/api/chat/ws/`. If your backend runs on a different host/port, update the WebSocket URL in the `useWebSocket.ts` hook.

### 4. Docker Setup (Optional)

For a fully containerized setup with PostgreSQL, backend, and frontend:

```bash
# From the project root (news-agent/)
# Set your API keys in .env first

# Build and start all services
docker compose up --build

# Services will be available at:
# Frontend:   http://localhost:5173
# Backend:    http://localhost:8000
# PostgreSQL: localhost:5432
```

**Docker Compose services:**

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `postgres` | `postgres:15` | 5432 | PostgreSQL database with health check |
| `backend` | Custom (Python 3.11-slim) | 8000 | FastAPI with Gunicorn + Uvicorn workers |
| `frontend` | Custom (Node 18 → Nginx Alpine) | 5173 | Multi-stage build, served via Nginx |

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `GROQ_API_KEY` | ✅ | — | Groq API key for Llama 3.3 70B inference |
| `NEWS_API_KEY` | ✅ | — | NewsAPI key for fetching news articles |
| `JWT_SECRET` | ✅ | — | Secret key for signing JWT access tokens |
| `JWT_ALGORITHM` | ❌ | `HS256` | Algorithm for JWT encoding |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ | `10080` (7 days) | JWT token expiration time |
| `DATABASE_URL` | ❌ | `sqlite:///./newsagent.db` | Database connection string |
| `ALLOWED_ORIGINS` | ❌ | `http://localhost:5173,...` | Comma-separated CORS origins |

---

## ☁️ Deployment

### Backend on Render

The project includes a `render.yaml` for one-click deployment to Render:

1. Push your code to GitHub
2. Connect the repository to [Render](https://render.com/)
3. Render auto-detects `render.yaml` and creates:
   - **Web Service** (`newsagent-backend`) — Python environment, auto-installs dependencies
   - **PostgreSQL Database** (`newsagent-db`) — Free tier, connection string auto-injected as `DATABASE_URL`
4. Set `GROQ_API_KEY` and `NEWS_API_KEY` as environment variables in the Render dashboard

**Start command:**
```bash
cd backend && uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

### Frontend on Vercel

1. Connect your repository to [Vercel](https://vercel.com/)
2. Set the root directory to `frontend/`
3. Vercel auto-detects Vite and configures the build
4. Update the WebSocket URL in your frontend code to point to your Render backend URL

**Build settings:**
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

---

## 🌐 Supported Languages

NEWSAgent supports **19+ languages** for both UI translation and AI-powered article translation:

| Code | Language | Script |
|------|----------|--------|
| `en` / `en-in` | English | Latin |
| `hi` | Hindi | Devanagari |
| `bn` | Bengali | Bengali |
| `te` | Telugu | Telugu |
| `mr` | Marathi | Devanagari |
| `ta` | Tamil | Tamil |
| `ur` | Urdu | Nastaliq |
| `gu` | Gujarati | Gujarati |
| `kn` | Kannada | Kannada |
| `or` | Odia | Odia |
| `ml` | Malayalam | Malayalam |
| `pa` | Punjabi | Gurmukhi |
| `as` | Assamese | Assamese |
| `es` | Spanish | Latin |
| `fr` | French | Latin |
| `de` | German | Latin |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style and project structure
- Add docstrings to new Python functions
- Use TypeScript types for all new frontend code
- Test your changes locally before submitting a PR
- Update documentation if your changes affect the API or user-facing features

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Rishik-sai](https://github.com/Rishik-sai)**

⭐ Star this repo if you found it useful!

</div>
