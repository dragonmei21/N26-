# Frontend ↔ Backend Connection Guide
**N26 AI News Curator — Team A Backend**

---

## Quick Start

### 1. Get the Live URL

Team A will share a URL via ngrok:
```
https://abc123.ngrok.io
```
This is your `BASE_URL` for every request. It changes each time Team A restarts ngrok — ask for a fresh one if requests start failing.

### 2. Set Base URL in Your Code

```js
const BASE_URL = "https://abc123.ngrok.io"  // replace with Team A's current URL
```

### 3. No Auth Required

All origins are allowed. No tokens. No headers. Just pass `user_id` as a query param.

---

## Mock Users

| `user_id`     | Name  | Risk Profile | Monthly Spend |
|---------------|-------|--------------|---------------|
| `mock_user_1` | Alex  | Low risk — groceries, transport, Spotify | ~€532 |
| `mock_user_2` | Marco | High risk — Amazon, Apple, crypto, travel | ~€2,055 |

Pass `user_id` as a query param on every request that requires it.

---

## Startup Sequence (Team A Only)

Before the frontend calls anything, Team A must run:

```bash
# 1. Seed the news index (run once, or after data refresh)
python scripts/seed_news.py

# 2. Start the server
uvicorn api.main:app --reload --port 8000

# 3. Optional: pre-warm feed cache (run in separate terminal)
python scripts/pre_warm_cache.py
```

---

## Environment Variables Required

Only one variable is mandatory:

```
OPENAI_API_KEY=sk-...
```

Everything else uses defaults or mock data.

---

## Recommended Demo Call Order

```
1. GET  /feed?user_id=mock_user_2&limit=8      ← MUST be first — populates cache for podcast
2. GET  /trends                                 ← trending financial topics
3. GET  /causal-chain/{article_id}?user_id=...  ← pick an id from step 1
4. GET  /spend-map?user_id=mock_user_2
5. GET  /tip?user_id=mock_user_2
6. GET  /eli10/{concept}                        ← e.g. /eli10/interest_rate
7. POST /podcast/generate?...&length=flash      ← AFTER step 1
8. GET  /podcast/{podcast_id}/stream            ← stream the audio
```

> **Critical**: `/podcast/generate` reads from the feed cache. If `/feed` has not been called first, the podcast will have no articles to talk about.

---

## Endpoints

---

### `GET /feed`

Personalised news feed with AI summaries ranked by the user's spend profile.

**Request:**
```
GET /feed?user_id=mock_user_2&limit=8
```

| Param    | Required | Default | Description                   |
|----------|----------|---------|-------------------------------|
| `user_id`| Yes      | —       | `mock_user_1` or `mock_user_2` |
| `limit`  | No       | `8`     | Max articles returned (max 20) |

**Response:**
```json
{
  "user_id": "mock_user_2",
  "name": "Marco",
  "risk_appetite": "high",
  "generated_at": "2026-02-21T15:00:00Z",
  "feed": [
    {
      "id": "4de7eff6cd11c550",
      "title": "Rampant AI demand for memory is fueling a growing chip crisis",
      "source_name": "Fortune",
      "source_url": "https://...",
      "published_at": "2026-02-21T10:00:00Z",
      "category": "financial",
      "relevance_score": 0.43,
      "thumbnail_url": "https://...",
      "has_causal_chain": true,
      "ai_summary": {
        "plain_english": "AI chip demand is outpacing supply, threatening to slow down AI development.",
        "for_you": "Your Amazon and Apple spending connects you to this story.",
        "disclaimer": "Educational only, not financial advice."
      }
    }
  ]
}
```

**Notes:**
- `has_causal_chain` is always `true` in the demo — every article supports the causal chain endpoint
- Response is cached for 1 hour per user — fast on repeat calls
- The feed is also written to internal cache so `/podcast/generate` can read it

---

### `GET /trends`

Global trending financial topics with sparkline data for the past 6 hours.

**Request:**
```
GET /trends
```

No params required.

