# FRONTEND_STATUS.md

> **Generated**: 2026-02-21  
> **Project**: N26 AI Financial App (Hackathon)  
> **Purpose**: Machine-readable and human-readable frontend overview for frontend/backend integration planning.  
> **Companion file**: `BACKEND_STATUS.md` (maintained by backend team)

---

## 1. High-Level Overview

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build tool | Vite 5 |
| Routing | react-router-dom v6 |
| Server state | @tanstack/react-query v5 |
| Animation | framer-motion v12 |
| UI primitives | shadcn/ui (Radix UI) |
| Icons | lucide-react |
| Charts | recharts |
| Styling | Tailwind CSS v3 |
| Testing | Vitest 3 + jsdom + @testing-library/react |
| Forms | react-hook-form + zod |

### State Management

- **No global state manager** (no Redux, no Zustand, no Context API).
- State is **local per page** using `useState` / `useMemo` / `useCallback`.
- The only cross-render persistence is `localStorage` (AI toggle flag).
- `@tanstack/react-query` is installed but **not yet used** for API calls — all fetches are raw `fetch()` calls inline or in utility functions.

### Routing

```
/              → pages/Index.tsx       (Home / Dashboard)
/finances      → pages/Finances.tsx
/investments   → pages/Investments.tsx  ← PRIMARY FEATURE PAGE
/benefits      → pages/Benefits.tsx
/cards         → pages/Cards.tsx
/scenarios     → pages/Scenarios.tsx
*              → pages/NotFound.tsx
```

`BottomNav` appears on all routes. `/scenarios` has no bottom nav entry — it is navigated to from the Portfolio tab via the Scenarios button.

### Folder Structure

```
src/
├── components/         # All UI components (feature + shared + shadcn/ui/)
├── data/               # Static mock data (stories, holdings, market data)
├── hooks/              # Custom React hooks
├── lib/                # Pure business logic (simulation engine, insights)
│   └── scenarios/      # Historical scenario presets
├── mocks/              # In-memory mock data for Pool Portfolios
├── pages/              # Route-level page components
├── types/              # TypeScript interfaces
├── utils/              # Pure utility functions
│   └── __tests__/      # Unit tests
└── test/               # Vitest setup
```

---

## 2. Feature Modules

---

### Feature: Portfolio Page

**Purpose**: Central investment hub. Three sub-tabs: Explore, Portfolio, Macro. The Portfolio sub-tab is the richest feature area.

**Entry point**: `src/pages/Investments.tsx`

**Main components**:
- `src/components/MacroTab.tsx` (Macro sub-tab)
- `src/components/StoriesViewer.tsx` (Explore stories fullscreen)
- `src/components/AudioSummarySheet.tsx` (Explore audio briefing)
- `src/components/PortfolioAudioSummarySheet.tsx` (Portfolio audio briefing)
- `src/components/PortfolioSuggestionsSheet.tsx` (AI suggestions)
- `src/components/StockExplainerCard.tsx` (per-holding AI explanations)
- `src/components/PoolPortfoliosSection.tsx` (Pool Investments — always visible)
- `src/components/InvestmentRow.tsx` (Explore stock/ETF list rows)

**State shape** (`Investments.tsx`):

```typescript
topTab: "Explore" | "Portfolio" | "Macro"
tab: "Stocks" | "ETFs"
timeRange: "24h" | "1W" | "1M" | "1Y"
activeStoryIndex: number | null
activeStorySource: "market" | "portfolio"
showAudioSheet: boolean
showPortfolioAudioSheet: boolean
showSuggestions: boolean
aiEnabled: boolean   // persisted to localStorage["aiEnabled"]
```

**User flows**:
1. User lands on Explore → sees market stories, audio button, expert funds, popular stocks/ETFs.
2. User switches to Portfolio → sees AI toggle, portfolio value, chart, holdings explainer cards, audio briefing button, coins list, buy/sell, scenarios, suggestions, pool portfolios.
3. User switches to Macro → `MacroTab` handles its own state.

