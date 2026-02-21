# N26 AI Financial News Curator — Master Specification
**Hackathon: Road to Start Barcelona | 21.02.2026**
**Team A Scope: Strategy Engine + Visualization Data Layer**

---

## 1. Product Vision

N26 users already share everything with us — where they eat, fly, shop, save. We use that behavioral fingerprint to serve them **hyper-personalized financial news** that feels less like Bloomberg and more like a smart friend who knows their money.

> "You spent €340 at Ryanair last month. Here's how rising fuel costs and the ECB rate decision could affect your next flight price — and what you can do about it."

This is not a news reader. It is a **wealth education engine** that converts passive spending data into active financial literacy and investment awareness.

---

## 2. Core Principles

| Principle | Implementation |
|-----------|---------------|
| **Transparency first** | Every insight shows its source and reasoning |
| **Correctness over speed** | Hallucination prevention via RAG + source citation |
| **Visual > text** | Every data point maps to a chart, not a paragraph |
| **Spend → Insight** | User's own transactions are the personalization signal |
| **Big fund logic, individual scale** | Teach Blackrock/Vanguard thinking in €50 increments |

---

## 3. System Overview

```
[News Sources] → [Ingestion Pipeline] → [Vector Store]
                                              ↓
[User Spend Profile] → [Relevance Engine] → [RAG Core]
                                              ↓
                                    [Insight Generator]
                                              ↓
                              [Visualization Data Formatter]
                                              ↓
                                    [API Response Layer]
                                    (consumed by Team B UI)
```

---

## 4. Team Split

### Team A — YOU (Strategy Engine + Data Brain)
- News ingestion & vector indexing
- Spend-profile personalization engine
- RAG pipeline (LLM + citations)
- Trend detection & alerting logic
- Visualization data contracts (JSON shapes for charts)
- All backend API endpoints

### Team B — Partners (UI / Experience Layer)
- React Native / Web UI consuming Team A APIs
- Chart rendering (Recharts / D3)
- N26 design system implementation
- Onboarding & preferences flow

---

## 5. MVP Feature Set (24h Scope)

### P0 — Must Demo
1. **Personalized feed**: 5–8 news items ranked by spend relevance
2. **AI summary**: Each item has a 2-sentence plain-English summary
3. **"What this means for you"**: 1 sentence tied to user's spending
4. **Big fund tracker**: Show what top ETFs/funds are doing in 1 topic
5. **ELI10 explainer**: Tap any concept → plain language modal data

### P1 — Strong Demo
6. **Trend detection**: Flag if a topic is spiking (>3x mentions in 24h)
7. **Daily tip**: One actionable sentence based on news + spending

### P2 — Bonus / Wow Factor
8. **Spend → Investment map**: "Your €200/month on Amazon → here's AMZN performance vs S&P"
9. **Fund following**: Mirror what Vanguard/ARK/Bridgewater holds in plain terms

---

## 6. Non-Goals (for this hackathon)

- Actual trade execution
- Real N26 API integration (mock data is fine)
- Multi-language support
- Push notifications infrastructure
- User authentication (assume authenticated session)

---

## 7. Success Metrics for Judging

| Criteria | Weight | How we win |
|----------|--------|------------|
| Proof of Concept | 40% | Live demo: feed loads, summaries work, citations visible |
| User Experience | 30% | Team B delivers clean visuals from our data contracts |
| AI Innovation | 20% | Spend-to-insight personalization is the differentiator |
| N26 Fit | 10% | Tied to existing N26 app mental model |

---

## 8. Tech Stack Decision

| Layer | Choice | Why |
|-------|--------|-----|
| Language | Python 3.11 | Fast prototyping, best AI libs |
| API Framework | FastAPI | Auto docs, async, fast |
| Vector DB | ChromaDB (in-memory) | No infra needed, hackathon-ready |
| LLM | Claude claude-sonnet-4-6 via Anthropic API | Best reasoning, citations |
| News Source | NewsAPI.org + GNews | Free tier, financial category |
| Mock Spend Data | JSON fixture | Realistic N26 transaction structure |
| Embeddings | `all-MiniLM-L6-v2` (sentence-transformers) | Fast, free, good quality |
| Cache | Python dict / Redis optional | Keep latency low |
| Deployment | Uvicorn local + ngrok tunnel | Demo-ready in minutes |

---

## 9. Correctness & Transparency Standards

Every LLM response MUST include:
- `sources[]` — array of article URLs used
- `confidence` — low/medium/high based on source count
- `disclaimer` — "This is educational, not financial advice"
- `reasoning_trace` — brief (1–2 sentences) on why this is relevant to user

No fabricated statistics. If data is unavailable, return `null` not guesses.
