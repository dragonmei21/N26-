# State Management
**How data is stored, cached, and shared across services**

---

## State Overview

This is a stateless-first design. The only persistent state is ChromaDB (vector store). Everything else lives in memory or is recomputed.

```
┌─────────────────────────────────────────────┐
│              APPLICATION STATE               │
│                                             │
│  ┌─────────────┐   ┌─────────────────────┐  │
│  │ ChromaDB    │   │  In-Memory Cache    │  │
│  │ (persists   │   │  (dies on restart)  │  │
│  │  articles)  │   │                     │  │
│  │             │   │  - ELI10 responses  │  │
│  │  Collection:│   │  - Trend counts     │  │
│  │  "fin_news" │   │  - Spend profiles   │  │
│  │             │   │  - Fund data        │  │
│  └─────────────┘   └─────────────────────┘  │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │  Scheduler State (APScheduler)         │ │
│  │  - Last ingestion run time             │ │
│  │  - Last trend calculation time         │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## ChromaDB Collection Schema

**Collection name**: `financial_news`

**Document** = one article chunk (300 tokens)

**Document ID**: `{article_id}_{chunk_index}`

**Document text**: The chunk content

**Embedding**: 384-dim float32 vector (all-MiniLM-L6-v2)

**Metadata** (filterable fields):
```python
{
    "article_id": "abc123",          # str, unique per article
    "chunk_index": 0,                # int
    "title": "ECB holds rates...",   # str
    "url": "https://reuters.com/...",# str
    "source_name": "Reuters",        # str
    "published_at": "2026-02-21T...",# ISO8601 str (for date filtering)
    "category": "macro",             # str: macro|crypto|stocks|etf|tips
    "language": "en"                 # str
}
```

**Query operations used**:
```python
# Semantic search
collection.query(
    query_embeddings=[user_interest_vector],
    n_results=30,
    where={"published_at": {"$gte": cutoff_timestamp}},
    include=["documents", "metadatas", "distances"]
)

# Trend counting (last 6h)
collection.get(
    where={"published_at": {"$gte": six_hours_ago}},
    include=["metadatas"]
)
```

---

## In-Memory Cache

**Implementation**: Python dict with TTL wrapper

```python
# cache/store.py

class TTLCache:
    def __init__(self):
        self._store: dict = {}
    
    def set(self, key: str, value: any, ttl_seconds: int = 3600):
        self._store[key] = {
            "value": value,
            "expires_at": time.time() + ttl_seconds
        }
    
    def get(self, key: str) -> any | None:
        item = self._store.get(key)
        if not item:
            return None
        if time.time() > item["expires_at"]:
            del self._store[key]
            return None
        return item["value"]

# Singleton instance
cache = TTLCache()
```

**Cache keys and TTLs**:

| Key Pattern | TTL | Contents |
|------------|-----|---------|
| `eli10:{concept}` | 1 hour | ELI10 response dict |
| `spend_profile:{user_id}` | 5 minutes | WeightedInterestProfile |
| `trends:current` | 30 minutes | TrendingTopics list |
| `fund_data:{ticker}` | 1 hour | Fund holdings dict |
| `viz:ecb_rates` | 4 hours | ECB rate timeseries |
| `viz:sparkline:{ticker}` | 15 minutes | Price sparkline data |

---

## Pydantic Models (State Shapes)

```python
# models/spend.py

class Transaction(BaseModel):
    id: str
    date: date
    merchant: str
    amount: float  # negative = expense
    currency: str = "EUR"
    category_raw: str

class CategorizedTransaction(Transaction):
    categories: list[str]  # ["travel", "aviation", "fuel"]
    
class WeightedInterestProfile(BaseModel):
    user_id: str
    interests: dict[str, float]  # {"travel": 0.85, ...}
    spend_context: list[SpendContext]
    computed_at: datetime


# models/news.py

class RawArticle(BaseModel):
    article_id: str
    title: str
    content: str
    url: str
    source_name: str
    published_at: datetime
    category: str

class EnrichedArticle(BaseModel):
    id: str
    title: str
    source_name: str
    source_url: str
    published_at: datetime
    category: str
    relevance_score: float
    thumbnail_url: str | None
    ai_summary: AISummary
    visualization: VisualizationBlock
    tags: list[str]
    is_trending: bool
    trend_score: float


# models/viz.py

class VisualizationBlock(BaseModel):
    type: Literal["line_chart", "comparison_bar", "sparkline", 
                  "donut_with_arrow", "horizontal_bar", "simple_number"]
    title: str
    data: dict  # structure varies by type, see API_CONTRACTS.md
    annotation: str | None = None
    color: str | None = None


# models/ai.py

class AISummary(BaseModel):
    plain_english: str
    for_you: str
    confidence: Literal["high", "medium", "low"]
    sources: list[str]
    disclaimer: str = "Educational only, not financial advice."
    reasoning_trace: str | None = None
```

---

## Concurrency Model

FastAPI is async. Key decisions:

```python
# Parallel RAG calls for feed (don't do sequential!)
import asyncio

async def enrich_feed(articles: list[RankedArticle], profile: WeightedInterestProfile):
    tasks = [enrich_single_article(article, profile) for article in articles]
    return await asyncio.gather(*tasks)  # ~2s instead of ~16s sequential
```

**Rate limit guard for Anthropic API**:
```python
# Use asyncio.Semaphore to cap concurrent LLM calls
llm_semaphore = asyncio.Semaphore(5)  # max 5 concurrent calls

async def call_llm_safe(prompt: str) -> str:
    async with llm_semaphore:
        return await call_llm(prompt)
```

---

## Startup / Shutdown Events

```python
# api/main.py

@app.on_event("startup")
async def startup():
    # 1. Initialize ChromaDB
    init_vector_store()
    
    # 2. Load sentence-transformer model into memory
    load_embedding_model()
    
    # 3. Seed with initial articles if collection is empty
    if article_count() == 0:
        await run_ingestion()
    
    # 4. Start background schedulers
    scheduler.add_job(run_ingestion, 'interval', minutes=15)
    scheduler.add_job(run_trend_detection, 'interval', minutes=30)
    scheduler.start()
    
    print("✅ N26 Curator backend ready")

@app.on_event("shutdown")  
async def shutdown():
    scheduler.shutdown()
```
