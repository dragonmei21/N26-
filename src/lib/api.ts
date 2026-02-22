/**
 * api.ts — single source of truth for all backend calls
 *
 * To switch to ngrok before the demo, update .env:
 *   VITE_API_BASE_URL=https://abc123.ngrok.io
 */

import type {
  MacroEvent,
  CausalChainResponse,
  PricedCausalStep,
  EventCategory,
} from "@/lib/macroReasoningEngine";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
const USER_ID  = import.meta.env.VITE_API_USER_ID ?? "mock_user_2";

// ngrok free tier shows an interstitial for browser requests — this header bypasses it
const HEADERS = { "ngrok-skip-browser-warning": "true" };

// ── Category classifier (maps article titles to MacroTab categories) ──

const CATEGORY_KEYWORDS: Record<EventCategory, string[]> = {
  tech:       ["ai", "chip", "semiconductor", "nvidia", "apple", "google", "software", "tech", "openai", "gpt"],
  macro:      ["ecb", "fed", "rate", "inflation", "gdp", "employment", "treasury", "yields", "central bank"],
  geo:        ["china", "taiwan", "russia", "war", "military", "sanctions", "geopolitical", "middle east"],
  regulatory: ["regulation", "act", "sec", "compliance", "ban", "eu ", "rule", "law"],
  earnings:   ["earnings", "revenue", "q1", "q2", "q3", "q4", "results", "beat", "miss", "profit"],
};

const CATEGORY_EMOJI: Record<EventCategory, string> = {
  tech:       "💻",
  macro:      "🏛️",
  geo:        "🌍",
  regulatory: "⚖️",
  earnings:   "📊",
};

function classifyTitle(title: string): EventCategory {
  const lower = title.toLowerCase();
  let best: EventCategory = "macro";
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [EventCategory, string[]][]) {
    const score = keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return best;
}

// ── Hero events — guaranteed to have causal chains (fallback_chain.json) ──

const HERO_EVENTS: MacroEvent[] = [
  {
    id: "1020225c78bb0919",
    title: "Rampant AI Demand for Memory Is Fueling a Growing Chip Crisis",
    source: "Fortune",
    date: "2026-02-17",
    category: "tech",
    emoji: "💻",
  },
  {
    id: "b8544bde55f780b3",
    title: "ECB to Hold Rates Steady Despite Global Strains: Decision Guide",
    source: "Reuters",
    date: "2026-02-21",
    category: "macro",
    emoji: "🏛️",
  },
  {
    id: "132b1ac78ddaea0e",
    title: "Tech leads US stocks rally; renewed geopolitical strife boosts oil, gold",
    source: "Reuters",
    date: "2026-02-21",
    category: "geo",
    emoji: "🌍",
  },
  {
    id: "6f44da0d4f1c521d",
    title: "AI-fuelled tech stock selloff rolls on",
    source: "Reuters",
    date: "2026-02-21",
    category: "tech",
    emoji: "💻",
  },
];

// ── Fetch feed → MacroEvent[] ──────────────────────────────────────────

export async function fetchFeedEvents(limit = 8): Promise<MacroEvent[]> {
  try {
    const res = await fetch(`${BASE_URL}/feed?user_id=${USER_ID}&limit=${limit}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
    const data = await res.json();

    const heroIds = new Set(HERO_EVENTS.map((e) => e.id));

    const feedEvents = (data.feed as Array<{
      id: string;
      title: string;
      source_name: string;
      published_at: string;
      has_causal_chain: boolean;
    }>)
      .filter((a) => a.has_causal_chain && !heroIds.has(a.id))
      .map((a) => {
        const category = classifyTitle(a.title);
        return {
          id: a.id,
          title: a.title,
          source: a.source_name,
          date: a.published_at.split("T")[0],
          category,
          emoji: CATEGORY_EMOJI[category],
        };
      });

    // Hero events always first, then personalised feed articles
    return [...HERO_EVENTS, ...feedEvents];
  } catch {
    // If feed fails, still show hero events
    return HERO_EVENTS;
  }
}

// ── Fetch causal chain → CausalChainResponse ──────────────────────────

interface BackendChainStep {
  step_number: number;
  event: string;
  mechanism: string;
  affected_entity: string;
  entity_type: string;
  ticker: string | null;
  direction: "up" | "down" | "neutral";
  confidence: "high" | "medium" | "low";
  plain_english: string;
  price_data: {
    type: string;
    title: string;
    event_label: string;
    data: { labels: string[]; values: number[]; event_index: number; color: string };
  } | null;
  price_change_pct: number | null;
  event_date: string;
}

interface BackendChainResponse {
  trigger_event: string;
  trigger_date: string;
  trigger_source_url: string;
  chain: BackendChainStep[];
  user_connection: string;
  user_relevance_score: number;
  summary: string;
  disclaimer: string;
}

export async function fetchCausalChain(articleId: string): Promise<CausalChainResponse> {
  const res = await fetch(`${BASE_URL}/causal-chain/${articleId}?user_id=${USER_ID}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Chain fetch failed: ${res.status}`);
  const r: BackendChainResponse = await res.json();

  // Adapt backend shape → frontend type (fill optional eli10/bullets fields)
  const chain: PricedCausalStep[] = r.chain.map((s) => ({
    step_number:          s.step_number,
    event:                s.event,
    mechanism:            s.mechanism,
    affected_entity:      s.affected_entity,
    entity_type:          s.entity_type as PricedCausalStep["entity_type"],
    ticker:               s.ticker,
    direction:            s.direction,
    confidence:           s.confidence,
    plain_english:        s.plain_english,
    plain_english_eli10:  s.plain_english,   // backend has no eli10 variant; reuse
    price_data:           s.price_data
      ? {
          type:        "timeline_with_event" as const,
          title:       s.price_data.title,
          event_label: s.price_data.event_label,
          data: {
            labels:      s.price_data.data.labels,
            values:      s.price_data.data.values,
            event_index: s.price_data.data.event_index,
          },
        }
      : null,
    price_change_pct: s.price_change_pct,
    event_date:       s.event_date,
  }));

  return {
    trigger_event:       r.trigger_event,
    trigger_date:        r.trigger_date,
    trigger_source_url:  r.trigger_source_url,
    chain,
    user_connection:      r.user_connection,
    user_connection_eli10: r.user_connection,  // reuse
    user_relevance_score:  r.user_relevance_score,
    summary:              r.summary,
    summary_eli10:        r.summary,            // reuse
    disclaimer:           r.disclaimer,
    summary_bullets:      [],
    summary_bullets_eli10: [],
  };
}

// ── Generate podcast → returns podcast_id + audio_url ─────────────────

export type PodcastLength = "flash" | "brief" | "deep_dive";
export type PodcastMode = "personal" | "macro";

export interface PodcastMeta {
  podcast_id: string;
  audio_url: string;
  estimated_duration_sec: number;
  title: string;
}

export async function generatePodcast(
  length: PodcastLength = "flash",
  mode: PodcastMode = "personal"
): Promise<PodcastMeta> {
  const res = await fetch(
    `${BASE_URL}/podcast/generate?user_id=${USER_ID}&length=${length}&mode=${mode}`,
    { method: "POST", headers: HEADERS }
  );
  if (!res.ok) throw new Error(`Podcast generation failed: ${res.status}`);
  return res.json();
}

export { USER_ID, BASE_URL, HEADERS };