**Response:**
```json
{
  "generated_at": "2026-02-21T15:00:00Z",
  "trending": [
    {
      "topic": "federal_reserve",
      "display_name": "Federal Reserve",
      "mention_count_24h": 18,
      "mention_count_48h_prev": 9,
      "spike_multiplier": 2.0,
      "is_spike": true,
      "sentiment": "neutral",
      "one_liner": "Fed signals rate pause as inflation cools toward 2% target",
      "visualization": {
        "type": "sparkline",
        "data": {
          "labels": ["6h ago", "5h ago", "4h ago", "3h ago", "2h ago", "1h ago", "now"],
          "values": [1, 1, 2, 3, 4, 5, 18]
        },
        "color": "#00D4A8"
      }
    }
  ]
}
```

**Notes:**
- `is_spike: true` means the topic is mentioned 2× more than the prior 48h period
- `one_liner` is AI-generated, describes why the topic is trending
- Sparkline `values[-1]` always equals `mention_count_24h`

---

### `GET /causal-chain/{article_id}`

Full macro reasoning chain for a news event, personalised to the user's spend profile.

**Request:**
```
GET /causal-chain/4de7eff6cd11c550?user_id=mock_user_2
```

| Param       | Required | Description                          |
|-------------|----------|--------------------------------------|
| `article_id`| Yes (path)| Article `id` from `/feed` response  |
| `user_id`   | Yes (query)| `mock_user_1` or `mock_user_2`     |

**Response:**
```json
{
  "trigger_event": "Rampant AI demand for memory is fueling a growing chip crisis",
  "trigger_date": "2026-02-21",
  "trigger_source_url": "https://...",
  "chain": [
    {
      "step_number": 1,
      "event": "AI chip demand surges",
      "mechanism": "Every major tech company races to build AI infrastructure",
      "affected_entity": "AI Sector",
      "entity_type": "sector",
      "ticker": null,
      "direction": "up",
      "confidence": "high",
      "plain_english": "More AI means more chips needed across the entire industry",
      "price_data": null,
      "price_change_pct": null,
      "event_date": "2026-02-21"
    },
    {
      "step_number": 2,
      "event": "NVIDIA revenue forecast raised",
      "mechanism": "AI chip demand directly boosts NVIDIA's data center revenue",
      "affected_entity": "NVIDIA",
      "entity_type": "company",
      "ticker": "NVDA",
      "direction": "up",
      "confidence": "high",
      "plain_english": "NVIDIA makes the chips powering every AI system, so demand surge = revenue surge",
      "price_data": {
        "type": "timeline_with_event",
        "title": "NVIDIA — 30 Day Price",
        "event_label": "Chip Crisis Report",
        "data": {
          "labels": ["Jan 22", "Jan 29", "Feb 05", "Feb 12", "Feb 21"],
          "values": [136.2, 141.5, 152.3, 158.7, 167.3],
          "event_index": 20,
          "color": "#00D4A8"
        }
      },
      "price_change_pct": 5.41,
      "event_date": "2026-02-21"
    }
  ],
  "user_connection": "You spend on Amazon, which is one of the biggest buyers of NVIDIA chips.",
  "user_relevance_score": 0.85,
  "summary": "Analysis of AI chip article mapped to your spend profile.",
  "disclaimer": "Educational only, not financial advice."
}
```

**Chain step fields:**
| Field | Type | Description |
|-------|------|-------------|
| `direction` | `"up"` \| `"down"` | Impact direction |
| `confidence` | `"high"` \| `"medium"` \| `"low"` | AI confidence in this step |
| `ticker` | string \| null | Stock ticker if entity is a company |
| `price_data` | object \| null | Only present when `ticker` is set and data is available |
| `price_change_pct` | float \| null | % price change around the event date |
| `event_date` | ISO date string | When this step occurs |

**Notes:**
- Only call this for articles where `has_causal_chain: true`
- Has a pre-generated fallback for hero demo articles — will never return 500
- `user_connection` is tailored to the specific `user_id` passed

---

### `GET /spend-map`

Maps the user's monthly spending categories to related investment instruments.

**Request:**
```
GET /spend-map?user_id=mock_user_2
```

