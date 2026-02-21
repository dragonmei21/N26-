# 24-Hour Task Breakdown — Team A
**Strategy Engine + Visualization Data Layer**
**Hackathon: 21.02.2026**

---

## Time Budget

```
Total: ~20 working hours (account for food, breaks, demo prep)
Hard deadline: Demo presentation
```

---

## Phase 0 — Setup (Hour 0–1)

**Goal**: Everyone can run the project locally. Nothing else.

### Tasks:
- [ ] Create project structure (folders from ARCHITECTURE.md)
- [ ] Create `requirements.txt` and install
- [ ] Create `.env` with all API keys
- [ ] Test Anthropic API call works (1 message)
- [ ] Test NewsAPI call works (1 fetch)
- [ ] Verify ChromaDB initializes
- [ ] `git init` + push to shared repo
- [ ] Share repo link with Team B + send them API_CONTRACTS.md

**Checkpoint**: `python -c "import anthropic, chromadb, fastapi; print('all good')"` works.

---

## Phase 1 — Data Foundation (Hours 1–5)

**Goal**: News is indexed and queryable. Spend profile works.

### Task 1.1 — Mock Data (30 min)
- [ ] Create `data/mock_transactions.json` (5 users, 20 txns each)
- [ ] Create `data/mock_articles.json` (20 realistic financial articles)
  - 5 macro (ECB, inflation)
  - 5 crypto (Bitcoin, Ethereum)
  - 5 stocks (tech, energy)
  - 5 ETF / fund moves

### Task 1.2 — Ingestion Pipeline (2 hours)
- [ ] `ingestion/fetcher.py` — NewsAPI fetch, returns `List[RawArticle]`
- [ ] `ingestion/cleaner.py` — strip HTML, normalize
- [ ] `ingestion/chunker.py` — 300 token chunks with overlap
- [ ] `ingestion/embedder.py` — sentence-transformer encode
- [ ] `ingestion/indexer.py` — ChromaDB upsert + dedup
- [ ] `scripts/seed_news.py` — run full pipeline on mock + live articles
- [ ] **Test**: `query_similar("ECB interest rates", k=5)` returns relevant chunks

### Task 1.3 — Spend Profile (1.5 hours)
- [ ] `spend/parser.py` — load transactions from JSON
- [ ] `spend/categorizer.py` — merchant → category lookup table
  - Build lookup for top 50 common EU merchants
- [ ] `spend/profiler.py` — compute `WeightedInterestProfile`
- [ ] **Test**: `build_profile("mock_user_1")` returns correct interest weights

### Task 1.4 — Relevance Engine (1 hour)
- [ ] `relevance/scorer.py` — cosine sim + category overlap formula
- [ ] `relevance/ranker.py` — top 8, diversity filter
- [ ] **Test**: User with travel spending gets Ryanair/fuel articles ranked higher

**Checkpoint**: Running `python scripts/test_relevance.py` returns 8 ranked articles for mock_user_1.

---

## Phase 2 — AI Brain (Hours 5–10)

**Goal**: RAG pipeline works end-to-end with citations.

### Task 2.1 — Prompt System (1 hour)
- [ ] `rag/prompt_builder.py`
  - `build_summary_prompt(article_chunks, user_profile)` 
  - `build_eli10_prompt(concept, user_profile)`
  - `build_tip_prompt(top_articles, user_profile)`
- [ ] Test prompts manually in Anthropic console first
- [ ] Verify JSON output format is consistent

### Task 2.2 — LLM Client (45 min)
- [ ] `rag/llm_client.py`
  - Async Anthropic client wrapper
  - Retry logic (3x with backoff)
  - Structured output parsing
  - Rate limit handling (asyncio.Semaphore(5))

### Task 2.3 — Response Parser (45 min)
- [ ] `rag/response_parser.py`
  - Pydantic validation of LLM output
  - Fallback if JSON malformed (return safe default)
  - `confidence` calculation based on source count

### Task 2.4 — Citation Tracker (30 min)
- [ ] `rag/citation_tracker.py`
  - Map article chunks used → source URLs
  - Dedup sources
  - Return `List[str]` of URLs

### Task 2.5 — Full RAG Test (1 hour)
- [ ] End-to-end test: article chunks + user profile → `EnrichedArticle`
- [ ] Verify `sources[]` always populated
- [ ] Verify no fabricated numbers in responses
- [ ] Run 10 test cases, check quality

### Task 2.6 — Trend Detector (1 hour)
- [ ] `trends/counter.py` — topic frequency from ChromaDB
- [ ] `trends/spike_detector.py` — 2x multiplier threshold
- [ ] Simple keyword extraction (no ML needed — regex + top-N word frequency)
- [ ] **Test**: inject 10 "bitcoin" articles, verify bitcoin shows as trending

**Checkpoint**: `POST /test/rag` with mock article returns valid `EnrichedArticle` with `sources[]`.

---

## Phase 3 — API Layer (Hours 10–14)

