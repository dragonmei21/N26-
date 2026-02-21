# 24-Hour Task Breakdown — Team A (UPDATED)
**Strategy Engine + Macro Reasoning + Visualization Data Layer**
**Hackathon: 21.02.2026**

---

## What Changed
The quiz-based investment strategy is OUT.
The **Macro Reasoning Engine** is IN as the centerpiece feature.

Core demo moment:
```
Real news event → AI causal chain → Live price timeline with event pinned → 
"Here's why NVIDIA pumped, and you're already in this story because you use Amazon"
```

---

## Time Budget
```
~20 working hours
Phase 0–2: Foundation (Hours 0–8)
Phase 3:   Macro Engine — THE FEATURE (Hours 8–14)  ← most time here
Phase 4:   API + Integration (Hours 14–18)
Phase 5:   Demo prep (Hours 18–20)
```

---

## Phase 0 — Setup (Hour 0–1)

- [ ] Create folder structure from `PROJECT_STRUCTURE.md`
- [ ] `requirements.txt` + install (add `yfinance==0.2.36`)
- [ ] `.env` with API keys (Anthropic + NewsAPI minimum)
- [ ] Test: Anthropic API call works
- [ ] Test: NewsAPI fetch returns articles
- [ ] Test: yfinance `NVDA` returns 30d price history
- [ ] `git init` + push + share with Team B
- [ ] Send Team B: `API_CONTRACTS.md` + `TEAM_B_INSTRUCTIONS.md`

**Checkpoint**: 3 test calls succeed. Repo is live.

---

## Phase 1 — News + Data Foundation (Hours 1–5)

**Goal**: Real news indexed. Live prices fetchable. Spend profile works.

### Task 1.1 — Fetch & Freeze Real News (45 min)
**Do this first. Run it once, save the results.**

```python
# scripts/fetch_and_freeze.py
# Pull today's top financial news, clean it, save to data/frozen_articles.json
# This is your demo-safe fallback — independent of API availability during demo
```

- [ ] Fetch from NewsAPI: `category=business`, top 40 articles
- [ ] Filter: keep only articles with >200 chars content
- [ ] Save raw to `data/frozen_articles.json`
- [ ] Manually pick 5–8 best articles that have good causal chain potential:
  - Look for: product launches, central bank decisions, earnings surprises, geopolitical events
  - These become your "hero articles" for the demo

**Why now**: Rate limits. Do this before you burn requests on testing.

### Task 1.2 — Ingestion Pipeline (1.5 hours)
- [ ] `ingestion/fetcher.py` — NewsAPI + load from frozen fallback
- [ ] `ingestion/cleaner.py` — strip HTML, normalize
- [ ] `ingestion/chunker.py` — 300 token chunks, 50 overlap
- [ ] `ingestion/embedder.py` — sentence-transformers encode
- [ ] `ingestion/indexer.py` — ChromaDB upsert + dedup
- [ ] `scripts/seed_news.py` — run full pipeline

**Test**: `query_similar("AI chip demand", k=5)` returns relevant chunks.

### Task 1.3 — Live Price Service (1 hour)
This is NEW — replaces Alpha Vantage dependency entirely.

- [ ] `rag/price_correlator.py` — full implementation from `MACRO_REASONING_ENGINE.md`
  - `fetch_price_timeline(ticker, event_date)` → chart JSON or None
  - `get_current_price(ticker)` → float or None
  - `get_price_change_pct(ticker, days=5)` → float or None