**Response:**
```json
{
  "user_id": "mock_user_2",
  "mappings": [
    {
      "spend_category": "ecommerce",
      "spend_amount_eur_30d": 342.30,
      "merchant_examples": ["Amazon", "Zalando"],
      "related_instruments": [
        {
          "name": "Invesco QQQ Trust",
          "ticker": "QQQ",
          "performance_1y": "+18.4%",
          "what_it_means": "The platforms you shop on power this index. Your spending habits are already driving their revenue.",
          "minimum_invest_eur": 50
        }
      ],
      "visualization": {
        "type": "donut_with_arrow",
        "spend_label": "Your ecommerce spend",
        "spend_value": 342.30,
        "instrument_label": "QQQ 1Y return",
        "instrument_value": 18.4,
        "color": "#00D4A8"
      }
    }
  ],
  "total_spend_mapped_eur": 2055.36,
  "insight": "You spent €2055 last month. If you had invested equivalent amounts in related ETFs 1 year ago, your theoretical gain would be ~€410."
}
```

**Spend categories supported:**
`groceries`, `ecommerce`, `travel`, `subscriptions`, `tech`, `crypto`, `investing`, `clothing`, `home`, `food_drink`, `transport`

---

### `GET /tip`

One daily actionable financial tip based on the user's news feed and spend profile.

**Request:**
```
GET /tip?user_id=mock_user_2
```

**Response:**
```json
{
  "tip": {
    "text": "AI chip demand is surging. Your Amazon spend connects you to this trend via AWS.",
    "category": "investing",
    "urgency": "medium",
    "potential_gain_eur": 45,
    "based_on": ["nvidia_earnings", "user_tech_spend"],
    "cta": {
      "text": "Open Instant Savings",
      "deep_link": "n26://savings/instant"
    }
  }
}
```

**Field values:**
- `category`: `"savings"` | `"investing"` | `"crypto"` | `"spending"`
- `urgency`: `"low"` | `"medium"` | `"high"`

---

### `GET /eli10/{concept}`

Explains a financial concept in simple terms (as if to a 10-year-old), with a real-world example and related concepts.

**Request:**
```
GET /eli10/interest_rate
GET /eli10/inflation
GET /eli10/etf
GET /eli10/bitcoin
GET /eli10/dividend
GET /eli10/bond
```

Concept slugs are case-insensitive. Spaces and hyphens are treated as underscores.

**Response:**
```json
{
  "concept": "interest_rate",
  "eli10": "An interest rate is like a fee the bank charges for lending you money — or a reward for letting them keep yours.",
  "real_world_example": "If you put €100 in a savings account with 3% interest, after a year you get €103 back without doing anything.",
  "related_concepts": ["inflation", "savings_account", "bond", "ecb"],
  "visualization": {
    "type": "simple_number",
    "label": "Your current N26 savings rate",
    "value": 2.5,
    "unit": "%",
    "comparison": {
      "label": "ECB base rate",
      "value": 3.5
    }
  }
}
```

**Concepts with hardcoded visualizations:**
| Concept | Visualization Data |
|---------|-------------------|
| `interest_rate` | N26 rate (2.5%) vs ECB base (3.5%) |
| `inflation` | EU inflation (2.8%) vs ECB target (2.0%) |
| `etf` | S&P 500 10yr avg (10.5%) vs savings account (2.5%) |
| `dividend` | Avg EU dividend yield (3.2%) vs ECB base (3.5%) |
| `bitcoin` | Bitcoin 1Y return (112%) vs S&P 500 (24%) |

**Notes:**
- Responses are cached in-memory per concept — instant on repeat calls
- Any unknown concept returns a graceful AI-generated response

---

### `POST /podcast/generate`

Generates a personalised audio briefing. Returns metadata including stream URL.

> **Prerequisite**: Call `GET /feed?user_id=...` first. The podcast reads the feed from cache.

**Request:**
```
POST /podcast/generate?user_id=mock_user_2&length=flash&mode=personal
```

| Param    | Required | Options |
|----------|----------|---------|
| `user_id`| Yes      | `mock_user_1` \| `mock_user_2` |
| `length` | Yes      | `flash` (~45s) · `brief` (~3min) · `deep_dive` (~10min) |
| `mode`   | Yes      | `personal` (uses their feed) · `macro` (uses trending topics) |

**Response:**
```json
{
  "podcast_id": "a3f9c1b2",
  "user_id": "mock_user_2",
  "length": "flash",
  "mode": "personal",
  "title": "Your Flash — Feb 21",
  "estimated_duration_sec": 45,
  "audio_url": "/podcast/a3f9c1b2/stream",
  "created_at": "2026-02-21T15:00:00Z"
}
```

