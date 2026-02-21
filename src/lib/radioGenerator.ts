/**
 * radioGenerator.ts
 * Generates single-voice financial radio broadcast scripts.
 * Uses Groq LLM when key is available; falls back to local generation.
 */

import {
  GROQ_API_KEY,
  DISCLAIMER,
  callGroq,
  safeParseJSON,
  extractStoryContent,
  buildPortfolioSummary,
  buildFallbackSummaries,
  getDuration,
  SOURCE_URLS,
  type GeneratedScript,
  type ScriptSegment,
  type SummaryBlock,
} from "./audioScriptGenerator";
import type { MarketStory } from "@/data/marketStories";

// ─── Voice presets ────────────────────────────────────────────────────────────

export const RADIO_VOICES = [
  { id: "neutral",   label: "Neutral Analyst",  rate: 1.0,  pitch: 1.0,  desc: "Balanced · Clear"   },
  { id: "energetic", label: "Energetic Host",    rate: 1.13, pitch: 1.07, desc: "Upbeat · Dynamic"   },
  { id: "calm",      label: "Calm Economist",    rate: 0.88, pitch: 0.93, desc: "Measured · Deep"    },
] as const;

export type RadioVoiceId = (typeof RADIO_VOICES)[number]["id"];

export function getRadioVoice(id: string) {
  return RADIO_VOICES.find((v) => v.id === id) ?? RADIO_VOICES[0];
}

// ─── Local fallback ───────────────────────────────────────────────────────────

function buildFallbackRadio(
  stories: MarketStory[],
  selectedIds: Set<string>,
  duration: string
): GeneratedScript {
  const selected = stories.filter((s) => selectedIds.has(s.id));
  const dur = getDuration(duration);
  const slidesPerTopic = dur.value === "1" ? 1 : dur.value === "auto" ? 2 : 3;

  const segs: ScriptSegment[] = [
    {
      speaker: "Presenter",
      emoji: "🎙️",
      text: `Welcome to your N26 financial briefing. I'm your host, and here's what's moving markets ${selected.length === 1 ? "today" : `across ${selected.length} key topics`}.`,
    },
  ];

  selected.forEach((story) => {
    const text = story.slides
      .slice(0, slidesPerTopic)
      .map((sl) => `${sl.headline}. ${sl.body}`)
      .join(" ");
    segs.push({ speaker: "Presenter", emoji: "🎙️", text: `Turning to ${story.label}. ${text}` });
  });

  segs.push({
    speaker: "Presenter",
    emoji: "🎙️",
    text: "That's your market briefing for today. Stay informed, stay invested — and I'll see you next time.",
  });
  segs.push({ speaker: "Disclaimer", emoji: "ℹ️", text: DISCLAIMER });

  const wordCount = segs.reduce((n, s) => n + s.text.split(" ").length, 0);
  return {
    mode: "radio",
    title: "N26 Financial Radio",
    segments: segs,
    disclaimer: DISCLAIMER,
    wordCount,
    summaryBlocks: buildFallbackSummaries(stories, selectedIds),
  };
}

// ─── Groq-powered radio script ────────────────────────────────────────────────

export async function generateRadioScript(
  stories: MarketStory[],
  selectedIds: Set<string>,
  duration: string,
  voiceId: string
): Promise<GeneratedScript> {
  if (!GROQ_API_KEY) return buildFallbackRadio(stories, selectedIds, duration);

  const dur      = getDuration(duration);
  const content  = extractStoryContent(stories, selectedIds);
  const portfolio = buildPortfolioSummary();
  const voiceStyle = getRadioVoice(voiceId);

  const system = `You are a ${voiceStyle.label} for N26 Financial Radio — a premium European digital bank. Write a ${dur.prompt} financial radio broadcast script as JSON only (no markdown, no explanation, raw JSON).

JSON structure:
{
  "title": "N26 Financial Radio — [brief context]",
  "segments": [
    {"text": "Welcome to N26 Financial Radio..."},
    {"text": "Starting with..."},
    ...
  ],
  "summaryBlocks": [
    {
      "title": "Topic title",
      "description": "1–2 sentence plain-English summary of what happened and why it matters.",
      "sources": [
        {"name": "Reuters", "url": "https://www.reuters.com/markets"},
        {"name": "Bloomberg", "url": "https://www.bloomberg.com/markets"}
      ]
    }
  ]
}

Requirements:
- Total ~${dur.words} words across all segments
- Each segment: 2–4 naturally spoken sentences
- Conversational and authoritative, not stiff news-speak
- Structure: warm intro → topic summaries → 1 portfolio connection ("Given your exposure to...") → outro
- Reference user's actual holdings naturally when relevant: ${portfolio.slice(0, 280)}
- Never predict exact prices, never say "you should buy/sell"
- End with: "Stay informed and I'll see you next time."
- summaryBlocks: one block per news topic covered; sources must be real, well-known outlets only (Reuters, Bloomberg, FT, CNBC, ECB, Fed, CoinDesk, etc.)`;

  const user = `Create the radio script from this financial news:\n\n${content}`;

  try {
    const raw = await callGroq(
      [{ role: "system", content: system }, { role: "user", content: user }],
      Math.round(dur.words * 2.2)
    );

    const parsed = safeParseJSON<{
      title?: string;
      segments?: { text: string }[];
      summaryBlocks?: { title: string; description: string; sources: { name: string; url: string }[] }[];
    }>(raw, {});
    if (!parsed.segments?.length) throw new Error("empty segments");

    const segs: ScriptSegment[] = parsed.segments.map((s) => ({
      speaker: "Presenter",
      emoji: "🎙️",
      text: s.text.trim(),
    }));
    segs.push({ speaker: "Disclaimer", emoji: "ℹ️", text: DISCLAIMER });

    const summaryBlocks: SummaryBlock[] = (parsed.summaryBlocks ?? buildFallbackSummaries(stories, selectedIds)).map(
      (b) => ({
        title: b.title ?? "",
        description: b.description ?? "",
        sources: (b.sources ?? [])
          .filter((src) => src.name && (src.url || SOURCE_URLS[src.name]))
          .map((src) => ({ name: src.name, url: src.url || SOURCE_URLS[src.name] })),
      })
    );

    return {
      mode: "radio",
      title: parsed.title ?? "N26 Financial Radio",
      segments: segs,
      disclaimer: DISCLAIMER,
      wordCount: segs.reduce((n, s) => n + s.text.split(" ").length, 0),
      summaryBlocks,
    };
  } catch (err) {
    console.warn("[radioGenerator] Groq failed, using fallback:", err);
    return buildFallbackRadio(stories, selectedIds, duration);
  }
}