**AI Toggle behaviour**:
- `aiEnabled = true` (default): Shows StockExplainerCards, audio briefing button, scenarios button, suggestions button.
- `aiEnabled = false`: All AI-driven sections animate out. Pool Portfolios always remains visible.

---

### Feature: AI Toggle

**Purpose**: User-controlled switch to hide/show all AI-driven features on the Portfolio tab.

**Entry point**: `src/pages/Investments.tsx` (inline, lines ~211–243)

**State**:

```typescript
// Initialised from localStorage on mount
const [aiEnabled, setAiEnabled] = useState<boolean>(readAiEnabled);
```

**Persistence**:
- Key: `"aiEnabled"` in `localStorage`
- Default: `true`
- SSR-safe: wrapped in `try/catch`

**What it controls**:

| Section | Hidden when AI OFF |
|---|---|
| StockExplainerCard list ("Your holdings at a glance") | ✓ |
| Portfolio Briefing audio button | ✓ |
| Scenarios button | ✓ |
| Suggestions button | ✓ |
| `PortfolioAudioSummarySheet` overlay | ✓ (guarded at render) |
| `PortfolioSuggestionsSheet` overlay | ✓ (guarded at render) |
| Pool Portfolios section | ✗ (always visible) |

**No backend dependency.**

---

### Feature: Stock Explainer Cards

**Purpose**: Replace Instagram-style story circles. Per-holding expandable card showing AI analysis of why a stock moved.

**Entry point**: `src/components/StockExplainerCard.tsx`

**Props**:

```typescript
interface Props {
  holding: PortfolioHolding;
  aiEnabled: boolean;
}
```

**State**: `expanded: boolean`, `loading: boolean`, `explanation: { short: string; why: string; outlook: string } | null`

**Data flow**:
1. On expand, calls `POST /stock-explain` (4 s timeout).
2. On failure/timeout, falls back to `MOCK_EXPLANATIONS[ticker]` (inline static data).
3. Result cached in component state for the session.

**Mock data**: Inline `MOCK_EXPLANATIONS` record in `StockExplainerCard.tsx` — covers all 12 holdings.

**Mock % changes**: Inline `MOCK_CHANGES` record in `StockExplainerCard.tsx` — static per ticker.

---

### Feature: Audio Summary — Explore Tab

**Purpose**: AI-generated spoken market briefing based on selected market stories.

**Entry point**: `src/components/AudioSummarySheet.tsx`

**Props**:
```typescript
interface AudioSummarySheetProps {
  stories: MarketStory[];
  onClose: () => void;
}
```

**State**: `selectedStories: Set<string>`, `duration: "1"|"5"|"10"|"auto"`, `voiceStyle: "neutral"|"energetic"|"calm"`, `playState: "idle"|"generating"|"ready"|"playing"|"paused"`, `transcript: string`, `audioUrl: string | null`, `elapsed: number`, `audioDuration: number`, `generateError: string | null`

**User flow**:
1. User selects stories (checkbox list) + length + voice style.
2. Clicks "Generate & Play" → `POST /audio-script` → script text.
3. Script sent to `POST /audio-tts` → WAV audio blob URL.
4. Audio plays via hidden `<audio>` element.
5. If TTS fails → falls back silently to `window.speechSynthesis`.

**API calls**: See Section 4.

---

### Feature: Portfolio Audio Briefing

**Purpose**: AI-generated spoken briefing about the user's portfolio. Three fixed modes with different depth.

**Entry point**: `src/components/PortfolioAudioSummarySheet.tsx`

**Props**:
```typescript
interface Props {
  holdings: PortfolioHolding[];
  onClose: () => void;
}
```

**State**: `selectedMode: "2min"|"10min"|"30min"`, `playState`, `transcript`, `audioUrl`, `elapsed`, `audioDuration`, `error`

**Briefing modes**:

| Mode ID | UI Label | Backend `mode` value | Target tokens |
|---|---|---|---|
| `2min` | Portfolio Snapshot | `"2min"` | 350 |
| `10min` | Holdings Analysis | `"10min"` | 900 |
| `30min` | Macro Intelligence Report | `"30min"` | 2500 |

