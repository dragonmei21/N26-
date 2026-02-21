/**
 * podcastGenerator.ts
 * Generates multi-persona financial podcast conversations (Market Minds).
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

// ─── Personas ─────────────────────────────────────────────────────────────────

export const PERSONAS = [
  {
    id: "Analyst",
    emoji: "📊",
    label: "The Analyst",
    style: "data-driven, precise, always references numbers and percentages",
  },
  {
    id: "Investor",
    emoji: "💬",
    label: "The Curious Investor",
    style: "enthusiastic retail investor, asks the questions your audience would ask, relatable",
  },
  {
    id: "Strategist",
    emoji: "🧠",
    label: "The Macro Strategist",
    style: "big-picture thinker, connects today's news to long-term macro trends",
  },
] as const;

export type PersonaId = (typeof PERSONAS)[number]["id"];

export function getPersona(id: string) {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

// ─── Local fallback ───────────────────────────────────────────────────────────

function buildFallbackPodcast(
  stories: MarketStory[],
  selectedIds: Set<string>,
  duration: string
): GeneratedScript {
  const selected = stories.filter((s) => selectedIds.has(s.id));
  const dur = getDuration(duration);
  const slidesPerTopic = dur.value === "1" ? 1 : 2;

  const segs: ScriptSegment[] = [
    {
      speaker: "Analyst",
      emoji: "📊",
      text: `Welcome to Market Minds, your personalised financial podcast from N26. I'm your analyst. We've got ${selected.length} big story${selected.length !== 1 ? "s" : ""} to unpack today.`,
    },
    {
      speaker: "Investor",
      emoji: "💬",
      text: "Love it. Let's dive in — what's the headline move I should know about right now?",
    },
    {
      speaker: "Strategist",
      emoji: "🧠",
      text: "Before we get tactical, let me give you the macro framing. Markets are at an interesting inflection point right now.",
    },
  ];

  selected.slice(0, slidesPerTopic + 1).forEach((story) => {
    const slide0 = story.slides[0];
    const slide1 = story.slides[1];
    if (!slide0) return;

    segs.push({
      speaker: "Analyst",
      emoji: "📊",
      text: `On ${story.label}: ${slide0.headline}. ${slide0.body}`,
    });
    segs.push({
      speaker: "Investor",
      emoji: "💬",
      text: `Okay, that's significant. What does that actually mean for someone holding positions in this space?`,
    });
    if (slide1) {
      segs.push({
        speaker: "Strategist",
        emoji: "🧠",
        text: `Zooming out — ${slide1.body} This isn't happening in isolation; it's part of a broader structural shift.`,
      });
    }
  });

  segs.push({
    speaker: "Analyst",
    emoji: "📊",
    text: "Alright, let's wrap up. The key data points to watch: keep an eye on central bank signals and sector rotation.",
  });
  segs.push({
    speaker: "Investor",
    emoji: "💬",
    text: "Got it. I feel much more informed. Stay curious, everyone!",
  });
  segs.push({
    speaker: "Strategist",
    emoji: "🧠",
    text: "And remember: react to data, not to noise. Think long-term, stay diversified. See you next episode.",
  });
  segs.push({ speaker: "Disclaimer", emoji: "ℹ️", text: DISCLAIMER });

  const wordCount = segs.reduce((n, s) => n + s.text.split(" ").length, 0);
  return {
    mode: "podcast",
    title: "Market Minds",
    segments: segs,
    disclaimer: DISCLAIMER,
    wordCount,
    summaryBlocks: buildFallbackSummaries(stories, selectedIds),
  };
}

// ─── Groq-powered podcast conversation ───────────────────────────────────────

export async function generatePodcastScript(
  stories: MarketStory[],
  selectedIds: Set<string>,
  duration: string
): Promise<GeneratedScript> {
  if (!GROQ_API_KEY) return buildFallbackPodcast(stories, selectedIds, duration);

  const dur      = getDuration(duration);
  const content  = extractStoryContent(stories, selectedIds);
  const portfolio = buildPortfolioSummary();

  const personaDesc = PERSONAS.map(
    (p) => `- ${p.id} (${p.emoji}): ${p.style}`
  ).join("\n");

  const system = `You are writing "Market Minds" — a scripted financial podcast for N26 users. Three personas have a lively conversation about today's financial news.

Personas:
${personaDesc}

User's portfolio context (reference naturally when relevant):
${portfolio}

Output valid JSON only — no markdown, no explanation, raw JSON:
{
  "title": "Market Minds — [brief episode title]",
  "segments": [
    {"speaker": "Analyst", "emoji": "📊", "text": "..."},
    {"speaker": "Investor", "emoji": "💬", "text": "..."},
    {"speaker": "Strategist", "emoji": "🧠", "text": "..."},
    ...
  ],
  "summaryBlocks": [
    {
      "title": "Topic title",
      "description": "1–2 sentence plain-English summary of what happened and why it matters.",
      "sources": [
        {"name": "Reuters", "url": "https://www.reuters.com/markets"}
      ]
    }
  ]
}

Conversation rules:
- Target ~${dur.words} words total
- Each segment: 2–4 sentences
- Must feel like REAL conversation — personas build on, challenge, and question each other
- Use natural transitions: "Great point, but...", "That's exactly what I was thinking...", "Actually, looking at the numbers..."
- Include at least 2 questions from the Investor persona
- Reference user's actual holdings naturally: e.g. "Given your NVDA position..." or "Your Gold ETC is actually benefiting from..."
- Mention any portfolio concentration risks if relevant (${portfolio.includes("52%") ? "heavy crypto concentration" : "tech concentration"})
- Analyst opens with intro, Strategist closes with takeaway
- NEVER predict exact prices, NEVER say "you should buy/sell"
- Show genuine disagreement at least once
- Last segment must be Analyst delivering the disclaimer`;

  const user = `Create the Market Minds episode from this financial news:\n\n${content}`;

  try {
    const raw = await callGroq(
      [{ role: "system", content: system }, { role: "user", content: user }],
      Math.round(dur.words * 2.5)
    );

    const parsed = safeParseJSON<{
      title?: string;
      segments?: { speaker: string; emoji: string; text: string }[];
      summaryBlocks?: { title: string; description: string; sources: { name: string; url: string }[] }[];
    }>(raw, {});

    if (!parsed.segments?.length) throw new Error("empty segments");

    const validIds = new Set(PERSONAS.map((p) => p.id));
    const segs: ScriptSegment[] = parsed.segments
      .filter((s) => s.text?.trim())
      .map((s) => {
        const speakerId: PersonaId = validIds.has(s.speaker as PersonaId)
          ? (s.speaker as PersonaId)
          : "Analyst";
        const persona = PERSONAS.find((p) => p.id === speakerId);
        return {
          speaker: speakerId,
          emoji:   persona?.emoji ?? s.emoji ?? "🎙️",
          text:    s.text.trim(),
        };
      });

    // Append disclaimer tile after the last Analyst segment
    const lastAnalyst = [...segs].reverse().find((s) => s.speaker === "Analyst");
    if (lastAnalyst) {
      segs.push({ speaker: "Disclaimer", emoji: "ℹ️", text: DISCLAIMER });
    }

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
      mode: "podcast",
      title: parsed.title ?? "Market Minds",
      segments: segs,
      disclaimer: DISCLAIMER,
      wordCount: segs.reduce((n, s) => n + s.text.split(" ").length, 0),
      summaryBlocks,
    };
  } catch (err) {
    console.warn("[podcastGenerator] Groq failed, using fallback:", err);
    return buildFallbackPodcast(stories, selectedIds, duration);
  }
}
