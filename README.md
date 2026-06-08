# NEWSAgent 📰🤖

NEWSAgent is a full-stack AI-powered personal news assistant that delivers personalized, real-time news updates across various topics and languages.

## Features ✨

- **Multi-Agent Architecture**: 
  - 🌐 General News: Global coverage across all topics.
  - 💻 Tech Agent: In-depth coverage of AI, startups, gadgets, and software.
  - 📈 Finance Agent: Market updates, stock prices, and economic trends.
  - 🏅 Sports Agent: Live scores, match highlights, and team news.
- **Real-Time News Fetching**: Integrates with Google News RSS and DuckDuckGo for the latest breaking news.
- **AI-Powered Translations**: Dynamically translates trending topics and articles into 19+ languages using LLMs.
- **Activity Insights**: Tracks your interactions, queries, and saved articles.
- **Personalized Daily Digests**: Generates and emails custom digests based on user preferences.

## Tech Stack 🛠️

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Lucide React (Icons)

**Backend:**
- FastAPI
- SQLAlchemy (PostgreSQL/SQLite)
- LangChain & LangGraph
- Groq (LLM Inference)
- APScheduler

## Setup & Installation 🚀

### 1. Clone the repository
```bash
git clone https://github.com/Rishik-sai/NewsAgent.git
cd NewsAgent
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your GROQ_API_KEY and database URL

# Run migrations (if applicable) and start server
uvicorn api.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Contributing 🤝
Pull requests are welcome! Feel free to open an issue or submit a pull request if you have any suggestions or improvements.

## License 📝
MIT License
