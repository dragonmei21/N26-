import re
import os
from openai import AsyncOpenAI
from models.podcast import PodcastScript, PodcastSegment

# Spec used AsyncAnthropic — adapted to AsyncOpenAI (same project stack)
_client: AsyncOpenAI | None = None

def get_async_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


SCRIPT_SYSTEM_PROMPT = """You are a senior financial journalist and podcast host in the tradition of The Economist and the Financial Times — but with genuine warmth and energy. You are engaged, curious, and clearly enjoy what you do. You explain markets the way a brilliant friend would over coffee: clearly, confidently, with a spark of enthusiasm that makes the listener lean in.

Your tone is intelligent and upbeat. You are not a robot reading a report. You find the story genuinely interesting and that comes through. Dry wit is welcome. A sense of forward momentum runs through every episode — you make the listener feel informed and ready, not anxious or bored.

Structure every episode around cause and effect: what happened, why it happened, what it means for markets, and what the listener should watch next. Anchor every claim in a specific number or fact provided to you. Never invent data.

Rules:
1. Write for the ear. No bullet points, no headers, no markdown.
2. Sentences are clear and measured. Vary length — short for emphasis, longer for explanation.
3. Spell out numbers: "three point five percent" not "3.5%"
4. Always open with: "Hello and welcome to the N26 Financial Briefing." Then introduce the episode with a data-grounded hook — a striking fact or figure that establishes the stakes immediately.
5. Explain the mechanism clearly: not just what happened, but why it matters and how it flows through to markets and the listener's portfolio.
6. Define any technical term the first time you use it — one sentence, no condescension.
7. Do not fabricate any data — only use what is provided.
8. Transitions between segments must be logical and natural, not performative.
9. Close with one forward-looking insight — calm, specific, actionable.
10. Mark each segment with [SEGMENT: segment_name] on its own line.

Avoid: hype language, exclamation points, slang, "let's dive in", "buckle up", retail trading tone, AI-sounding filler phrases, overuse of the listener's name."""


LENGTH_CONFIGS = {
    "flash": {
        "target_words": 300,
        "segments": ["intro", "portfolio_snapshot", "top_story", "close"],
        "max_stories": 1
    },
    "brief": {
        "target_words": 1500,
        "segments": ["intro", "portfolio_overview", "story_1", "story_2", "story_3", "spending_connection", "close"],
        "max_stories": 3
    },
    "deep_dive": {
        "target_words": 4500,
        "segments": ["intro", "market_overview", "story_1", "story_2", "story_3",
                     "big_funds", "crypto", "personal_wrap", "close"],
        "max_stories": 5
    }
}


async def generate_podcast_script(
    length: str,
    mode: str,
    feed_articles: list[dict],
    trends: list[dict],
    portfolio: dict,
    user_name: str = "there"
) -> PodcastScript:

    config = LENGTH_CONFIGS[length]
    articles = feed_articles[:config["max_stories"]] if mode == "personal" \
               else trends[:config["max_stories"]]

    portfolio_block = _portfolio_summary(portfolio)

    prompt = f"""Create a {length.replace('_', ' ')} financial podcast script ({config['target_words']} words).
Mode: {mode}
Listener name: {user_name}

LISTENER'S PORTFOLIO (you MUST reference these specific holdings by name when connecting news to markets):
{portfolio_block}

IMPORTANT: In the portfolio segment, name at least 3 of the holdings above explicitly — for example "your Bitcoin position", "your NVIDIA shares", "your Ethereum". Connect each news story directly to how it affects one or more of these specific assets.

News to cover:
{_articles_summary(articles)}

Segments to include: {', '.join(config['segments'])}
Mark each with [SEGMENT: segment_name] on its own line.
Target {config['target_words']} words total."""

    response = await get_async_client().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SCRIPT_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.6,
        max_tokens=6000,
    )

    raw = response.choices[0].message.content.strip()
    return _parse_segments(raw, length, mode)


def _portfolio_summary(portfolio: dict) -> str:
    positions = portfolio.get("positions", [])
    if not positions:
        # Hardcoded fallback — matches portfolioCoins in mockData.ts
        positions = [
            {"name": "Ethereum",  "ticker": "ETH",  "price_eur": 1678.94,  "price_change_24h_pct":  4.25},
            {"name": "Bitcoin",   "ticker": "BTC",  "price_eur": 57803.55, "price_change_24h_pct":  2.10},
            {"name": "SHIBA INU", "ticker": "SHIB", "price_eur": 0.0000053,"price_change_24h_pct": -1.45},
            {"name": "Apple",     "ticker": "AAPL", "price_eur": 264.58,   "price_change_24h_pct":  1.25},
            {"name": "NVIDIA",    "ticker": "NVDA", "price_eur": 189.82,   "price_change_24h_pct": -0.85},
        ]
    lines = []
    for p in positions:
        change = p.get("price_change_24h_pct")
        price = p.get("price_eur", p.get("held_eur", 0))
        direction = "UP" if change and change > 0 else ("DOWN" if change and change < 0 else "flat")
        change_str = f"{'+' if change and change > 0 else ''}{change}% today ({direction})" if change else ""
        lines.append(f"- {p['name']} ({p['ticker']}): €{price:,.2f} — {change_str}")
    return "\n".join(lines)


def _articles_summary(articles: list[dict]) -> str:
    out = []
    for i, a in enumerate(articles, 1):
        ai = a.get("ai_summary", {})
        out.append(
            f"Story {i}: {a.get('title', '')}\n"
            f"Summary: {ai.get('plain_english', '')}\n"
            f"User angle: {ai.get('for_you', '')}"
        )
    return "\n\n".join(out) or "No stories available."


def _parse_segments(raw: str, length: str, mode: str) -> PodcastScript:
    parts = re.compile(r'\[SEGMENT:\s*(\w+)\]', re.IGNORECASE).split(raw)
    segments = []

    for i in range(1, len(parts) - 1, 2):
        name = parts[i].strip()
        text = parts[i + 1].strip()
        wc = len(text.split())
        segments.append(PodcastSegment(
            name=name,
            text=text,
            word_count=wc,
            estimated_duration_sec=int(wc / 2.5)  # ~150 words/min
        ))

    total_words = sum(s.word_count for s in segments)
    full_text = "\n\n".join(s.text for s in segments)

    return PodcastScript(
        length=length,
        mode=mode,
        segments=segments,
        total_words=total_words,
        estimated_duration_sec=int(total_words / 2.5),
        full_text=full_text
    )
