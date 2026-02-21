# Macro Reasoning Engine
**The centerpiece feature: News Event → Causal Chain → Personalized Timeline**

---

## What This Is

When a macro news event happens — a Fed rate decision, a product launch, a war, a regulation — there is a **causal chain** that connects it to specific stocks, sectors, and ultimately to the user's life. Most people never see this chain. We show it.

### The Demo Moment

```
User opens N26 app
↓
"OpenAI releases ChatGPT-5" (real news, today)
↓
AI explains the chain:
  OpenAI launches → AI arms race accelerates
  → Cloud compute demand spikes
  → NVIDIA H100 chips are the bottleneck
  → NVIDIA revenue forecast revised up
  → $NVDA +8% in 3 days after announcement
↓
Timeline chart: NVDA price with event pinned at the exact date
↓
"You spent €124 on Amazon last month.
 Amazon runs on NVIDIA chips. They just bought $5B more.
 Here's what that means for your wallet and potentially your portfolio."
```

---

## Architecture Addition: Macro Reasoning Engine

```
[Live News Event]
      │
      ▼
┌─────────────────────────────┐
│     EVENT CLASSIFIER         │
│  - Is this a macro event?   │
│  - Category: tech/macro/    │
│    geo/regulatory/earnings  │
│  - Extract: entities,       │
│    companies, sectors        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│    CAUSAL CHAIN ENGINE       │
│  Claude prompt:             │
│  "Event X happened.         │
│   Trace the investment      │
│   chain reaction step by    │
│   step. Be specific about   │
│   which stocks/ETFs are     │
│   affected and why."        │
│                             │
│  Output:                    │
│  List[CausalStep]           │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│    LIVE PRICE CORRELATOR     │
│  - For each stock in chain: │
│    fetch 30-day price from  │
│    Yahoo Finance            │
│  - Pin event date on chart  │
│  - Calculate % change       │
│    before/after event       │
│  - Build timeline JSON      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│    SPEND PERSONALIZER        │
│  - Match chain companies    │
│    to user's spend profile  │
│  - "You use Amazon →        │
│    Amazon uses NVIDIA"      │
│  - Generate "for_you" copy  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│    CAUSAL CHAIN RESPONSE     │
│  Ready for Team B to render │
└─────────────────────────────┘
```

---

## Data Sources for Live Prices

### Yahoo Finance (no API key needed)
```python
import yfinance as yf

# 30-day price history
ticker = yf.Ticker("NVDA")
hist = ticker.history(period="30d")
# Returns: DataFrame with Date, Open, High, Low, Close, Volume

# Current price
price = ticker.fast_info['last_price']
```

**Free, no rate limits for hackathon usage, no key needed.**
Add to requirements: `yfinance==0.2.36`

### NewsAPI for event detection
Already in plan — use `publishedAt` field to pin the event on the chart.

### ECB API (for macro rate events)
```
https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.MRR_FR.LEV
```
Free, no key, returns rate history as XML/JSON.

---

## CausalChain Data Model

```python
# models/causal.py

class CausalStep(BaseModel):
    step_number: int                    # 1, 2, 3...
    event: str                          # "OpenAI releases GPT-5"
    mechanism: str                      # "AI compute demand surges"
    affected_entity: str               # "NVIDIA"
    entity_type: Literal["company", "sector", "commodity", "currency", "index"]
    ticker: str | None                 # "NVDA" — for price lookup
    direction: Literal["up", "down", "neutral"]
    confidence: Literal["high", "medium", "low"]
    plain_english: str                 # "NVIDIA makes the chips that power AI"


class PricedCausalStep(CausalStep):
    price_data: TimelineChartData      # 30d price with event pinned
    price_change_pct: float | None     # % change after event
    event_date: date                   # when to pin on chart


class CausalChainResponse(BaseModel):
    trigger_event: str                 # "OpenAI releases ChatGPT-5"
    trigger_date: date
    trigger_source_url: str
    chain: list[PricedCausalStep]      # ordered causal steps
    user_connection: str               # "You spend on Amazon, which runs on NVIDIA"
    user_relevance_score: float        # 0-1
    summary: str                       # 2-sentence plain English
    disclaimer: str
```

---

## New API Endpoint

### `GET /causal-chain/{article_id}`

