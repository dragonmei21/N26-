# API Contracts
**This document is the handoff interface between Team A (backend) and Team B (UI)**
**All shapes are final. Do not change without notifying both teams.**

Base URL: `http://localhost:8000` (dev) | `https://<ngrok-url>` (demo)

---

## Authentication
For hackathon: pass `user_id` as query param. No auth header needed.

---

## Endpoints

---

### `GET /feed`
Returns the personalized news feed for a user.

**Query params**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | string | yes | Mock user ID |
| `limit` | int | no | Default 8, max 20 |
| `category` | string | no | Filter: `crypto`, `stocks`, `macro`, `etf`, `all` |

**Response**:
```json
{
  "user_id": "mock_user_1",
  "generated_at": "2026-02-21T14:30:00Z",
  "feed": [
    {
      "id": "article_abc123",
      "title": "ECB holds rates at 3.5% amid inflation concerns",
      "source_name": "Reuters",
      "source_url": "https://reuters.com/...",
      "published_at": "2026-02-21T10:00:00Z",
      "category": "macro",
      "relevance_score": 0.87,
      "thumbnail_url": "https://...",
      
      "ai_summary": {
        "plain_english": "The European Central Bank kept interest rates unchanged, meaning your savings account rate at N26 stays the same for now.",
        "for_you": "You've saved €1,200 this month. At current rates, that earns you about €2.50/month in interest.",
        "confidence": "high",
        "sources": ["https://reuters.com/...", "https://ecb.europa.eu/..."],
        "disclaimer": "Educational only, not financial advice."
      },

      "visualization": {
        "type": "line_chart",
        "title": "ECB Rate History (12 months)",
        "data": {
          "labels": ["Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25", "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26"],
          "datasets": [
            {
              "id": "ecb_rate",
              "label": "ECB Rate (%)",
              "color": "#00D4A8",
              "values": [4.0, 3.75, 3.75, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5]
            }
          ]
        },
        "annotation": "Rate held steady for 7 months"
      },

      "tags": ["ecb", "interest_rates", "savings", "macro"],
      "is_trending": false,
      "trend_score": 0.2
    }
  ],
  "trending_topics": ["ecb_rates", "bitcoin", "nvidia"],
  "daily_tip": {
    "text": "With rates stable, consider locking in a 6-month savings product before any potential cut.",
    "category": "savings"
  }
}
```

---

### `GET /insight/{article_id}`
Deep dive on a single article with richer AI analysis.

**Path params**: `article_id` — from feed response

**Response**:
```json
{
  "article_id": "article_abc123",
  "title": "ECB holds rates at 3.5%",
  "full_summary": "...(3-4 sentences)...",
  "key_takeaways": [
    "Rates unchanged for 7th consecutive meeting",
    "ECB watching wage growth before cutting",
    "Next decision: March 12, 2026"
  ],
  "what_big_funds_are_doing": {
    "summary": "Vanguard increased European bond allocation by 4% last quarter. BlackRock reduced duration risk.",
    "funds": [
      {
        "name": "Vanguard FTSE Europe ETF",
        "ticker": "VGK",
        "action": "increased bonds",
        "amount_approx": "+4% allocation",
        "what_it_means": "They expect rates to eventually fall, locking in current yields"
      }
    ]
  },
  "what_you_can_do": {
    "for_saver": "Keep money in N26 Instant Savings to benefit from current 2.5% rate.",
    "for_investor": "European bond ETFs may be worth watching if you have a 2+ year horizon.",
    "minimum_amount_eur": 50
  },
  "reasoning_trace": "User has €1,200 in savings and €0 in investment products. ECB rate news directly affects their savings yield.",
  "sources": [
    {"title": "ECB Press Release Feb 2026", "url": "https://ecb.europa.eu/...", "reliability": "primary"},
    {"title": "Reuters Analysis", "url": "https://reuters.com/...", "reliability": "secondary"}
  ],
  "visualization": {
    "type": "comparison_bar",
    "title": "Where Big Funds Put Money After Rate Hold",
    "data": {
      "categories": ["Euro Bonds", "EU Equities", "US Equities", "Cash", "Commodities"],
      "datasets": [
        {"label": "Vanguard", "color": "#00D4A8", "values": [35, 28, 20, 12, 5]},
        {"label": "BlackRock", "color": "#1A1A2E", "values": [20, 35, 30, 10, 5]}
      ]
    }
  }
}
```

---

### `GET /eli10/{concept}`
Explain any financial concept like the user is 10 years old.

**Path params**: `concept` — URL-encoded string, e.g. `interest_rate`, `etf`, `inflation`

