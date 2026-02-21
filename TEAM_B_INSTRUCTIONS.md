# Team B Instructions — UI Layer
**Read this before writing a single line of code**

Team A is building the entire brain. Your job is to make it beautiful and intuitive. Here is everything you need.

---

## Your Job

Consume the Team A API and render:
1. A personalized financial news feed (visual-first)
2. Article detail with AI summary + chart
3. ELI10 explainer modal
4. Trending topics bar
5. Spend-to-investment map screen
6. Daily tip card

You do NOT need to handle any AI logic, data fetching from news sources, or spending analysis. All of that comes pre-cooked from Team A's API.

---

## Base URL

Development: `http://localhost:8000`  
Live demo: Team A will provide a ngrok URL when ready (expect it by Hour 10)

---

## Key Endpoints You'll Use

| Screen | Endpoint | Priority |
|--------|----------|---------|
| Home Feed | `GET /feed?user_id=mock_user_1` | P0 |
| Article Detail | `GET /insight/{article_id}` | P0 |
| ELI10 Modal | `GET /eli10/{concept}` | P0 |
| Trending Bar | `GET /trends` | P1 |
| Spend Map | `GET /spend-map?user_id=mock_user_1` | P1 |
| Fund Tracker | `GET /fund-tracker` | P2 |
| Daily Tip | Included in `/feed` response | P0 |

Full response shapes: see `API_CONTRACTS.md`

---

## Visualization Components to Build

Every article has a `visualization` block with a `type` field. You need one component per type:

```jsx
// Route visualization blocks to the right component
function VisualizationRenderer({ viz }) {
  switch (viz.type) {
    case "line_chart":       return <LineChartCard data={viz} />
    case "comparison_bar":   return <ComparisonBarCard data={viz} />
    case "sparkline":        return <SparklineCard data={viz} />
    case "donut_with_arrow": return <SpendDonutCard data={viz} />
    case "horizontal_bar":   return <HorizontalBarCard data={viz} />
    case "simple_number":    return <StatCard data={viz} />
    default:                 return null
  }
}
```

Use **Recharts** for all charts. It's pre-approved and works well with the data shapes Team A provides.

---

## N26 Color Palette

```css
--n26-teal: #00D4A8;        /* primary, CTAs */
--n26-dark: #1A1A2E;        /* backgrounds, text */
--n26-white: #FFFFFF;
--n26-gray-light: #F5F5F5;
--n26-amber: #F59E0B;       /* warnings, alerts */
--n26-bitcoin: #F7931A;     /* crypto */
--n26-positive: #4CAF50;    /* gains */
--n26-negative: #EF4444;    /* losses */
```

---

## Key Design Principle

> Every number should have a chart. Every article should have a visual. No walls of text.

If a user taps a news card, they should be hit with a visualization FIRST, then a 2-sentence summary. Think Instagram for finance.

---

## Mock User IDs for Testing

While Team A API is being built, use these to test your UI:
- `mock_user_1` — travel-heavy spender
- `mock_user_2` — investor profile (has Trade Republic transactions)
- `mock_user_3` — young saver, low amounts

---

## What to Do While Waiting for Team A API

1. Build static mockups from the JSON shapes in `API_CONTRACTS.md`
2. Hard-code one article's response and build the full card
3. Set up your chart components with dummy data
4. Build the feed list skeleton/loading state

Team A will send you a real URL by Hour 10 at the latest.

---

## Communication Protocol

- Any contract change: TELL TEAM A IMMEDIATELY. They will update `API_CONTRACTS.md`.
- If an endpoint returns a shape you didn't expect: screenshot + Slack Team A.
- Don't change the `/feed` response format on your own — it breaks other components.

---

## Judging Criteria Reminder

- **Proof of Concept (40%)**: Does the demo work live? Team A's responsibility mostly.
- **User Experience (30%)**: YOUR responsibility. Make it beautiful and intuitive.
- **AI Innovation (20%)**: The spend→insight connection. Show it clearly in the UI.
- **N26 Fit (10%)**: Look like it belongs in the N26 app. Use the color palette.

Your biggest contribution to winning: make the spend-to-investment map screen stunning. That's the feature judges haven't seen before.
