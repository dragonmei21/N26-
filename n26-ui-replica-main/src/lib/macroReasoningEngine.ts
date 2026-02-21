import { transactions } from "@/data/mockData";

const API_BASE = "http://localhost:8000";

// ── Types ──────────────────────────────────────────────

export interface CausalStep {
  step_number: number;
  event: string;
  mechanism: string;
  affected_entity: string;
  entity_type: "company" | "sector" | "commodity" | "currency" | "index";
  ticker: string | null;
  direction: "up" | "down" | "neutral";
  confidence: "high" | "medium" | "low";
  plain_english: string;
  plain_english_eli10: string;
}

export interface PriceData {
  type: "timeline_with_event";
  title: string;
  event_label: string;
  data: {
    labels: string[];
    values: number[];
    event_index: number;
  };
}

export interface PricedCausalStep extends CausalStep {
  price_data: PriceData | null;
  price_change_pct: number | null;
  event_date: string;
}

export interface CausalChainResponse {
  trigger_event: string;
  trigger_date: string;
  trigger_source_url: string;
  chain: PricedCausalStep[];
  user_connection: string;
  user_connection_eli10: string;
  user_relevance_score: number;
  summary: string;
  summary_eli10: string;
  disclaimer: string;
  summary_bullets: string[];
  summary_bullets_eli10: string[];
}

export type EventCategory = "tech" | "macro" | "geo" | "regulatory" | "earnings";

export interface MacroEvent {
  id: string;
  title: string;
  source: string;
  date: string;
  category: EventCategory;
  emoji: string;
}

// ── Live Events (fetched from backend, fallback to mock) ────────────────────

export const macroEvents: MacroEvent[] = [
  { id: "gpt5", title: "OpenAI releases ChatGPT-5", source: "TechCrunch", date: "2026-02-20", category: "tech", emoji: "🤖" },
  { id: "fed-cut", title: "Fed cuts rates by 50bp", source: "Reuters", date: "2026-02-18", category: "macro", emoji: "🏛️" },
  { id: "eu-ai-act", title: "EU AI Act enforcement begins", source: "Financial Times", date: "2026-02-15", category: "regulatory", emoji: "⚖️" },
  { id: "china-taiwan", title: "China increases military drills near Taiwan", source: "Bloomberg", date: "2026-02-17", category: "geo", emoji: "🌏" },
  { id: "nvda-earnings", title: "NVIDIA Q4 earnings smash estimates", source: "CNBC", date: "2026-02-19", category: "earnings", emoji: "💚" },
];

export async function fetchMacroEvents(): Promise<MacroEvent[]> {
  try {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error("API error");
    return res.json();
  } catch {
    return macroEvents;
  }
}

export async function fetchCausalChain(eventId: string): Promise<CausalChainResponse> {
  const res = await fetch(`${API_BASE}/events/${eventId}/causal-chain`);
  if (!res.ok) throw new Error(`Failed to fetch causal chain for ${eventId}`);
  return res.json();
}

// ── Price Generator ────────────────────────────────────