**Goal**: All endpoints working and documented.

### Task 3.1 — FastAPI App Shell (30 min)
- [ ] `api/main.py` — app init, CORS (allow all for hackathon), startup events
- [ ] `api/middleware/logging.py` — simple request logger
- [ ] `api/middleware/error_handler.py` — standard error format

### Task 3.2 — Core Endpoints (3 hours)
Build in this order (most important first):

- [ ] `GET /feed` — 1.5h — full personalized feed
  - Tie together: profile → relevance → RAG × 8 (parallel) → viz format
  - This is the most complex endpoint
  
- [ ] `GET /eli10/{concept}` — 30 min
  - Check cache, call LLM, format, cache result

- [ ] `GET /trends` — 30 min
  - Return from trends cache, format sparklines

- [ ] `GET /insight/{article_id}` — 30 min
  - Deep dive, fund data mock, richer viz

### Task 3.3 — Secondary Endpoints (1 hour)
- [ ] `GET /spend-map` — map transactions to ETF suggestions
- [ ] `GET /fund-tracker` — mock Vanguard/ARK/BlackRock data
- [ ] `GET /tip` — single daily tip

### Task 3.4 — Visualization Formatter (1 hour)
- [ ] `viz/formatters.py` — all chart type formatters
- [ ] `viz/mock_charts.py` — fallback when financial API unavailable
- [ ] Verify all chart JSON matches API_CONTRACTS.md exactly
- [ ] **Critical**: Team B cannot render if shapes are wrong

**Checkpoint**: `curl http://localhost:8000/feed?user_id=mock_user_1` returns valid JSON matching contract. API docs at `/docs` look clean.

---

## Phase 4 — Integration + Polish (Hours 14–18)

**Goal**: Everything works together. Team B can build against it.

### Task 4.1 — Team B Sync (30 min)
- [ ] Start ngrok tunnel
- [ ] Send Team B the live URL
- [ ] Walk through each endpoint response together
- [ ] Confirm all visualization shapes render correctly
- [ ] Agree on any contract adjustments (document them!)

### Task 4.2 — Scheduler (30 min)
- [ ] `ingestion/scheduler.py` — APScheduler setup
- [ ] Wire to startup event in `main.py`
- [ ] Test that news refreshes without restarting server

### Task 4.3 — Quality Pass (2 hours)
- [ ] Test all endpoints with 3 different mock users
- [ ] Verify `sources[]` never empty (add fallback if needed)
- [ ] Verify `visualization` blocks never null
- [ ] Check latency: `/feed` should be < 4s
- [ ] Add basic input validation (invalid user_id returns 404, not 500)

### Task 4.4 — Seed Script (30 min)
- [ ] `scripts/seed_news.py` — one command to load fresh data
- [ ] `scripts/load_mock_articles.py` — offline fallback
- [ ] Document in ENVIRONMENTS.md

**Checkpoint**: Two consecutive demo runs produce consistent, high-quality results.

---

## Phase 5 — Demo Prep (Hours 18–20)

**Goal**: Win the hackathon.

### Task 5.1 — Demo Script (45 min)
- [ ] Write the narrative: "Alex is an N26 user..."
- [ ] Choose 3 demo moments that showcase the spend→insight connection
- [ ] Prepare specific user_ids for each demo scenario

### Task 5.2 — Wow Factor (45 min)
Pick ONE bonus feature to impress judges:
- **Option A**: "Spend Mirror" — show how much user would have earned if they invested 10% of each spend category
- **Option B**: "Fund Following" — show plain-language breakdown of what Vanguard/BlackRock is doing in response to today's news
- **Option C**: Both if time allows

### Task 5.3 — Reliability (30 min)
- [ ] Run `scripts/seed_news.py` one final time
- [ ] Verify all endpoints respond
- [ ] Have `data/mock_articles.json` as ultimate fallback
- [ ] Test on a fresh terminal / clean environment

---

## Task Assignment Suggestions (if 2 people on Team A)

**Person 1**: Ingestion + RAG core + API layer
**Person 2**: Spend profiler + Relevance engine + Visualization formatter

---

## Red Lines (don't skip these)

1. `sources[]` must always be populated — it's the transparency feature
2. All visualization JSON must match contracts exactly — Team B blocks otherwise  
3. `/feed` must work end-to-end before starting secondary endpoints
4. Have mock data fallback for EVERY external API call
5. Test with ngrok before telling Team B it's ready

---

## Estimated Complexity

| Component | Difficulty | Time Risk |
|-----------|-----------|-----------|
| ChromaDB setup | Low | Low |
| News ingestion | Medium | Low |
| Spend categorizer | Low | Low |
| RAG pipeline | High | Medium |
| Parallel async calls | Medium | Medium |
| Visualization formatter | Medium | High — easy to get shapes wrong |
| Trend detection | Low | Low |

**Highest risk**: Visualization formatter getting out of sync with Team B. Sync early and often.