**User flow**:
1. User selects mode.
2. Clicks "Generate & Play" → `POST /portfolio-audio-script`.
3. Script → `POST /audio-tts` (voice always `"neutral"`).
4. Plays via `<audio>` or browser TTS fallback.

**API calls**: See Section 4.

---

### Feature: Pool Investments (Pool Portfolios)

**Purpose**: Social/copy-trading feature. Shows other users' shared portfolios, ranked by relevance + popularity. User can copy/follow, view details, and create their own.

**Entry point**: `src/components/PoolPortfoliosSection.tsx`

**Main components**:
- `src/components/PoolPortfolioCard.tsx`
- `src/components/PoolPortfolioDetailsModal.tsx`
- `src/components/CreatePoolPortfolioModal.tsx`
- `src/hooks/usePoolPortfolios.ts`
- `src/utils/portfolioSimilarity.ts`
- `src/types/poolPortfolio.ts`
- `src/mocks/poolPortfolios.ts`

**State** (`usePoolPortfolios`):
```typescript
pools: PoolPortfolio[]           // all pools (starts from MOCK_POOL_PORTFOLIOS)
copiedIds: Set<string>           // IDs the current user is copying
ranked: RankedPoolPortfolio[]    // sorted by finalScore (memoized)
```

**Ranking logic** (pure, no backend):
```typescript
finalScore = 0.75 * relevanceScore + 0.25 * normalised_log_popularity
// relevanceScore = 0.7 * weightedCosineSimilarity + 0.3 * jaccardSimilarity
// popularity = log(1 + copyCount), min-max normalised across displayed list
```

**Copy behaviour**:
- Toggles `copiedIds` Set.
- Increments/decrements `copyCount` on pool object in local state.
- Copied pools pinned at top in "Copied by you" sub-section.
- **Purely local state — no backend call.**

**Create behaviour**:
- Modal pre-fills 5 holdings from `portfolioHoldings` at equal weight.
- On submit: prepends new `PoolPortfolio` to `pools` state.
- **Purely local state — no backend call.**

**Current data source**: `src/mocks/poolPortfolios.ts` — 6 hardcoded pool portfolios. `MOCK` label applies.

---

### Feature: News Circles — Explore Tab

**Purpose**: Instagram-style horizontal story circles for market news. Tapping opens `StoriesViewer`.

**Entry point**: Inline in `src/pages/Investments.tsx` (Explore tab section)

**Data source**: `src/data/marketStories.ts` — 7 static `MarketStory` objects. **MOCK — no backend.**

**Component**: `src/components/StoriesViewer.tsx`

**User flow**: Tap circle → fullscreen overlay → auto-advances slides every 5 s → tap left/right to navigate → closes when last slide ends or user taps X.

---

### Feature: Suggestions

**Purpose**: AI-powered portfolio health analysis with ELI10 mode and risk profile selector.

**Entry point**: `src/components/PortfolioSuggestionsSheet.tsx`

**Props**: `{ onClose: () => void }`

**State**: `eli10: boolean`, `riskProfile: "Conservative" | "Balanced" | "Growth"`

**Data flow**: Calls `computeInsights(portfolioHoldings, riskProfile)` from `src/lib/portfolioInsights.ts` via `useMemo`. **Purely local computation — no backend.**

**Outputs**: Overall score, diversification score, region/sector exposure bars, concentration metrics (HHI index, top 1/3/5 weights), leverage risk, per-holding list.

---

### Feature: Simulate / Scenarios

**Purpose**: Portfolio simulation under custom macro factor changes or historical presets.

**Entry point**: `src/pages/Scenarios.tsx`

**State**:
```typescript
mode: "custom" | "historical"
values: Record<factorId, number>   // slider values per factor, default 0
activeHistorical: string | null    // selected preset id
```

**Custom factors** (6 sliders, range −100 to +100):
- `interest_rates`, `inflation`, `usd_strength`, `oil_price`, `tech_sentiment`, `crypto_sentiment`