**Response**:
```json
{
  "trigger_event": "OpenAI releases ChatGPT-5 with real-time capabilities",
  "trigger_date": "2026-02-20",
  "trigger_source_url": "https://reuters.com/...",
  "chain": [
    {
      "step_number": 1,
      "event": "OpenAI releases ChatGPT-5",
      "mechanism": "AI race accelerates, all major tech firms race to match",
      "affected_entity": "AI Sector",
      "entity_type": "sector",
      "ticker": null,
      "direction": "up",
      "confidence": "high",
      "plain_english": "Every tech company now needs to build or buy AI fast",
      "price_data": null,
      "price_change_pct": null,
      "event_date": "2026-02-20"
    },
    {
      "step_number": 2,
      "event": "Cloud compute demand spikes",
      "mechanism": "Training and running AI models requires massive GPU clusters",
      "affected_entity": "NVIDIA",
      "entity_type": "company",
      "ticker": "NVDA",
      "direction": "up",
      "confidence": "high",
      "plain_english": "NVIDIA makes the GPUs that power AI. More AI = more NVIDIA",
      "price_data": {
        "type": "timeline_with_event",
        "title": "NVIDIA — 30 Day Price",
        "event_label": "ChatGPT-5 Launch",
        "data": {
          "labels": ["Jan 22", "Jan 23", "...", "Feb 20", "Feb 21", "Feb 22"],
          "values": [136.2, 138.1, "...", 142.5, 151.3, 158.7],
          "event_index": 29,
          "color": "#00D4A8"
        }
      },
      "price_change_pct": 11.4,
      "event_date": "2026-02-20"
    },
    {
      "step_number": 3,
      "event": "Microsoft, Amazon, Google order more NVIDIA chips",
      "mechanism": "Hyperscalers increase capex to compete in AI",
      "affected_entity": "Amazon",
      "entity_type": "company",
      "ticker": "AMZN",
      "direction": "up",
      "confidence": "medium",
      "plain_english": "Amazon Web Services needs more chips to offer AI products",
      "price_data": {
        "type": "timeline_with_event",
        "title": "Amazon — 30 Day Price",
        "event_label": "ChatGPT-5 Launch",
        "data": {
          "labels": ["Jan 22", "...", "Feb 20", "Feb 21", "Feb 22"],
          "values": [224.5, "...", 228.1, 232.4, 235.8],
          "event_index": 29,
          "color": "#F59E0B"
        }
      },
      "price_change_pct": 3.4,
      "event_date": "2026-02-20"
    }
  ],
  "user_connection": "You spent €124 at Amazon last month. Amazon is one of the biggest buyers of NVIDIA chips to power its AI services — including the ones behind your Amazon orders.",
  "user_relevance_score": 0.74,
  "summary": "OpenAI's latest release triggered a GPU demand spike that pushed NVIDIA up 11% and lifted cloud stocks. As an Amazon customer, you're already part of this ecosystem.",
  "disclaimer": "Educational only, not financial advice."
}
```

---

## Causal Chain Prompt

```
SYSTEM:
You are a financial analyst explaining macro investment chains to everyday people.
Your job: trace how a news event ripples through the economy to specific stocks.

Rules:
1. Maximum 4 steps in the chain (keep it digestible)
2. Each step must be logically connected to the previous
3. Only include stocks where the connection is DIRECT and defensible
4. Set confidence "high" only if this is a well-established causal pattern
5. Set confidence "medium" if plausible but not certain
6. Never include a step just because a stock is popular
7. Respond ONLY in valid JSON matching the schema.

USER:
News event: {article_title}
Article content: {article_chunks}
Published: {published_at}

User's spending context: {spend_summary}

Trace the investment causal chain from this event.
For each step identify: the mechanism, affected entity, ticker if public, direction, and plain English explanation.
Then write one sentence connecting the final step to the user's spending.

Respond as JSON: { "chain": [...], "user_connection": "..." }
```

---

## Prompt Quality — Correctness Safeguards

The causal chain is the highest-risk feature for hallucination. These guardrails are mandatory:

**In the prompt:**
- "Only include stocks where the connection is DIRECT and defensible"
- "Never include a step just because a stock is popular"
- `confidence: "low"` forces Team B to show a warning indicator

**In response_parser.py:**
- Reject any chain with 0 `high` confidence steps (too speculative)
- Cap chain length at 4 steps
- Require `ticker` to be a real ticker format (uppercase, 1-5 chars) before price lookup
- If yfinance returns no data for a ticker → set `price_data: null`, don't fabricate

**In the API response:**
- Always include `disclaimer`
- Always show `confidence` per step in the UI (Team B must render this)

---

## Live Price Fetch — `price_correlator.py`

```python
# rag/price_correlator.py

import yfinance as yf
from datetime import date, timedelta

def fetch_price_timeline(ticker: str, event_date: date) -> dict | None:
    """
    Fetch 30 days of price data centered on event_date.
    Returns chart-ready JSON or None if ticker invalid.
    """
    try:
        start = event_date - timedelta(days=20)
        end = event_date + timedelta(days=10)
        
        tk = yf.Ticker(ticker)
        hist = tk.history(start=start, end=end)
        
        if hist.empty:
            return None
        
        labels = [d.strftime("%b %d") for d in hist.index]
        values = [round(v, 2) for v in hist["Close"].tolist()]
        
        # Find index of event_date in the series
        event_index = next(
            (i for i, d in enumerate(hist.index) if d.date() >= event_date),
            len(labels) - 1
        )
        
        # Price change: close on event_date vs 5 days before
        pre_event_price = hist["Close"].iloc[max(0, event_index - 5)]
        post_event_price = hist["Close"].iloc[min(len(hist) - 1, event_index + 3)]
        pct_change = round(((post_event_price - pre_event_price) / pre_event_price) * 100, 2)
        
        return {
            "labels": labels,
            "values": values,
            "event_index": event_index,
            "pct_change": pct_change
        }
        
    except Exception:
        return None  # Always fail gracefully, never crash
```

---

## Updated API Contracts Addition for Team B

Team B needs one new visualization type:

```
type: "timeline_with_event"
```

```jsx
// TimelineWithEventChart.jsx
// Renders a line chart with a vertical dashed line at event_index
// Shows event_label as annotation on the line
// Shows price_change_pct badge (green if positive, red if negative)

<ReferenceLine
  x={data.event_index}
  stroke="#F59E0B"
  strokeDasharray="4 4"
  label={{ value: eventLabel, position: 'top', fill: '#F59E0B' }}
/>
```

---

## Demo Flow with Causal Chain

**Setup**: seed with today's real top financial news. Pick the 2-3 most dramatic events.

**Moment 1 — Feed loads**
→ User sees personalized feed. One card has a NVDA sparkline already trending up.

**Moment 2 — Tap the card**
→ Causal chain unfolds: 4 steps, each with a price timeline, event pinned.
→ "Here's why this happened, step by step."

**Moment 3 — The personal hook**
→ Bottom of chain: "You spent €124 on Amazon. Amazon buys NVIDIA chips. You're already in this story."

**This is the wow moment. No other bank shows you this.**
