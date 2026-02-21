# Team B — Connection Instructions
**How to connect your frontend to Team A's backend**

---

## Step 1 — Get the Live URL

Team A will share a URL that looks like:
```
https://abc123.ngrok.io
```
This is your `BASE_URL` for every request. It changes every time Team A restarts ngrok — ask for a new one if requests start failing.

---

## Step 2 — Set Your Base URL

In your frontend config:
```js
const BASE_URL = "https://abc123.ngrok.io"  // swap with Team A's current URL
```

---

## Step 3 — Mock Users

There are two users available for the demo:

| user_id | Name | Risk profile |
|---------|------|-------------|
| `mock_user_1` | Alex | Low risk — groceries, transport, Spotify |
| `mock_user_2` | Marco | High risk — Amazon, Apple, crypto, travel |

Pass `user_id` as a query param on every request.

---

## Endpoints

### `GET /feed`
Personalised news feed with AI summaries.

```
GET /feed?user_id=mock_user_2&limit=8
```

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

---

### `GET /causal-chain/{article_id}`
Full macro reasoning chain for a news event. Use the `id` from a feed article.

```
GET /causal-chain/4de7eff6cd11c550?user_id=mock_user_2
```

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
      "affected_entity": "NVIDIA",
      "ticker": "NVDA",
      "direction": "up",
      "confidence": "high",
      "price_data": {
        "type": "timeline_with_event",
        "title": "NVIDIA — 30 Day Price",
        "event_label": "Chip Crisis Report",
        "data": {
          "labels": ["Jan 22", "...", "Feb 21"],
          "values": [136.2, "...", 167.3],
          "event_index": 20,
          "color": "#00D4A8"
        }
      },
      "price_change_pct": 5.41
    }
  ],
  "user_connection": "You spend on Amazon, which is one of the biggest buyers of NVIDIA chips.",
  "user_relevance_score": 0.85,
  "summary": "AI chip demand is pushing NVIDIA higher and impacting every cloud provider.",
  "disclaimer": "Educational only, not financial advice."
}
```

**Note:** Only call this for articles where `has_causal_chain: true`.

---

### `GET /spend-map`
Maps the user's spending to related investment instruments.

```
GET /spend-map?user_id=mock_user_2
```

```json
{
  "user_id": "mock_user_2",
  "mappings": [
    {
      "spend_category": "ecommerce",
      "spend_amount_eur_30d": 342.30,
      "merchant_examples": ["Amazon"],
      "related_instruments": [
        {
          "ticker": "AMZN",
          "name": "Amazon",
          "what_it_means": "You shop on Amazon. You could also own a slice of it."
        }
      ],
      "visualization": {
        "type": "donut_with_arrow",
        "spend_label": "Your ecommerce spend",
        "spend_value": 342.30,
        "color": "#00D4A8"
      }
    }
  ],
  "total_spend_mapped_eur": 2055.36
}
```

---

### `GET /tip`
One daily actionable tip based on the user's news feed and spend profile.

```
GET /tip?user_id=mock_user_2
```

```json
{
  "tip": {
    "text": "AI chip demand is surging. Your Amazon spend connects you to this trend via AWS.",
    "category": "investing",
    "urgency": "medium",
    "based_on": ["ai_chip_crisis_news", "amazon_spend"],
    "disclaimer": "Educational only, not financial advice."
  }
}
```

---

### `POST /podcast/generate`
Generates a personalised audio briefing. Returns metadata including the stream URL.

```
POST /podcast/generate?user_id=mock_user_2&length=flash&mode=personal
```

| param | options |
|-------|---------|
| `length` | `flash` (~45s) · `brief` (~3min) · `deep_dive` (~10min) |
| `mode` | `personal` (uses their feed) · `macro` (uses trending topics) |

```json
{
  "podcast_id": "a3f9c1b2",
  "user_id": "mock_user_2",
  "length": "flash",
  "mode": "personal",
  "title": "Your Flash — Feb 21",
  "estimated_duration_sec": 45,
  "audio_url": "/podcast/a3f9c1b2/stream",
  "created_at": "2026-02-21T15:00:00Z",
  "progress_pct": 0.0,
  "finished": false
}
```

**Important:** Call `GET /feed` for the user first, then call `/podcast/generate`. The podcast reads from the feed cache — if feed hasn't been called, the script will have no articles to talk about.

---

### `GET /podcast/{podcast_id}/stream`
Streams the MP3 file directly. Plug straight into an `<audio>` tag.

```html
<audio controls src="https://abc123.ngrok.io/podcast/a3f9c1b2/stream" />
```

---

### `POST /podcast/{podcast_id}/progress`
Save the user's playback position (call every 10–15 seconds while playing).

```
POST /podcast/a3f9c1b2/progress?user_id=mock_user_2&position_seconds=30
```

```json
{ "ok": true }
```

---

### `GET /podcast/{podcast_id}/notification-check`
Check whether to send a "come back and finish" push notification.

```
GET /podcast/a3f9c1b2/notification-check?user_id=mock_user_2
```

```json
{
  "send_notification": true,
  "title": "You left something unfinished",
  "body": "You were 42% through your financial briefing. We saved your spot.",
  "deep_link": "n26://podcast/a3f9c1b2?resume=true",
  "resume_position_seconds": 19
}
```

---

## Error Format

All endpoints return errors in this shape:
```json
{
  "detail": "Article abc123 not found."
}
```

HTTP status codes: `404` not found · `400` bad input · `500` server error

---

## Recommended Demo Call Order

```
1. GET  /feed?user_id=mock_user_2          ← loads + caches the feed
2. GET  /causal-chain/{article_id}?...     ← pick an id from step 1
3. GET  /spend-map?user_id=mock_user_2
4. GET  /tip?user_id=mock_user_2
5. POST /podcast/generate?...&length=flash  ← do this AFTER step 1
6. GET  /podcast/{id}/stream               ← stream the audio
```

---

## CORS

All origins are allowed. No auth headers needed. Pass `user_id` as a query param only.