**Simulation logic** (`src/lib/scenarios/historicalScenarios.ts` + inline `useMemo`):
```typescript
simulatedValue = baseValue * (1 + sum(delta_i * sensitivity_i) / 100)
```
Each `portfolioCoins` entry has sensitivity coefficients per factor. Historical presets override the formula directly.

**No backend calls — purely local computation.**

---

### Feature: Macro Tab

**Purpose**: Macro event feed with AI-generated causal chain analysis per event.

**Entry point**: `src/components/MacroTab.tsx`

**State**: `selectedEvent: string | null`, `simulateLive: boolean`, `eli10: boolean`, `openSteps: Set<number>`, `events: MacroEvent[]`, `chain: CausalChainResponse | null`, `loadingChain: boolean`, `chainError: string | null`

**User flow**:
1. On mount: calls `fetchMacroEvents()` → `GET /events`. Falls back to static `macroEvents` array.
2. User clicks "Trace impact" on an event → calls `fetchCausalChain(eventId)` → `GET /events/{id}/causal-chain`.
3. Chain renders as accordion steps with direction icons, confidence badges, Recharts price sparklines, mechanism text.
4. ELI10 toggle switches between normal and child-friendly explanations.
5. "Simulate live" toggle is UI-only (no functional behaviour currently).

**API calls**: See Section 4.

---

### Modal System

All modals/sheets use the same pattern:
- `AnimatePresence` + `motion.div` with `y: "100%"` entry (bottom-sheet style).
- Backdrop click closes.
- `z-[60]` to sit above the fixed `z-50` bottom nav.
- `maxHeight: "min(85vh, 680px)"` or similar to avoid nav overlap.

Modals in use:

| Component | Trigger |
|---|---|
| `StoriesViewer` | Story circle tap |
| `AudioSummarySheet` | Explore audio button |
| `PortfolioAudioSummarySheet` | Portfolio briefing button (AI ON only) |
| `PortfolioSuggestionsSheet` | Suggestions button (AI ON only) |
| `PoolPortfolioDetailsModal` | "View details" on pool card |
| `CreatePoolPortfolioModal` | "Create" button in pool section |

---

## 3. Component Inventory

### `src/pages/Investments.tsx`
- **Props**: none (route component)
- **Internal state**: `topTab`, `tab`, `timeRange`, `activeStoryIndex`, `activeStorySource`, `showAudioSheet`, `showPortfolioAudioSheet`, `showSuggestions`, `aiEnabled`
- **Side effects**: none (state initialised from localStorage synchronously)
- **External deps**: `portfolioHoldings`, `marketStories`, `portfolioStories`, `mockData`
- **Backend dependency**: indirect (children call backend)

### `src/pages/Scenarios.tsx`
- **Props**: none
- **Internal state**: `mode`, `values`, `activeHistorical`, `simulatedPortfolio` (memo)
- **Side effects**: none
- **Backend dependency**: none — fully local

### `src/components/StockExplainerCard.tsx`
- **Props**: `{ holding: PortfolioHolding, aiEnabled: boolean }`
- **Internal state**: `expanded`, `loading`, `explanation`
- **Side effects**: `fetch` on expand (one-time, cached in state)
- **Backend dependency**: `POST /stock-explain` (with mock fallback)

### `src/components/AudioSummarySheet.tsx`
- **Props**: `{ stories: MarketStory[], onClose: () => void }`
- **Internal state**: `selectedStories`, `duration`, `voiceStyle`, `playState`, `transcript`, `audioUrl`, `elapsed`, `audioDuration`, `generateError`
- **Side effects**: cleanup on unmount (pause audio, revoke blob URL, clear interval)
- **Backend dependency**: `POST /audio-script`, `POST /audio-tts`

### `src/components/PortfolioAudioSummarySheet.tsx`
- **Props**: `{ holdings: PortfolioHolding[], onClose: () => void }`
- **Internal state**: `selectedMode`, `playState`, `transcript`, `audioUrl`, `elapsed`, `audioDuration`, `error`
- **Side effects**: cleanup on unmount
- **Backend dependency**: `POST /portfolio-audio-script`, `POST /audio-tts`

