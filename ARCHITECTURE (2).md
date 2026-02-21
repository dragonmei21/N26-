# Architecture — N26 AI Financial News Curator
**Team A Ownership: Everything below the UI**

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     EXTERNAL DATA SOURCES                    │
│  NewsAPI.org  │  GNews  │  Yahoo Finance RSS  │  ECB API    │
└──────┬────────┴────┬────┴──────────┬──────────┴─────┬───────┘
       │             │               │                 │
       └─────────────┴───────────────┴─────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  INGESTION SERVICE │
                    │  - Fetch & dedupe  │
                    │  - Clean HTML      │
                    │  - Extract metadata│
                    │  runs every 15min  │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼──────────┐
                    │   VECTOR STORE      │
                    │   ChromaDB          │
                    │   - Article chunks  │
                    │   - Embeddings      │
                    │   - Metadata tags   │
                    │   (finance/crypto/  │
                    │    macro/ETF/ECB)   │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
┌─────────▼──────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  SPEND PROFILE │  │ RELEVANCE ENGINE│  │ TREND DETECTOR │
│  SERVICE       │  │                 │  │                │
│  - Parse txns  │  │ - Match spend   │  │ - Topic freq   │
│  - Categorize  │→ │   categories to │  │   over time    │
│  - Build vector│  │   news topics   │  │ - Spike alerts │
│    profile     │  │ - Score 0-1     │  │ - Momentum     │
└────────────────┘  └────────┬────────┘  └───────┬────────┘
                             │                    │
                    ┌────────▼────────────────────▼────────┐
                    │              RAG CORE                  │
                    │  1. Retrieve top-k relevant chunks     │
                    │  2. Build prompt with user context     │
                    │  3. Call Claude API                    │
                    │  4. Parse structured response          │
                    │  5. Attach sources + confidence        │
                    └──────────────────┬─────────────────────┘
                                       │
                    ┌──────────────────▼─────────────────────┐
                    │       VISUALIZATION DATA FORMATTER       │
                    │  - Transform to chart-ready JSON         │
                    │  - TimeSeriesData, CategoryData, etc.    │
                    │  - All shapes defined in API contracts   │
                    └──────────────────┬─────────────────────┘
                                       │
                    ┌──────────────────▼─────────────────────┐
                    │           FASTAPI REST LAYER             │
                    │  /feed  /insight  /eli10  /trends       │
                    │  /spend-map  /fund-tracker  /tip        │
                    └──────────────────┬─────────────────────┘
                                       │
                              [Team B consumes]
                           React Native / Web UI
```

---

## Component Breakdown

### 1. Ingestion Service (`ingestion/`)
**Responsibility**: Pull news, clean it, chunk it, embed it, store it.

```
ingestion/
  fetcher.py       # HTTP calls to NewsAPI, GNews
  cleaner.py       # Strip HTML, normalize text
  chunker.py       # Split articles into 300-token chunks
  embedder.py      # sentence-transformers embedding
  indexer.py       # ChromaDB write operations
  scheduler.py     # APScheduler every 15 minutes
```

**Key decisions**:
- Chunk size: 300 tokens (balance context vs retrieval precision)
- Overlap: 50 tokens (preserve sentence boundaries)
- Metadata per chunk: `{article_id, title, url, published_at, category, source_name}`

---

### 2. Spend Profile Service (`spend/`)
**Responsibility**: Transform N26 transaction history into a semantic interest vector.

```
spend/
  parser.py        # Parse N26 transaction JSON format
  categorizer.py   # Map merchants to finance categories
  profiler.py      # Build WeightedInterestProfile
  mock_data.py     # Realistic N26 fixture data
```

**Category mapping example**:
```
Ryanair, EasyJet → "travel, aviation, fuel_costs"
Degiro, Trade Republic → "investing, stocks, ETF"
Mercadona, Lidl → "consumer_staples, inflation"
Amazon → "e-commerce, tech_stocks, AMZN"
Iberdrola (utility bill) → "energy, renewables"
```

**Output — WeightedInterestProfile**:
```json
{
  "user_id": "mock_user_1",
  "interests": {
    "travel": 0.85,
    "consumer_staples": 0.72,
    "tech_stocks": 0.45,
    "energy": 0.38,
    "crypto": 0.10
  },
  "spend_context": [
    {"category": "travel", "amount_eur": 340, "merchant": "Ryanair", "period": "last_30d"}
  ]
}
```

---

### 3. Relevance Engine (`relevance/`)
**Responsibility**: Score news articles against a user's spend profile.

```
relevance/
  scorer.py        # Cosine similarity + category overlap
  ranker.py        # Final ranked list with scores
  filters.py       # Remove already-seen, low-quality items
```

**Scoring formula**:
```
relevance_score = (0.6 × semantic_similarity) + (0.4 × category_match_weight)
```

---

### 4. RAG Core (`rag/`)
**Responsibility**: Retrieve, augment, generate — with citations.

```
rag/
  retriever.py     # ChromaDB query, top-k chunks
  prompt_builder.py # Construct system + user prompts
  llm_client.py    # Anthropic API wrapper
  response_parser.py # Extract structured JSON from LLM
  citation_tracker.py # Map claims to source chunks
```

**Correctness safeguards**:
- Temperature: 0.2 (factual, not creative)
- System prompt explicitly forbids fabricating statistics
- All numeric claims must cite a source chunk
- Response schema validated with Pydantic before serving

---

### 5. Trend Detector (`trends/`)
**Responsibility**: Identify what's spiking in financial news.

```
trends/
  counter.py       # Topic frequency over sliding windows
  spike_detector.py # >2x mentions vs 24h baseline = spike
  momentum.py      # Acceleration score for emerging trends
```

---

### 6. Visualization Formatter (`viz/`)
**Responsibility**: Shape all data into Team B-consumable chart formats.

```
viz/
  formatters.py    # All chart data transformers
  schemas.py       # Pydantic models for every chart type
```

See `API_CONTRACTS.md` for all output shapes.

---

### 7. FastAPI Layer (`api/`)
```
api/
  main.py          # App init, CORS, routes registration
  routes/
    feed.py
    insight.py
    eli10.py
    trends.py
    spend_map.py
    fund_tracker.py
    tip.py
  middleware/
    logging.py
    error_handler.py
```

---

## Data Flow Summary

```
User opens app
    → GET /feed?user_id=X
    → Load spend profile for X
    → Score all indexed articles vs profile
    → Retrieve top-8 articles
    → For each: call RAG pipeline
    → Return enriched feed with chart data
    → Team B renders
Total target latency: < 4 seconds for full feed
```

---

## Infrastructure (Hackathon Mode)

```
Local machine:
  uvicorn api.main:app --reload --port 8000

Public tunnel:
  ngrok http 8000
  → Share URL with Team B

ChromaDB:
  In-memory (data resets on restart — acceptable for demo)
  Seed script: python scripts/seed_news.py

Environment:
  .env file with API keys
  See ENVIRONMENTS.md
```
