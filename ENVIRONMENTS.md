# Environments
**Setup guide for Team A development**

---

## Prerequisites

```bash
Python 3.11+
pip or conda
ngrok account (free tier)
```

---

## Local Dev Setup

```bash
# 1. Clone / create project
mkdir n26-curator && cd n26-curator

# 2. Virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set environment variables
cp .env.example .env
# Edit .env with your API keys

# 5. Seed vector store with initial news
python scripts/seed_news.py

# 6. Start server
uvicorn api.main:app --reload --port 8000

# 7. Expose to Team B (run in separate terminal)
ngrok http 8000
# Share the https://xxxxx.ngrok.io URL with Team B
```

---

## `.env.example`

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# News Sources
NEWSAPI_KEY=your_key_here        # newsapi.org — free 100req/day
GNEWS_API_KEY=your_key_here      # gnews.io — free 100req/day

# Optional: Financial Data
ALPHA_VANTAGE_KEY=your_key_here  # alphavantage.co — free tier
# If not available, use mock chart data (see viz/mock_charts.py)

# App Config
ENV=development
LOG_LEVEL=INFO
CACHE_TTL_SECONDS=3600
MAX_ARTICLES_PER_FETCH=50
CHUNK_SIZE_TOKENS=300
CHUNK_OVERLAP_TOKENS=50
TOP_K_RETRIEVAL=5
LLM_TEMPERATURE=0.2
LLM_MAX_TOKENS=400
```

---

## `requirements.txt`

```
# API Framework
fastapi==0.115.0
uvicorn==0.32.0
python-dotenv==1.0.0

# AI / Embeddings
anthropic==0.40.0
sentence-transformers==3.3.0
chromadb==0.6.0

# Data Processing
pydantic==2.10.0
httpx==0.28.0
feedparser==6.0.11
beautifulsoup4==4.12.3

# Scheduling
apscheduler==3.10.4

# Utils
python-dateutil==2.9.0
```

---

## API Keys — Quick Links

| Service | Free Tier | Sign Up |
|---------|-----------|---------|
| Anthropic | Via hackathon credits | https://console.anthropic.com |
| NewsAPI | 100 req/day | https://newsapi.org/register |
| GNews | 100 req/day | https://gnews.io |
| Alpha Vantage | 25 req/day | https://alphavantage.co/support/#api-key |

**Priority**: Get Anthropic + NewsAPI working first. Others are nice-to-have.

---

## Fallback: No API Keys?

If NewsAPI is rate-limited during demo, run:
```bash
python scripts/load_mock_articles.py
```
This loads 20 pre-written mock articles into ChromaDB — realistic enough for demo.

---

## Testing the Setup

```bash
# Test ingestion works
python -c "from ingestion.fetcher import fetch_articles; print(fetch_articles('macro')[:2])"

# Test vector store
python -c "from ingestion.indexer import query_similar; print(query_similar('ECB interest rates', k=3))"

# Test full feed endpoint
curl http://localhost:8000/feed?user_id=mock_user_1 | python -m json.tool

# Test ELI10
curl http://localhost:8000/eli10/inflation | python -m json.tool

# Interactive API docs
open http://localhost:8000/docs
```

---

## Demo Checklist

Before presenting to judges:

- [ ] `seed_news.py` run successfully (at least 20 articles indexed)
- [ ] `/feed?user_id=mock_user_1` returns 8 articles with summaries
- [ ] `/eli10/interest_rate` returns explanation
- [ ] `/trends` returns at least 3 trending topics
- [ ] `/spend-map?user_id=mock_user_1` returns mappings
- [ ] ngrok tunnel active and URL shared with Team B
- [ ] API docs accessible at `/docs`
- [ ] All responses include `sources[]` array (transparency requirement)
- [ ] No `null` fields in visualization blocks (Team B will break)