### `src/components/PoolPortfoliosSection.tsx`
- **Props**: none
- **Internal state**: `detailsPool`, `showCreate`
- **Side effects**: none
- **Backend dependency**: none (uses `usePoolPortfolios` hook with mock data)

### `src/components/PoolPortfolioCard.tsx`
- **Props**: `{ pool: RankedPoolPortfolio, isCopied: boolean, onCopy: (id) => void, onViewDetails: (pool) => void }`
- **Internal state**: `activePeriod: ReturnPeriod`
- **Side effects**: none
- **Backend dependency**: none

### `src/components/PoolPortfolioDetailsModal.tsx`
- **Props**: `{ pool: RankedPoolPortfolio, isCopied: boolean, onCopy: (id) => void, onClose: () => void }`
- **Internal state**: `activePeriod: ReturnPeriod`
- **Side effects**: none
- **Backend dependency**: none

### `src/components/CreatePoolPortfolioModal.tsx`
- **Props**: `{ onClose: () => void, onCreate: (pool: Omit<PoolPortfolio, "id"|"copyCount"|"createdAt">) => void }`
- **Internal state**: `name`, `description`, `riskLabel`, `holdings`, `error`
- **Side effects**: none
- **Backend dependency**: none

### `src/components/MacroTab.tsx`
- **Props**: none
- **Internal state**: `selectedEvent`, `simulateLive`, `eli10`, `openSteps`, `events`, `chain`, `loadingChain`, `chainError`
- **Side effects**: `useEffect` on mount → `fetchMacroEvents()`; `useEffect` on `selectedEvent` → `fetchCausalChain()`
- **Backend dependency**: `GET /events`, `GET /events/{id}/causal-chain`

### `src/components/StoriesViewer.tsx`
- **Props**: `{ stories: MarketStory[], initialStoryIndex: number, onClose: () => void }`
- **Internal state**: `storyIndex`, `slideIndex`, `progress`
- **Side effects**: `requestAnimationFrame` loop for slide auto-advance
- **Backend dependency**: none

### `src/components/PortfolioSuggestionsSheet.tsx`
- **Props**: `{ onClose: () => void }`
- **Internal state**: `eli10`, `riskProfile`
- **Side effects**: none
- **Backend dependency**: none (local computation via `portfolioInsights.ts`)

### `src/components/BottomNav.tsx`
- **Props**: none
- **Internal state**: none (`useLocation()`)
- **Side effects**: none
- **Backend dependency**: none

### `src/components/InvestmentRow.tsx`
- **Props**: `{ name, ticker, price: string, change: number, color?: string, brand?: string }`
- **Internal state**: none
- **Side effects**: none
- **Backend dependency**: none

### `src/hooks/usePoolPortfolios.ts`
- **Returns**: `{ ranked, userHoldings, isCopied, copyPortfolio, createPool, userId }`
- **Internal state**: `pools: PoolPortfolio[]`, `copiedIds: Set<string>`
- **Side effects**: none
- **Backend dependency**: none (mock data source)

---

## 4. Data Contracts (Critical Section)

> ⚠️ `MOCK` = currently using static/local data. Backend implementation required for production.

---

### 4.1 `POST /audio-script`

**Used by**: `AudioSummarySheet.tsx`

**Request**:
```typescript
{
  method: "POST",
  endpoint: "http://localhost:8000/audio-script",
  body: {
    stories: Array<{
      id: string;
      label: string;
      slides: Array<{
        headline: string;
        body: string;
        source: string;
      }>;
    }>;
    duration: "1" | "5" | "10" | "auto";
    user_id: string;   // currently always "mock_user_1"
  }
}
```

**Expected Response**:
```typescript
{
  script: string;   // plain spoken text, no markdown
}
```

**Status**: ✅ Implemented in backend.

---

### 4.2 `POST /audio-tts`

**Used by**: `AudioSummarySheet.tsx`, `PortfolioAudioSummarySheet.tsx`

