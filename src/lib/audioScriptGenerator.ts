/**
 * audioScriptGenerator.ts
 * Shared types, Groq client, portfolio utilities for the Financial Radio feature.
 */

import { portfolioHoldings } from "@/data/portfolioHoldings";
import type { MarketStory } from "@/data/marketStories";

// ─── Groq Config ──────────────────────────────────────────────────────────────
export const GROQ_API_KEY = ""; // groq key here
const GROQ_CHAT_URL   = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_CHAT_MODEL = "llama-3.1-8b-instant";
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScriptSegment {
  speaker: string;  // "Presenter" | "Analyst" | "Investor" | "Strategist" | "Disclaimer"
  emoji: string;
  text: string;
}

export interface SummaryBlock {
  title: string;
  description: string;
  sources: { name: string; url: string }[];
}

export interface GeneratedScript {
  mode: "radio" | "podcast";
  title: string;
  segments: ScriptSegment[];
  disclaimer: string;
  wordCount: number;
  summaryBlocks: SummaryBlock[];
}

// ─── Known source URLs ────────────────────────────────────────────────────────

export const SOURCE_URLS: Record<string, string> = {
  "Reuters":            "https://www.reuters.com/markets",
  "Bloomberg":          "https://www.bloomberg.com/markets",
  "Financial Times":    "https://www.ft.com/markets",
  "FT":                 "https://www.ft.com/markets",
  "Wall Street Journal":"https://www.wsj.com/finance",
  "WSJ":                "https://www.wsj.com/finance",
  "CNBC":               "https://www.cnbc.com/markets",
  "MarketWatch":        "https://www.marketwatch.com",
  "Investing.com":      "https://www.investing.com",
  "CoinDesk":           "https://www.coindesk.com",
  "CoinTelegraph":      "https://cointelegraph.com",
  "ECB":                "https://www.ecb.europa.eu/press",
  "Fed":                "https://www.federalreserve.gov/newsevents",
  "Federal Reserve":    "https://www.federalreserve.gov/newsevents",
  "SEC":                "https://www.sec.gov/news",
  "Yahoo Finance":      "https://finance.yahoo.com",
  "Morningstar":        "https://www.morningstar.com",
  "Seeking Alpha":      "https://seekingalpha.com",
};

// ─── Duration config ──────────────────────────────────────────────────────────

export const DURATIONS = [
  { label: "1 min",  value: "1",    words: 130,  prompt: "1-minute"  },
  { label: "5 min",  value: "5",    words: 650,  prompt: "5-minute"  },
  { label: "10 min", value: "10",   words: 1300, prompt: "10-minute" },
  { label: "Auto",   value: "auto", words: 320,  prompt: "2–3 minute" },
] as const;

export type DurationValue = (typeof DURATIONS)[number]["value"];

export function getDuration(value: string) {
  return DURATIONS.find((d) => d.value === value) ?? DURATIONS[3];
}

// ─── Disclaimer ───────────────────────────────────────────────────────────────

export const DISCLAIMER =
  "This content is for educational and informational purposes only. It does not constitute financial advice. Past performance is not indicative of future results. Always consult a qualified financial adviser before making investment decisions.";

// ─── Portfolio summary ────────────────────────────────────────────────────────

export function buildPortfolioSummary(): string {
  const total = portfolioHoldings.reduce((s, h) => s + h.valueEUR, 0);

  const bySector: Record<string, number> = {};
  portfolioHoldings.forEach((h) => {
    bySector[h.sector] = (bySector[h.sector] ?? 0) + h.valueEUR;
  });

  const top5 = [...portfolioHoldings]
    .sort((a, b) => b.valueEUR - a.valueEUR)
    .slice(0, 5)
    .map((h) => `${h.name} (${h.ticker}, €${h.valueEUR.toFixed(0)})`)
    .join(", ");

  const sectorBreakdown = Object.entries(bySector)
    .sort((a, b) => b[1] - a[1])
    .map(([s, v]) => `${s} ${((v / total) * 100).toFixed(0)}%`)
    .join(", ");

  const cryptoValue = bySector["Crypto"] ?? 0;
  const techValue   = bySector["Technology"] ?? 0;
  const cryptoPct   = ((cryptoValue / total) * 100).toFixed(0);
  const techPct     = ((techValue / total) * 100).toFixed(0);

  return [
    `Total portfolio: €${total.toFixed(0)}`,
    `Top 5 holdings: ${top5}`,
    `Sector mix: ${sectorBreakdown}`,
    `Notable concentrations: ${cryptoPct}% crypto, ${techPct}% technology`,
  ].join(". ");
}

// ─── Story content extractor ──────────────────────────────────────────────────

export function extractStoryContent(
  stories: MarketStory[],
  selectedIds: Set<string>
): string {
  return stories
    .filter((s) => selectedIds.has(s.id))
    .map((s) => {
      const slides = s.slides.map((sl) => `${sl.headline}: ${sl.body}`).join(" ");
      return `[${s.label}] ${slides}`;
    })
    .join("\n\n");
}

// ─── Groq call ────────────────────────────────────────────────────────────────

export async function callGroq(
  messages: { role: string; content: string }[],
  maxTokens: number
): Promise<string> {
  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_CHAT_MODEL,
      temperature: 0.72,
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Fallback summary builder ─────────────────────────────────────────────────

export function buildFallbackSummaries(
  stories: import("@/data/marketStories").MarketStory[],
  selectedIds: Set<string>
): SummaryBlock[] {
  return stories
    .filter((s) => selectedIds.has(s.id))
    .map((s) => ({
      title: s.label,
      description: s.slides[0]?.body ?? s.slides[0]?.headline ?? "",
      sources: [],
    }));
}

// ─── Safe JSON parse (handles markdown code fences) ──────────────────────────

export function safeParseJSON<T>(raw: string, fallback: T): T {
  try {
    const stripped =
      raw.match(/```json\s*([\s\S]*?)```/)?.[1] ??
      raw.match(/```\s*([\s\S]*?)```/)?.[1] ??
      raw;
    return JSON.parse(stripped) as T;
  } catch {
    return fallback;
  }
}