**Notes:**
- This is async — it takes several seconds to generate (TTS synthesis)
- `audio_url` is the path to stream — prepend `BASE_URL` to get the full URL
- Podcast metadata is cached for 24 hours

---

### `GET /podcast/{podcast_id}/stream`

Streams the MP3 file. Plug directly into an `<audio>` tag.

**Request:**
```
GET /podcast/a3f9c1b2/stream
```

**Response:** MP3 audio stream (Content-Type: `audio/mpeg`), supports byte-range requests.

**HTML usage:**
```html
<audio controls src="https://abc123.ngrok.io/podcast/a3f9c1b2/stream" />
```

---

### `POST /podcast/{podcast_id}/progress`

Save the user's playback position. Call every 10–15 seconds while the audio is playing.

**Request:**
```
POST /podcast/a3f9c1b2/progress?user_id=mock_user_2&position_seconds=30
```

**Response:**
```json
{ "ok": true }
```

---

### `GET /podcast/{podcast_id}/notification-check`

Check whether to send a "come back and finish" push notification. The notification triggers if the user has listened to at least 20% but not finished, and at least 2 hours have passed.

**Request:**
```
GET /podcast/a3f9c1b2/notification-check?user_id=mock_user_2
```

**Response (should notify):**
```json
{
  "send_notification": true,
  "title": "You left something unfinished",
  "body": "You were 42% through your financial briefing. We saved your spot.",
  "deep_link": "n26://podcast/a3f9c1b2?resume=true",
  "resume_position_seconds": 19
}
```

**Response (no notification):**
```json
{ "send_notification": false }
```

---

### `GET /health`

Server health check. No params.

```json
{ "status": "ok" }
```

---

## Error Format

All endpoints return errors in this shape:
```json
{
  "detail": "Article abc123 not found."
}
```

| HTTP Status | When |
|-------------|------|
| `200` | Success |
| `400` | Bad input (e.g. article is not a macro event) |
| `404` | Resource not found (invalid user_id, article_id) |
| `500` | Server error |

---

## CORS

```
allow_origins: ["*"]
allow_methods: ["*"]
allow_headers: ["*"]
```

No auth headers needed. No preflight issues.

---

## Cache Dependency Map

Some endpoints depend on others having been called first:

```
GET /feed          → writes to cache["feed:{user_id}"]
                        ↓
POST /podcast/generate  reads from cache["feed:{user_id}"]

GET /eli10/{concept}   → cached per concept (in-memory, session lifetime)
GET /feed              → cached per user (1 hour TTL)
POST /podcast/generate → podcast metadata cached 24 hours
```

---

## Full Demo Flow (Copy-Paste Ready)

```js
const BASE_URL = "https://abc123.ngrok.io"  // swap with Team A's ngrok URL
const USER = "mock_user_2"

// 1. Load personalised feed (MUST be called first)
const feed = await fetch(`${BASE_URL}/feed?user_id=${USER}&limit=8`).then(r => r.json())

// 2. Get trending topics
const trends = await fetch(`${BASE_URL}/trends`).then(r => r.json())

// 3. Pick first article with has_causal_chain: true
const articleId = feed.feed.find(a => a.has_causal_chain)?.id
const chain = await fetch(`${BASE_URL}/causal-chain/${articleId}?user_id=${USER}`).then(r => r.json())

// 4. Spend map
const spendMap = await fetch(`${BASE_URL}/spend-map?user_id=${USER}`).then(r => r.json())

// 5. Daily tip
const tip = await fetch(`${BASE_URL}/tip?user_id=${USER}`).then(r => r.json())

// 6. Explain a concept
const eli10 = await fetch(`${BASE_URL}/eli10/interest_rate`).then(r => r.json())

// 7. Generate podcast (after /feed)
const podcast = await fetch(
  `${BASE_URL}/podcast/generate?user_id=${USER}&length=flash&mode=personal`,
  { method: "POST" }
).then(r => r.json())

// 8. Stream audio
const audioUrl = `${BASE_URL}${podcast.audio_url}`
// <audio controls src={audioUrl} />
```