**Request**:
```typescript
{
  method: "POST",
  endpoint: "http://localhost:8000/audio-tts",
  body: {
    script: string;
    voice_style: "neutral" | "energetic" | "calm";
    user_id: string;
  }
}
```

**Expected Response**: Binary WAV audio stream (`Content-Type: audio/wav`)

**Fallback**: If response is not `ok`, frontend silently falls back to `window.speechSynthesis`.

**Status**: ✅ Implemented in backend (Groq PlayAI TTS, `playai-tts` model).

---

### 4.3 `POST /portfolio-audio-script`

**Used by**: `PortfolioAudioSummarySheet.tsx`

**Request**:
```typescript
{
  method: "POST",
  endpoint: "http://localhost:8000/portfolio-audio-script",
  body: {
    holdings: Array<{
      ticker: string;
      name: string;
      valueEUR: number;
      region: string;
      sector: string;
      assetType: "crypto" | "stock" | "etf" | "bond" | "commodity";
      leverageFactor?: number;
    }>;
    mode: "2min" | "10min" | "30min";
    user_id: string;
  }
}
```

**Expected Response**:
```typescript
{
  script: string;   // spoken text, length varies by mode
}
```

**Mode semantics**:
- `"2min"` → Portfolio values + performance only (~350 tokens)
- `"10min"` → Values + reasons each holding moved (~900 tokens)
- `"30min"` → Full macro context connected to user's specific holdings (~2500 tokens)

**Status**: ✅ Implemented in backend.

---

### 4.4 `POST /stock-explain`

**Used by**: `StockExplainerCard.tsx`

**Request**:
```typescript
{
  method: "POST",
  endpoint: "http://localhost:8000/stock-explain",
  body: {
    ticker: string;
    name: string;
    change_pct: number;   // e.g. 23.5 for +23.5%
  }
}
```

**Expected Response**:
```typescript
{
  short: string;     // one-line headline, ≤10 words
  why: string;       // 2–3 sentences with specific data
  outlook: string;   // 1–2 sentences on near-term outlook
}
```

**Fallback**: On error or timeout (4 s), frontend uses inline `MOCK_EXPLANATIONS` — covers all 12 portfolio tickers.

**Status**: ✅ Implemented in backend.

---

### 4.5 `GET /events`

**Used by**: `MacroTab.tsx`

**Request**:
```typescript
{
  method: "GET",
  endpoint: "http://localhost:8000/events"
}
```

**Expected Response**:
```typescript
Array<{
  id: string;
  title: string;
  source: string;
  date: string;         // "YYYY-MM-DD"
  category: string;     // "tech" | "macro" | "regulatory" | "geo" | "earnings"
  emoji: string;
}>
```

**Fallback**: Falls back to static `macroEvents` array in `MacroTab.tsx` if request fails.

**Status**: ✅ Implemented in backend.

---

### 4.6 `GET /events/{event_id}/causal-chain`

**Used by**: `MacroTab.tsx`

**Request**:
```typescript
{
  method: "GET",
  endpoint: "http://localhost:8000/events/{event_id}/causal-chain",
  queryParams: { user_id?: string }
}
```

**Expected Response**:
```typescript
{
  trigger_event: string;
  trigger_date: string;
  chain: Array<{
    step: number;
    direction: "up" | "down" | "neutral";
    title: string;
    mechanism: string;
    confidence: "high" | "medium" | "low";
    asset?: string;
    price_before?: number;
    price_after?: number;
    price_unit?: string;
  }>;
  summary: string;
  summary_eli10: string;
  summary_bullets: string[];
  summary_bullets_eli10: string[];
  user_connection: string;
  user_connection_eli10: string;
  user_relevance_score: number;   // 0–1
  disclaimer: string;
}
```

**Status**: ✅ Implemented in backend.

---

### 4.7 Pool Portfolios — MOCK

**Used by**: `usePoolPortfolios.ts`, `PoolPortfoliosSection.tsx`

**Status**: 🟡 `MOCK` — data is sourced entirely from `src/mocks/poolPortfolios.ts`. Copy/create actions update local React state only.