**Response**:
```json
{
  "concept": "interest_rate",
  "eli10": "Imagine you lend your friend €10. They pay you back €11 next year. That €1 extra is interest. The ECB decides how much 'extra' banks charge each other — and that flows down to your savings account and your loans.",
  "real_world_example": "Your N26 Instant Savings pays 2.5%/year. On €1,000, you earn €25 without doing anything.",
  "related_concepts": ["inflation", "savings_account", "bond"],
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

---

### `GET /trends`
Current trending financial topics with spike data.

**Response**:
```json
{
  "generated_at": "2026-02-21T14:30:00Z",
  "trending": [
    {
      "topic": "bitcoin",
      "display_name": "Bitcoin",
      "mention_count_24h": 847,
      "mention_count_48h_prev": 312,
      "spike_multiplier": 2.71,
      "is_spike": true,
      "sentiment": "positive",
      "one_liner": "Bitcoin up 12% after US ETF approval rumors",
      "visualization": {
        "type": "sparkline",
        "data": {
          "labels": ["6h ago", "5h ago", "4h ago", "3h ago", "2h ago", "1h ago", "now"],
          "values": [120, 145, 180, 290, 410, 620, 847]
        },
        "color": "#F7931A"
      }
    }
  ]
}
```

---

### `GET /spend-map`
Maps user's spending to relevant investment instruments.

**Query params**: `user_id`

**Response**:
```json
{
  "user_id": "mock_user_1",
  "mappings": [
    {
      "spend_category": "travel",
      "spend_amount_eur_30d": 340,
      "merchant_examples": ["Ryanair", "Booking.com"],
      "related_instruments": [
        {
          "name": "iShares Global Airlines ETF",
          "ticker": "JETS",
          "performance_1y": "+18.4%",
          "what_it_means": "You spend on airlines. You could also own a slice of them.",
          "minimum_invest_eur": 50
        }
      ],
      "visualization": {
        "type": "donut_with_arrow",
        "spend_label": "Your travel spend",
        "spend_value": 340,
        "instrument_label": "JETS ETF 1Y return",
        "instrument_value": 18.4,
        "color": "#00D4A8"
      }
    },
    {
      "spend_category": "grocery",
      "spend_amount_eur_30d": 280,
      "merchant_examples": ["Mercadona", "Lidl"],
      "related_instruments": [
        {
          "name": "Consumer Staples Select SPDR ETF",
          "ticker": "XLP",
          "performance_1y": "+6.2%",
          "what_it_means": "The companies you buy from are publicly traded. Here's how they performed.",
          "minimum_invest_eur": 50
        }
      ],
      "visualization": {
        "type": "donut_with_arrow",
        "spend_label": "Your grocery spend",
        "spend_value": 280,
        "instrument_label": "XLP ETF 1Y return",
        "instrument_value": 6.2,
        "color": "#4CAF50"
      }
    }
  ],
  "total_spend_mapped_eur": 1840,
  "insight": "You spent €1,840 last month. If you had invested equivalent amounts in related ETFs 1 year ago, your theoretical gain would be ~€127."
}
```

---

### `GET /fund-tracker`
What are major funds doing — translated to plain language.

**Query params**: `topic` (optional) — filter by topic

**Response**:
```json
{
  "generated_at": "2026-02-21T14:30:00Z",
  "funds": [
    {
      "name": "ARK Innovation ETF",
      "ticker": "ARKK",
      "manager": "Cathie Wood",
      "latest_moves": [
        {
          "action": "bought",
          "instrument": "Tesla",
          "amount_approx": "$45M",
          "plain_english": "ARK bet big on Tesla this week — they think EV demand is recovering",
          "date": "2026-02-20"
        }
      ],
      "current_top_holdings": ["Tesla", "Coinbase", "Palantir", "Roku"],
      "ytd_performance": -4.2,
      "what_regular_investor_can_do": "Buy ARKK ETF directly for ~€50 min on most EU brokers",
      "visualization": {
        "type": "horizontal_bar",
        "title": "ARK Top Holdings Weight",
        "data": {
          "labels": ["Tesla", "Coinbase", "Palantir", "Roku", "Other"],
          "values": [22, 15, 12, 8, 43],
          "colors": ["#E31937", "#F7931A", "#6C5CE7", "#00B4D8", "#95A5A6"]
        }
      }
    }
  ]
}
```

---

### `GET /tip`
One daily actionable tip based on news + user profile.

**Response**:
```json
{
  "tip": {
    "text": "With ECB rates stable at 3.5%, N26 Instant Savings at 2.5% is still one of the best no-lock-in options in Spain. Consider moving idle money from your main account.",
    "category": "savings",
    "urgency": "low",
    "potential_gain_eur": 18,
    "based_on": ["ecb_rate_hold_news", "user_idle_balance"],
    "cta": {
      "text": "Open Instant Savings",
      "deep_link": "n26://savings/instant"
    }
  }
}
```

---

## Error Format (all endpoints)
```json
{
  "error": {
    "code": "RETRIEVAL_FAILED",
    "message": "Could not retrieve relevant news for this topic",
    "retry_after_seconds": 30
  }
}
```

---

## Visualization Type Reference (for Team B)

| `type` | Chart Component | Library |
|--------|----------------|---------|
| `line_chart` | LineChart | Recharts |
| `comparison_bar` | BarChart grouped | Recharts |
| `sparkline` | LineChart minimal | Recharts |
| `donut_with_arrow` | PieChart + annotation | Recharts |
| `horizontal_bar` | BarChart horizontal | Recharts |
| `simple_number` | Stat card | Custom |

All colors follow N26 palette:
- Primary teal: `#00D4A8`
- Dark navy: `#1A1A2E`  
- Warning amber: `#F59E0B`
- Bitcoin orange: `#F7931A`
- Positive green: `#4CAF50`
- Negative red: `#EF4444`
