# N26 AI Financial News Curator
## Project Structure

```
n26-curator/
│
├── docs/
│   ├── MASTER_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACTS.md
│   ├── DATA_FLOW.md
│   ├── ENVIRONMENTS.md
│   ├── STATE_MANAGEMENT.md
│   ├── TASK_BREAKDOWN.md
│   └── TEAM_B_INSTRUCTIONS.md
│
├── api/
│   ├── __init__.py
│   ├── main.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── feed.py
│   │   ├── insight.py
│   │   ├── eli10.py
│   │   ├── trends.py
│   │   ├── spend_map.py
│   │   ├── fund_tracker.py
│   │   └── tip.py
│   └── middleware/
│       ├── logging.py
│       └── error_handler.py
│
├── ingestion/
│   ├── __init__.py
│   ├── fetcher.py
│   ├── cleaner.py
│   ├── chunker.py
│   ├── embedder.py
│   ├── indexer.py
│   └── scheduler.py
│
├── spend/
│   ├── __init__.py
│   ├── parser.py
│   ├── categorizer.py
│   ├── profiler.py
│   └── merchant_lookup.py    # lookup table: merchant → categories
│
├── relevance/
│   ├── __init__.py
│   ├── scorer.py
│   ├── ranker.py
│   └── filters.py
│
├── rag/
│   ├── __init__.py
│   ├── retriever.py
│   ├── prompt_builder.py
│   ├── llm_client.py
│   ├── response_parser.py
│   └── citation_tracker.py
│
├── trends/
│   ├── __init__.py
│   ├── counter.py
│   ├── spike_detector.py
│   └── momentum.py
│
├── viz/
│   ├── __init__.py
│   ├── formatters.py
│   ├── schemas.py
│   └── mock_charts.py        # fallback chart data
│
├── models/
│   ├── __init__.py
│   ├── spend.py
│   ├── news.py
│   ├── ai.py
│   └── viz.py
│
├── cache/
│   ├── __init__.py
│   └── store.py
│
├── data/
│   ├── mock_transactions.json
│   └── mock_articles.json
│
├── scripts/
│   ├── seed_news.py           # run on startup to index articles
│   ├── load_mock_articles.py  # offline fallback
│   └── test_relevance.py      # quick sanity check
│
├── .env.example
├── .env                       # gitignored
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Quick Start

```bash
git clone <repo>
cd n26-curator
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in API keys in .env
python scripts/seed_news.py
uvicorn api.main:app --reload --port 8000
# In another terminal:
ngrok http 8000
```

---

## First Things to Build (in order)

1. `models/` — all Pydantic schemas (fast, blocks nothing else)
2. `cache/store.py` — TTL cache (5 min)
3. `ingestion/` — get news into ChromaDB
4. `spend/` — profile from mock transactions
5. `relevance/` — score articles
6. `rag/` — LLM enrichment
7. `viz/` — chart formatters
8. `api/` — expose everything