**Mock file**: `src/mocks/poolPortfolios.ts`

**When backend is ready**, the hook `src/hooks/usePoolPortfolios.ts` must be updated to:

```typescript
// Replace:
const [pools, setPools] = useState<PoolPortfolio[]>(MOCK_POOL_PORTFOLIOS);

// With:
const { data: pools } = useQuery({ queryKey: ["pools"], queryFn: fetchPools });
```

**Expected future API contract**:
```typescript
// GET /pool-portfolios
Response: PoolPortfolio[]

// POST /pool-portfolios
Body: Omit<PoolPortfolio, "id" | "copyCount" | "createdAt">
Response: PoolPortfolio

// POST /pool-portfolios/{id}/copy
Body: { user_id: string }
Response: { copyCount: number }

// DELETE /pool-portfolios/{id}/copy
Body: { user_id: string }
Response: { copyCount: number }
```

---

### 4.8 Portfolio Holdings — MOCK

**Status**: 🟡 `MOCK` — `src/data/portfolioHoldings.ts` is a static file.

**When backend is ready**, replace with:
```typescript
// GET /portfolio/{user_id}/holdings
Response: PortfolioHolding[]
```

---

### 4.9 Market Stories — MOCK

**Status**: 🟡 `MOCK` — `src/data/marketStories.ts` is static.

**When backend is ready**, stories should come from:
```typescript
// GET /stories/market
Response: MarketStory[]
```

---

### 4.10 Portfolio Stories — MOCK (Deprecated UI)

**Status**: 🟡 `MOCK` — `src/data/portfolioStories.ts` exists but is no longer rendered in the Portfolio tab (replaced by `StockExplainerCard`). Still passed to `StoriesViewer` when `activeStorySource === "portfolio"` but this flow is no longer triggered by the current Portfolio tab UI.

---

### 4.11 `GET /feed`

**Status**: ✅ Implemented in backend. **Not yet consumed by frontend** — feed data is not displayed in the current React UI. Listed here for integration planning.

---

### 4.12 `GET /tip`, `GET /spend-map`, `GET /fund-tracker`, `GET /eli10/{concept}`, `GET /insight/{id}`

**Status**: ✅ Implemented in backend. **Not yet consumed by frontend.**

---

## 5. Global State & Persistence

### localStorage

| Key | Type | Default | Used by |
|---|---|---|---|
| `"aiEnabled"` | `"true"` \| `"false"` | `"true"` | `Investments.tsx` AI toggle |

### React Query

`QueryClient` is instantiated in `App.tsx` and provided via `QueryClientProvider`. It is **not yet used** for any data fetching — all fetches are raw `fetch()` calls.

### No other global state

No Context API, no Zustand, no Redux.

### Environment variables

| Variable | Used | Where |
|---|---|---|
| None defined in frontend | — | — |

The backend base URL is **hardcoded** as `"http://localhost:8000"` in:
- `src/components/AudioSummarySheet.tsx` (line 12)
- `src/components/PortfolioAudioSummarySheet.tsx` (line 6)
- `src/components/StockExplainerCard.tsx` (line 3)
- `src/components/MacroTab.tsx` (inline in fetch calls)

> ⚠️ **This must be moved to an environment variable before production.**

---

## 6. Environment & Config

### Vite Config (`vite.config.ts`)

```typescript
server: {
  host: "::",
  port: 8080
}
resolve: {
  alias: { "@": "./src" }
}
test: {
  globals: true,
  environment: "jsdom"
}
```

### Assumptions

- Frontend runs on **port 8080**.
- Backend runs on **port 8000** (hardcoded `http://localhost:8000`).
- CORS must be open on the backend for `localhost:8080` (currently `allow_origins: ["*"]` in backend).
- No authentication headers are sent — all requests are unauthenticated.
- `user_id` is always `"mock_user_1"` — hardcoded in every API call.

### Build

```bash
npm run dev      # development (port 8080)
npm run build    # production build
npm run test     # run vitest once
```

---

## 7. Known Limitations & TODOs