- [ ] Cache: `viz:price:{ticker}` TTL 15 min (don't hammer yfinance)

**Test**: `fetch_price_timeline("NVDA", date(2026,2,20))` returns dict with `labels`, `values`, `event_index`.

### Task 1.4 — Spend Profile (1 hour)
- [ ] `data/mock_transactions.json` — 3 users:
  - `mock_user_1`: travel + Amazon + grocery (connects to JETS, AMZN, consumer staples)
  - `mock_user_2`: tech subscriptions + Degiro (connects to tech stocks, ETFs)
  - `mock_user_3`: energy bills + local shops (connects to energy sector)
- [ ] `spend/parser.py`, `categorizer.py`, `profiler.py`
- [ ] `spend/merchant_lookup.py` — 50 common EU merchants → categories + tickers

**Merchant → Ticker mapping (critical for personalization)**:
```python
MERCHANT_TO_TICKERS = {
    "amazon": ["AMZN", "MSFT"],        # AWS, Azure compete
    "ryanair": ["RYAAY", "LUV"],       # aviation
    "iberdrola": ["IBE.MC", "ENPH"],   # energy
    "mercadona": ["XLP"],              # consumer staples ETF
    "apple store": ["AAPL"],
    "netflix": ["NFLX", "DIS"],
    "spotify": ["SPOT"],
    "degiro": ["GS", "MS"],            # financial services
}
```

**Checkpoint**: `build_profile("mock_user_1")` returns interests with ticker hints. `fetch_price_timeline("NVDA", today)` works.

---

## Phase 2 — Base RAG (Hours 5–8)

**Goal**: Standard article summaries work. This feeds the main news feed.

### Task 2.1 — Prompts + LLM Client (1 hour)
- [ ] `rag/prompt_builder.py`:
  - `build_summary_prompt()` — 2-sentence summary + for_you
  - `build_eli10_prompt()` — plain language concept explanation
- [ ] `rag/llm_client.py` — async Anthropic wrapper, semaphore(5), retry(3x)
- [ ] `rag/response_parser.py` — Pydantic validation, safe fallback

### Task 2.2 — Citation + Relevance (1 hour)
- [ ] `rag/citation_tracker.py` — sources[] from chunk metadata
- [ ] `relevance/scorer.py` + `ranker.py` — score articles vs spend profile
- [ ] `trends/counter.py` + `spike_detector.py` — topic frequency

### Task 2.3 — End-to-End Feed Test (1 hour)
- [ ] Run full pipeline: profile → relevance → RAG → EnrichedArticle
- [ ] Verify `sources[]` populated on every article
- [ ] Verify latency < 4s with 8 parallel calls

**Checkpoint**: `GET /feed?user_id=mock_user_1` returns 8 enriched articles with summaries and sources.

---

## Phase 3 — Macro Reasoning Engine (Hours 8–14) ⭐ THE FEATURE

**This is the demo centerpiece. Give it the most time.**

### Task 3.1 — Event Classifier (45 min)
`rag/event_classifier.py`

```python
class MacroEvent(BaseModel):
    is_macro: bool              # worth building a causal chain?
    category: str               # "tech_launch", "rate_decision", "earnings", "geopolitical"
    primary_entities: list[str] # ["OpenAI", "NVIDIA", "AI sector"]
    potential_tickers: list[str]# ["NVDA", "MSFT", "GOOGL"] — pre-seeded hints for LLM
    event_date: date
```

- [ ] Prompt: "Is this a macro event with investment implications? Extract entities and likely affected stocks."
- [ ] Temperature 0.1 — pure classification, must be deterministic
- [ ] Filter: only articles with `is_macro: true` get causal chain treatment

### Task 3.2 — Causal Chain Generator (2 hours)
`rag/causal_chain.py`

This is the hardest and most important piece.

- [ ] `generate_causal_chain(article, user_profile)` → `List[CausalStep]`
- [ ] Use prompt from `MACRO_REASONING_ENGINE.md` exactly
- [ ] Parse and validate each step:
  - `ticker` must be valid format before price lookup
  - Chain length capped at 4 steps
  - Reject if no `high` confidence step exists
- [ ] `user_connection` generation: inject spend profile into final prompt pass

**Test cases to run manually** (before wiring to API):
```
Input: "ECB holds rates at 3.5%"
Expected chain: ECB → Euro bonds → European bank stocks (IBE, SAN) → savings rates
Expected user_connection: references user's savings balance

Input: "NVIDIA beats earnings, raises guidance"  
Expected chain: NVIDIA earnings → AI capex confirmed → cloud stocks → consumer tech
Expected user_connection: references Amazon/Apple spend

Input: "Bitcoin ETF approved in EU"
Expected chain: BTC ETF → crypto legitimacy → exchange stocks → retail investor inflows
```

### Task 3.3 — Price Correlator Integration (1.5 hours)
`rag/price_correlator.py` (extend what was built in Phase 1)

- [ ] `enrich_chain_with_prices(chain, event_date)` → `List[PricedCausalStep]`
  - For each step with a ticker: call `fetch_price_timeline()`
  - If yfinance returns None: set `price_data: null` — don't block the chain
  - Calculate `price_change_pct` for the 5 days post-event
- [ ] Cache aggressively: `viz:price:{ticker}:{event_date}` TTL 1 hour

**Failure mode**: yfinance is flaky. Always have a fallback:
```python
# If live price fails, use mock price data from data/mock_prices.json
# Pre-generate this for NVDA, AMZN, AAPL, MSFT, META, GOOGL
```

- [ ] `scripts/generate_mock_prices.py` — run once, saves realistic 30d price curves
- [ ] This is your demo insurance policy

### Task 3.4 — Causal Chain Endpoint (45 min)
`api/routes/causal_chain.py`

- [ ] `GET /causal-chain/{article_id}` — full response per `MACRO_REASONING_ENGINE.md`
- [ ] Response includes `CausalChainResponse` with all `PricedCausalStep` objects
- [ ] Add to `GET /feed` response: flag articles that have a causal chain available
  ```json
  "has_causal_chain": true,
  "causal_chain_preview": "ChatGPT-5 → NVIDIA → your Amazon spend"
  ```

**Checkpoint**: `GET /causal-chain/{hero_article_id}` returns 3-4 steps, each with price timeline JSON and event pinned. `user_connection` references mock_user_1's Amazon spending.

---

## Phase 4 — API Layer + Integration (Hours 14–18)

### Task 4.1 — Remaining Endpoints (1.5 hours)
- [ ] `GET /eli10/{concept}` — cached LLM explanations
- [ ] `GET /trends` — trending topics with sparklines
- [ ] `GET /spend-map` — simplified (no quiz, just spend → ticker mapping)
- [ ] `GET /tip` — single daily tip from feed + profile

### Task 4.2 — Viz Formatter Sync with Team B (1 hour)
**This is a coordination task, not a coding task.**

- [ ] Start ngrok tunnel
- [ ] Give Team B the URL
- [ ] Walk through `/feed` response together — confirm all chart shapes render
- [ ] Walk through `/causal-chain/{id}` response — confirm `timeline_with_event` renders
- [ ] Fix any shape mismatches NOW, not at demo time
- [ ] Document any changes to `API_CONTRACTS.md`

### Task 4.3 — Quality + Reliability (1.5 hours)
- [ ] Test all 3 mock users produce different, relevant chains
- [ ] Verify every causal chain has at least 1 `high` confidence step
- [ ] Verify price timelines never return nulls for your 6 "hero tickers"
- [ ] Latency check: `/causal-chain` should be < 6s (more complex than feed)
- [ ] Add scheduler: news refresh every 15 min

**Checkpoint**: Two full demo runs back-to-back produce consistent results.

---

## Phase 5 — Demo Prep (Hours 18–20)

### Task 5.1 — Pick Your Demo Articles (30 min)
- [ ] From today's frozen articles, select 3 "hero events":
  - One tech event (product launch, earnings)
  - One macro event (ECB, Fed, inflation data)
  - One wild card (crypto, geopolitical)
- [ ] Pre-warm these in cache: hit their endpoints once before demo
- [ ] Save their `article_id`s somewhere visible

### Task 5.2 — The Demo Narrative (30 min)
Write it out:
> "Meet Alex. He uses N26, shops on Amazon, flies Ryanair. He knows nothing about investing.
> This morning, OpenAI released ChatGPT-5. Most news apps just showed him the headline.
> We showed him this."
> [tap card → causal chain unfolds → NVIDIA price chart → Amazon connection]

### Task 5.3 — Fallback Plan (30 min)
- [ ] If live API is down: have `frozen_articles.json` + `mock_prices.json` loaded
- [ ] If causal chain LLM call fails: have one pre-generated chain saved as JSON
- [ ] If ngrok dies: have Team B point to localhost (be physically together)

### Task 5.4 — Final Seed (30 min)
```bash
python scripts/seed_news.py       # fresh articles
python scripts/pre_warm_cache.py  # hit all hero endpoints once
```

---

## Priority Stack Rank

If time runs short, cut in this order:

| Cut | What you lose |
|-----|--------------|
| `/fund-tracker` | Nice-to-have, not core demo |
| `/eli10` | Useful but not the wow moment |
| `trends` sparklines | Can show as static numbers |
| `spend-map` endpoint | Show inline in feed instead |
| **NEVER CUT** | `/feed` + `/causal-chain` — these are the whole demo |

---

## The Single Most Important Thing

The causal chain + live price timeline is something **no other bank or news app shows**. Bloomberg tells you NVIDIA went up. We tell you why, trace it to your life, and show you the chart with the exact moment it happened.

That's the demo. Everything else is supporting cast.