function generateMockPrices(
  basePriceBefore: number,
  eventImpactPct: number,
  eventIndex: number,
  days: number = 30
): { labels: string[]; values: number[]; event_index: number } {
  const labels: string[] = [];
  const values: number[] = [];
  const startDate = new Date("2026-01-22");

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`);

    let noise = (Math.random() - 0.5) * basePriceBefore * 0.015;
    let trend = 0;
    if (i > eventIndex) {
      const daysSinceEvent = i - eventIndex;
      trend = basePriceBefore * (eventImpactPct / 100) * (1 - Math.exp(-daysSinceEvent * 0.3));
    }
    values.push(+(basePriceBefore + trend + noise).toFixed(2));
  }

  return { labels, values, event_index: eventIndex };
}

// ── Causal Chain Definitions ───────────────────────────

const chainDefinitions: Record<string, Omit<CausalChainResponse, "disclaimer">> = {
  gpt5: {
    trigger_event: "OpenAI releases ChatGPT-5",
    trigger_date: "2026-02-20",
    trigger_source_url: "https://techcrunch.com",
    summary: "OpenAI's GPT-5 launch signals a new wave of AI capability, driving demand for AI chips and cloud infrastructure while intensifying competitive pressure across the tech sector.",
    summary_eli10: "A super-smart new AI just came out, and now lots of companies need more powerful computer chips to use it.",
    summary_bullets: [
      "GPT-5 demonstrates significant reasoning and multimodal improvements over GPT-4",
      "Enterprise adoption is expected to accelerate, increasing cloud compute demand",
      "Competitive dynamics shift as Google, Meta, and Anthropic respond",
    ],
    summary_bullets_eli10: [
      "The new AI is much smarter than the old one",
      "Big companies will want to use it, needing more computers",
      "Other AI companies will try to catch up",
    ],
    chain: [
      {
        step_number: 1,
        event: "AI chip demand surges",
        mechanism: "GPT-5 requires 3× more compute for inference; enterprises rush to deploy",
        affected_entity: "NVIDIA",
        entity_type: "company",
        ticker: "NVDA",
        direction: "up",
        confidence: "high",
        plain_english: "NVIDIA supplies the GPUs that power AI models. More powerful AI means more chip sales.",
        plain_english_eli10: "NVIDIA makes the special chips that AI needs. Smarter AI = more chips needed.",
        price_data: {
          type: "timeline_with_event",
          title: "NVDA 30-day price",
          event_label: "ChatGPT-5 launch",
          data: generateMockPrices(160, 8.5, 20),
        },
        price_change_pct: 8.5,
        event_date: "2026-02-20",
      },
      {
        step_number: 2,
        event: "Cloud infrastructure spending accelerates",
        mechanism: "AWS, Azure, and GCP increase GPU orders to meet enterprise AI demand",
        affected_entity: "Amazon",
        entity_type: "company",
        ticker: "AMZN",
        direction: "up",
        confidence: "high",
        plain_english: "Amazon's AWS cloud division benefits from enterprises needing more compute for AI workloads.",
        plain_english_eli10: "Amazon has a cloud computer service. More AI means more people renting their computers.",
        price_data: {
          type: "timeline_with_event",
          title: "AMZN 30-day price",
          event_label: "ChatGPT-5 launch",
          data: generateMockPrices(178, 4.2, 20),
        },
        price_change_pct: 4.2,
        event_date: "2026-02-20",
      },
      {
        step_number: 3,
        event: "AI semiconductor sector broadly lifts",
        mechanism: "Positive sentiment spills over to the broader semiconductor index",
        affected_entity: "Semiconductor Index",
        entity_type: "index",
        ticker: "SOXX",
        direction: "up",
        confidence: "medium",
        plain_english: "The whole chip-making industry tends to rise when AI demand spikes, though individual stocks vary.",
        plain_english_eli10: "When one chip company does well, other chip companies usually go up too.",
        price_data: {
          type: "timeline_with_event",
          title: "SOXX 30-day price",
          event_label: "ChatGPT-5 launch",
          data: generateMockPrices(250, 3.1, 20),
        },
        price_change_pct: 3.1,
        event_date: "2026-02-20",
      },
    ],
    user_connection: "You spent €67.89 on Amazon last month. Amazon is a major buyer of NVIDIA chips to power its AWS cloud AI services. As AI demand grows, Amazon's cloud revenue may increase, potentially benefiting its stock price.",
    user_connection_eli10: "You buy stuff from Amazon! Amazon uses NVIDIA's special chips to run AI. If more people use AI, Amazon makes more money from their computer services.",
    user_relevance_score: 0.82,
  },
  "fed-cut": {
    trigger_event: "Fed cuts rates by 50bp",
    trigger_date: "2026-02-18",
    trigger_source_url: "https://reuters.com",
    summary: "A surprise 50bp rate cut signals economic concern but boosts equity valuations and weakens the dollar, lifting gold and growth stocks.",
    summary_eli10: "The bank that controls money made it cheaper to borrow, which usually makes stocks go up.",
    summary_bullets: [
      "Federal Reserve cuts the benchmark rate by 0.50%, more than the expected 0.25%",
      "Growth stocks benefit as future earnings become more valuable at lower rates",
      "Dollar weakens, making gold and commodities more attractive",
    ],
    summary_bullets_eli10: [
      "The US money boss cut the price of borrowing money — a lot",
      "This makes company stocks more valuable",
      "Gold gets more popular when the dollar gets weaker",
    ],
    chain: [
      {
        step_number: 1,
        event: "Growth stocks rally on lower discount rates",
        mechanism: "Lower rates increase present value of future earnings for high-growth companies",
        affected_entity: "Technology Sector",
        entity_type: "sector",
        ticker: "QQQ",
        direction: "up",
        confidence: "high",
        plain_english: "Tech companies benefit the most from rate cuts because their value depends on future profits.",
        plain_english_eli10: "Tech companies are worth more when borrowing money is cheap.",
        price_data: { type: "timeline_with_event", title: "QQQ 30-day price", event_label: "Fed 50bp cut", data: generateMockPrices(480, 5.2, 18) },
        price_change_pct: 5.2,
        event_date: "2026-02-18",
      },
      {
        step_number: 2,
        event: "US Dollar weakens",
        mechanism: "Lower rates reduce foreign demand for dollar-denominated assets",
        affected_entity: "US Dollar Index",
        entity_type: "currency",
        ticker: "DXY",
        direction: "down",
        confidence: "high",
        plain_english: "When rates drop, the dollar becomes less attractive to foreign investors, weakening the currency.",
        plain_english_eli10: "The dollar gets weaker because people don't earn as much holding it.",
        price_data: { type: "timeline_with_event", title: "DXY 30-day", event_label: "Fed 50bp cut", data: generateMockPrices(103, -2.1, 18) },
        price_change_pct: -2.1,
        event_date: "2026-02-18",
      },
      {
        step_number: 3,
        event: "Gold rallies on weaker dollar",
        mechanism: "Gold, priced in dollars, becomes cheaper for foreign buyers; also benefits from lower opportunity cost",
        affected_entity: "Gold",
        entity_type: "commodity",
        ticker: "GLD",
        direction: "up",
        confidence: "medium",
        plain_english: "Gold tends to rise when the dollar falls and rates drop, as holding gold has less competition from bonds.",
        plain_english_eli10: "Gold goes up because it's cheaper for people in other countries to buy, and saving in a bank pays less.",
        price_data: { type: "timeline_with_event", title: "GLD 30-day price", event_label: "Fed 50bp cut", data: generateMockPrices(295, 3.8, 18) },
        price_change_pct: 3.8,
        event_date: "2026-02-18",
      },
    ],
    user_connection: "You have €83.70 in iShares Physical Gold ETC. A weaker dollar and lower rates historically benefit gold prices, which could positively impact your gold position.",
    user_connection_eli10: "You own some gold! When rates go down, gold usually goes up, so your gold might become worth more.",
    user_relevance_score: 0.71,
  },
  "eu-ai-act": {
    trigger_event: "EU AI Act enforcement begins",
    trigger_date: "2026-02-15",
    trigger_source_url: "https://ft.com",
    summary: "The EU begins enforcing its AI Act, creating compliance costs for US tech giants and boosting European AI governance companies.",
    summary_eli10: "Europe made new rules about AI. Big tech companies have to spend money to follow these rules.",
    summary_bullets: [
      "EU AI Act mandates transparency, auditing, and risk classification for AI systems",
      "US tech giants face significant compliance overheads in European markets",
      "European SaaS companies offering compliance tooling see tailwinds",
    ],
    summary_bullets_eli10: [
      "Europe says AI companies must explain how their AI works",
      "Big American tech companies need to spend extra money on this",
      "European software companies that help with rules get more customers",
    ],
    chain: [
      {
        step_number: 1,
        event: "US Big Tech compliance costs rise",
        mechanism: "Meta, Google, and Microsoft must allocate resources for EU AI compliance across their product lines",
        affected_entity: "Microsoft",
        entity_type: "company",
        ticker: "MSFT",
        direction: "down",
        confidence: "medium",
        plain_english: "Microsoft's AI products (Copilot, Azure AI) face new compliance burdens in Europe, adding costs.",
        plain_english_eli10: "Microsoft has to spend extra money to make its AI follow Europe's new rules.",
        price_data: { type: "timeline_with_event", title: "MSFT 30-day price", event_label: "EU AI Act enforced", data: generateMockPrices(337, -1.8, 15) },
        price_change_pct: -1.8,
        event_date: "2026-02-15",
      },
      {
        step_number: 2,
        event: "European AI governance companies benefit",
        mechanism: "Demand for compliance tooling and AI auditing platforms rises sharply",
        affected_entity: "SAP SE",
        entity_type: "company",
        ticker: "SAP",
        direction: "up",
        confidence: "low",
        plain_english: "SAP could benefit as enterprises seek integrated compliance solutions, though the direct link is speculative.",
        plain_english_eli10: "SAP might get more customers who need help following the new rules, but it's not certain.",
        price_data: { type: "timeline_with_event", title: "SAP 30-day price", event_label: "EU AI Act enforced", data: generateMockPrices(240, 1.2, 15) },
        price_change_pct: 1.2,
        event_date: "2026-02-15",
      },
    ],
    user_connection: "You hold €336.95 in Microsoft and €95.00 in SAP. The EU AI Act could pressure Microsoft's margins while modestly benefiting SAP, a mixed impact on your portfolio.",
    user_connection_eli10: "You own Microsoft and SAP! Microsoft might lose a bit because of the new rules, but SAP might gain. It kind of balances out.",
    user_relevance_score: 0.65,
  },
  "china-taiwan": {
    trigger_event: "China increases military drills near Taiwan",
    trigger_date: "2026-02-17",
    trigger_source_url: "https://bloomberg.com",
    summary: "Escalating tensions in the Taiwan Strait raise risks for the global semiconductor supply chain and drive safe-haven flows into gold.",
    summary_eli10: "China is doing military exercises near Taiwan, which makes chips harder to get and people buy gold because they're worried.",
    summary_bullets: [
      "China conducts large-scale military exercises in the Taiwan Strait",
      "Taiwan produces over 60% of the world's advanced semiconductors via TSMC",
      "Markets price in supply chain disruption risk; safe havens rally",
    ],
    summary_bullets_eli10: [
      "China's army is practicing near Taiwan, making people nervous",
      "Taiwan makes most of the world's best computer chips",
      "Investors get scared and buy gold to be safe",
    ],
    chain: [
      {
        step_number: 1,
        event: "TSMC supply risk spikes",
        mechanism: "Taiwan Semiconductor is the sole advanced fab for Apple, NVIDIA, and AMD; disruption threat reprices risk",
        affected_entity: "TSMC",
        entity_type: "company",
        ticker: "TSM",
        direction: "down",
        confidence: "high",
        plain_english: "TSMC manufactures chips for almost every major tech company. Geopolitical tension raises the risk of supply disruption.",
        plain_english_eli10: "TSMC makes chips for everyone. If something bad happens in Taiwan, nobody gets their chips.",
        price_data: { type: "timeline_with_event", title: "TSM 30-day price", event_label: "Taiwan Strait drills", data: generateMockPrices(175, -6.3, 17) },
        price_change_pct: -6.3,
        event_date: "2026-02-17",
      },
      {
        step_number: 2,
        event: "Safe-haven flows boost gold",
        mechanism: "Geopolitical uncertainty drives capital into gold as a store of value",
        affected_entity: "Gold",
        entity_type: "commodity",
        ticker: "GLD",
        direction: "up",
        confidence: "high",
        plain_english: "When geopolitical risks rise, investors flock to gold as a safe haven, pushing prices higher.",
        plain_english_eli10: "When people are scared, they buy gold because it's been valuable for thousands of years.",
        price_data: { type: "timeline_with_event", title: "GLD 30-day price", event_label: "Taiwan Strait drills", data: generateMockPrices(295, 4.5, 17) },
        price_change_pct: 4.5,
        event_date: "2026-02-17",
      },
      {
        step_number: 3,
        event: "Apple faces potential component shortage",
        mechanism: "Apple relies heavily on TSMC for iPhone, Mac, and Vision Pro chips",
        affected_entity: "Apple",
        entity_type: "company",
        ticker: "AAPL",
        direction: "down",
        confidence: "medium",
        plain_english: "Apple depends on TSMC for all its custom chips. Supply chain fears could pressure its stock.",
        plain_english_eli10: "Apple needs TSMC to make its iPhone chips. If TSMC has trouble, Apple might too.",
        price_data: { type: "timeline_with_event", title: "AAPL 30-day price", event_label: "Taiwan Strait drills", data: generateMockPrices(224, -3.1, 17) },
        price_change_pct: -3.1,
        event_date: "2026-02-17",
      },
    ],
    user_connection: "You hold €224.00 in Apple and €83.70 in iShares Physical Gold. Rising Taiwan tensions could hurt Apple but boost your gold position.",
    user_connection_eli10: "You own Apple and Gold! If things get tense near Taiwan, Apple might drop but your gold could go up.",
    user_relevance_score: 0.78,
  },
  "nvda-earnings": {
    trigger_event: "NVIDIA Q4 earnings smash estimates",
    trigger_date: "2026-02-19",
    trigger_source_url: "https://cnbc.com",
    summary: "NVIDIA posted record Q4 results driven by data-center GPU demand, lifting the entire AI ecosystem and signaling sustained AI infrastructure spending.",
    summary_eli10: "NVIDIA made way more money than expected selling AI chips, which is good news for all AI companies.",
    summary_bullets: [
      "Revenue grew 78% YoY to $39.3B, beating consensus by $3.1B",
      "Data center revenue alone hit $32.6B, up 93% YoY",
      "Forward guidance raised, signaling strong Blackwell GPU demand through 2026",
    ],
    summary_bullets_eli10: [
      "NVIDIA sold a LOT more chips than people expected",
      "Most of the money came from selling chips to big data centers",
      "They said next quarter will be even bigger",
    ],
    chain: [
      {
        step_number: 1,
        event: "NVIDIA stock jumps on earnings beat",
        mechanism: "Revenue and guidance exceeded Wall Street expectations significantly",
        affected_entity: "NVIDIA",
        entity_type: "company",
        ticker: "NVDA",
        direction: "up",
        confidence: "high",
        plain_english: "Stocks typically surge when earnings significantly beat expectations, especially with raised guidance.",
        plain_english_eli10: "NVIDIA's stock went up because they made way more money than everyone thought they would.",
        price_data: { type: "timeline_with_event", title: "NVDA 30-day price", event_label: "Q4 earnings release", data: generateMockPrices(160, 12.3, 19) },
        price_change_pct: 12.3,
        event_date: "2026-02-19",
      },
      {
        step_number: 2,
        event: "AI infrastructure spending validated",
        mechanism: "NVIDIA's results confirm hyperscalers are spending heavily on AI, benefiting the broader ecosystem",
        affected_entity: "Microsoft",
        entity_type: "company",
        ticker: "MSFT",
        direction: "up",
        confidence: "medium",
        plain_english: "Microsoft is NVIDIA's biggest customer for AI chips. Strong NVIDIA results confirm Microsoft's AI strategy is on track.",
        plain_english_eli10: "Microsoft buys tons of NVIDIA chips for its AI. NVIDIA doing well means Microsoft's AI plans are working.",
        price_data: { type: "timeline_with_event", title: "MSFT 30-day price", event_label: "NVDA Q4 earnings", data: generateMockPrices(337, 2.8, 19) },
        price_change_pct: 2.8,
        event_date: "2026-02-19",
      },
      {
        step_number: 3,
        event: "ASML benefits from chip equipment demand",
        mechanism: "More GPU production requires more lithography machines from ASML",
        affected_entity: "ASML Holding",
        entity_type: "company",
        ticker: "ASML",
        direction: "up",
        confidence: "medium",
        plain_english: "ASML makes the machines that make chips. More chip demand means more ASML equipment orders.",
        plain_english_eli10: "ASML makes the machines that make NVIDIA's chips. More chips needed = more machine orders.",
        price_data: { type: "timeline_with_event", title: "ASML 30-day price", event_label: "NVDA Q4 earnings", data: generateMockPrices(900, 3.5, 19) },
        price_change_pct: 3.5,
        event_date: "2026-02-19",
      },
    ],
    user_connection: "You hold €160.96 in NVIDIA, €336.95 in Microsoft, and €145.00 in ASML. All three benefit directly from the AI spending cycle confirmed by these earnings.",
    user_connection_eli10: "You own NVIDIA, Microsoft, and ASML! They all make money from AI chips, so this good news helps all three of your stocks.",
    user_relevance_score: 0.95,
  },
};

// ── Event Classifier ───────────────────────────────────

const categoryKeywords: Record<EventCategory, string[]> = {
  tech: ["ai", "openai", "gpt", "chatgpt", "tech", "software", "chip"],
  macro: ["fed", "rate", "inflation", "gdp", "employment", "treasury"],
  geo: ["china", "taiwan", "russia", "war", "military", "sanctions"],
  regulatory: ["eu", "regulation", "act", "sec", "compliance", "ban"],
  earnings: ["earnings", "revenue", "q1", "q2", "q3", "q4", "beat", "miss"],
};

export function classifyEvent(title: string): EventCategory {
  const lower = title.toLowerCase();
  let best: EventCategory = "macro";
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    const score = keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = cat as EventCategory;
    }
  }
  return best;
}

// ── Spend Personalizer ─────────────────────────────────

const merchantToTicker: Record<string, string> = {
  Amazon: "AMZN",
  Apple: "AAPL",
  Netflix: "NFLX",
  Spotify: "SPOT",
  Uber: "UBER",
};

export interface SpendSnapshot {
  merchant: string;
  totalSpent: number;
  ticker: string | null;
}

export function getSpendSnapshot(): SpendSnapshot[] {
  const merchantTotals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.amount < 0) {
      merchantTotals.set(tx.merchant, (merchantTotals.get(tx.merchant) || 0) + Math.abs(tx.amount));
    }
  }
  return Array.from(merchantTotals.entries())
    .map(([merchant, total]) => ({
      merchant,
      totalSpent: +total.toFixed(2),
      ticker: merchantToTicker[merchant] || null,
    }))
    .filter((s) => s.ticker)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 3);
}

// ── Main Engine ────────────────────────────────────────

export function generateCausalChain(eventId: string): CausalChainResponse {
  const def = chainDefinitions[eventId];
  if (!def) {
    return {
      trigger_event: "Unknown event",
      trigger_date: "2026-02-20",
      trigger_source_url: "",
      chain: [],
      user_connection: "No connection found.",
      user_connection_eli10: "We couldn't find how this affects you.",
      user_relevance_score: 0,
      summary: "Unable to analyze this event.",
      summary_eli10: "We don't know enough about this event yet.",
      disclaimer: "This is for educational purposes only and does not constitute financial advice.",
      summary_bullets: [],
      summary_bullets_eli10: [],
    };
  }
  return {
    ...def,
    disclaimer: "This is for educational purposes only and does not constitute financial advice. Past performance does not guarantee future results.",
  };
}