| # | Area | Issue | Priority |
|---|---|---|---|
| 1 | API base URL | `http://localhost:8000` hardcoded in 4 files | High |
| 2 | Auth | `user_id: "mock_user_1"` hardcoded everywhere | High |
| 3 | Pool Portfolios | Entirely local state — no backend persistence | High |
| 4 | Portfolio Holdings | Static file — not fetched from backend | High |
| 5 | Market Stories | Static file — not connected to real news | Medium |
| 6 | Portfolio Stories | Deprecated — not rendered anymore but file still exists | Low |
| 7 | Stock % changes | `MOCK_CHANGES` hardcoded in `StockExplainerCard.tsx` | High |
| 8 | `GET /feed` | Backend implemented but frontend does not consume it | Medium |
| 9 | `@tanstack/react-query` | Installed but not used for any actual data fetching | Medium |
| 10 | Simulate Live toggle | MacroTab has a "Simulate live" toggle — UI only, no logic | Low |
| 11 | Portfolio chart | Static SVG polyline — not connected to real price data | High |
| 12 | Portfolio value `€926.26` | Hardcoded — not summed from holdings | High |
| 13 | Coin prices in Portfolio tab | Hardcoded in `mockData.ts#portfolioCoins` | High |
| 14 | Audio mode 30min | Groq has 2500 token limit on `llama-3.3-70b-versatile`; 30 min script is aspirational | Medium |

---

## 8. Integration Guide

### APIs That Must Exist

The following endpoints are **actively called by the frontend** and must be implemented:

| Endpoint | Method | Status | Called from |
|---|---|---|---|
| `/audio-script` | POST | ✅ Done | `AudioSummarySheet` |
| `/audio-tts` | POST | ✅ Done | `AudioSummarySheet`, `PortfolioAudioSummarySheet` |
| `/portfolio-audio-script` | POST | ✅ Done | `PortfolioAudioSummarySheet` |
| `/stock-explain` | POST | ✅ Done | `StockExplainerCard` |
| `/events` | GET | ✅ Done | `MacroTab` |
| `/events/{id}/causal-chain` | GET | ✅ Done | `MacroTab` |

The following endpoints are **needed for full feature completion** (currently mocked):

| Endpoint | Method | Status | Needed for |
|---|---|---|---|
| `/portfolio/{user_id}/holdings` | GET | ❌ Not wired | Real portfolio data |
| `/pool-portfolios` | GET | ❌ Not wired | Pool Investments feed |
| `/pool-portfolios` | POST | ❌ Not wired | Create pool portfolio |
| `/pool-portfolios/{id}/copy` | POST | ❌ Not wired | Copy action persistence |
| `/pool-portfolios/{id}/copy` | DELETE | ❌ Not wired | Un-copy action |
| `/prices/{ticker}` | GET | ❌ Not wired | Real % changes in StockExplainerCard |

### Authentication

- Currently **none**. All endpoints receive `user_id: "mock_user_1"` in the body.
- No `Authorization` header is sent.
- Backend must not require auth tokens until frontend auth is implemented.

### Expected Error Handling Format

Frontend currently checks `res.ok` only. If `false`, it either:
- Shows an error string to the user (`generateError` state), or
- Falls back to mock/local data silently.

No structured error envelope is parsed. Backend can return any `4xx/5xx` with a plain string or `{ detail: string }` (FastAPI default).

### Expected Loading State Behaviour

| Component | Loading indicator |
|---|---|
| `AudioSummarySheet` | Button text changes to "Generating audio…" + spinner icon |
| `PortfolioAudioSummarySheet` | Button text changes to "Generating briefing…" + spinner icon |
| `StockExplainerCard` | "Analysing with AI…" text + spinner inside expanded section |
| `MacroTab` | Inline "Loading chain…" text (component-managed) |

No global loading overlay. Each component handles its own loading state independently.

### CORS Requirements

Backend must allow:
```
Origin: http://localhost:8080
Methods: GET, POST, OPTIONS
Headers: Content-Type
```

Currently backend uses `allow_origins: ["*"]` — acceptable for development.
