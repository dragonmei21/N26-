# Demo Script — N26 AI News Curator

## The Narrative

> "Meet Alex. He uses N26, shops on Amazon, flies Ryanair.
> He knows nothing about investing.
> This morning, OpenAI released ChatGPT-5. Most news apps just showed him the headline.
> **We showed him this.**"
> [tap card → causal chain unfolds → NVIDIA price chart → Amazon connection]

---

## Hero Articles

| # | Article ID | Title | Category | Demo Moment |
|---|-----------|-------|----------|-------------|
| 1 | `4a78a6cfdc3be77a` | OpenAI releases ChatGPT-5 | Tech | **Primary wow moment** — NVDA chain |
| 2 | `937b0457b2a098e0` | ECB holds rates at 3.5% | Macro | Savings rate / N26 connection |
| 3 | `130268006d14a68d` | EU Bitcoin ETF approved | Crypto | Wildcard / institutional angle |
| 4 | `20fe422209448409` | NVIDIA beats Q4 earnings +23% | Tech | Backup tech hero |

---

## Demo Flow (7 steps)

```
1. SLIDE — "Hi, we're Team A. Banks give you news. We give you clarity."
2. SLIDE — Problem: 89% of N26 users never open the Investing tab
3. SWITCH TO BROWSER — "Let me show you the moment it clicks for Alex"
4. GET /feed?user_id=mock_user_1
   → Scroll to article: "OpenAI releases ChatGPT-5"
   → Tap the article card
5. GET /causal-chain/4a78a6cfdc3be77a?user_id=mock_user_1
   → Chain unfolds: ChatGPT-5 → NVIDIA chips → AWS cloud demand → Amazon stock
   → Show price timeline pinned to launch day
   → PAUSE on "You spent €124 at Amazon last month. Amazon is deeply invested in AI."
   → LET THE WOW LAND.
6. SWITCH BACK TO SLIDES — "Here's the tech behind this in 30 seconds"
7. END — "Thank you. Questions?"
```

---

## Pre-Demo Commands (run in this order, 30 min before)

```bash
# 1. Activate environment
source venv/bin/activate   # or: source test_venv/bin/activate

# 2. Seed ChromaDB with frozen articles
python scripts/seed_news.py

# 3. Start the server
uvicorn api.main:app --reload --port 8000 &

# 4. Warm all demo endpoints (run AFTER server is up)
python scripts/pre_warm_cache.py

# 5. Smoke test hero endpoint
curl "http://localhost:8000/causal-chain/4a78a6cfdc3be77a?user_id=mock_user_1" | python -m json.tool | grep -E '"confidence"|"event"'
# Expected: at least one "confidence": "high"
```

---

## Pre-Demo Checklist

- [ ] `uvicorn api.main:app` starts without errors
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] `GET /feed?user_id=mock_user_1` returns 8 articles
- [ ] `GET /causal-chain/4a78a6cfdc3be77a?user_id=mock_user_1` returns `chain` with ≥3 steps, ≥1 `"high"` confidence
- [ ] `GET /spend-map?user_id=mock_user_1` and `mock_user_2` return different categories
- [ ] `GET /eli10/interest_rate` called twice — second call is instant (cache hit)
- [ ] Browser zoom at 125–150% so audience can read
- [ ] Do Not Disturb mode ON
- [ ] Laptop plugged in
- [ ] Team B URL confirmed (ngrok or localhost if co-located)

---

## Fallback Procedures

### If causal chain LLM fails (empty chain / slow API)
**Nothing breaks.** `data/fallback_chain.json` is pre-loaded. The endpoint automatically serves the pre-generated chain for all 4 hero articles. No action needed — the demo just works.

### If Anthropic API is rate-limited
Same as above — fallback chain activates automatically. `/tip` and `/eli10` also have hardcoded fallbacks built into their routes.

### If ngrok dies
Tell Team B to point to `http://localhost:8000` and be physically together at the same machine.

### If the whole server crashes
```bash
# Restart in 10 seconds:
uvicorn api.main:app --port 8000
python scripts/pre_warm_cache.py
```

### If WiFi dies
The entire stack runs offline — `frozen_articles.json`, `mock_prices.json`, and `fallback_chain.json` are all local files. Kill the network and it still works.

---

## Key URLs During Demo

```
GET http://localhost:8000/feed?user_id=mock_user_1
GET http://localhost:8000/causal-chain/4a78a6cfdc3be77a?user_id=mock_user_1
GET http://localhost:8000/causal-chain/937b0457b2a098e0?user_id=mock_user_2
GET http://localhost:8000/spend-map?user_id=mock_user_1
GET http://localhost:8000/eli10/interest_rate
GET http://localhost:8000/trends
```

---

## The Single Most Important Thing

The causal chain + live price timeline is something no other bank or news app shows.

Bloomberg tells you NVIDIA went up. We tell you why, trace it to your life, and show you the chart with the exact moment it happened.

**That's the demo. Everything else is supporting cast.**
