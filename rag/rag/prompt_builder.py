SYSTEM_SUMMARY = """You are a financial education assistant inside the N26 banking app.
Your job is to make financial news understandable to everyday people.

Rules:
1. NEVER fabricate statistics or prices. If unsure, say "according to sources"
2. Always explain WHY something matters to the specific user
3. Keep plain_english to 1-2 sentences max
4. Keep for_you to 1 sentence directly referencing their spending
5. Set confidence: "high" if strong evidence, "medium" if plausible, "low" if speculative
6. Always include disclaimer: "Educational only, not financial advice."
7. Respond ONLY in valid JSON."""

SYSTEM_ELI10 = """You are a friendly financial educator. Explain concepts like the user is 10 years old.
Use everyday analogies, small amounts (€50-€500), and be warm and encouraging.
Respond ONLY in valid JSON."""

SYSTEM_TIP = """You are a personal financial advisor inside N26.
Give one short, actionable daily tip based on current news and user spending.
Be specific, practical, and brief. Respond ONLY in valid JSON."""

SYSTEM_CAUSAL = """You are a financial analyst explaining macro investment chains to everyday people.
Trace how a news event ripples through the economy to specific stocks.

Rules:
1. Maximum 4 steps in the chain
2. Each step must be logically connected to the previous
3. Only include stocks where the connection is DIRECT and defensible
4. Set confidence "high" only if this is a well-established causal pattern
5. Set confidence "medium" if plausible but not certain
6. Never include a step just because a stock is popular
7. Respond ONLY in valid JSON matching the schema."""


def build_summary_prompt(title: str, content: str, source: str, spend_summary: str) -> str:
    return f"""Article to summarize:
Title: {title}
Content: {content[:800]}
Source: {source}

User context: {spend_summary}

Respond with:
{{
  "plain_english": "1-2 sentence summary for a non-expert",
  "for_you": "1 sentence connecting this to the user's spending",
  "confidence": "high|medium|low",
  "disclaimer": "Educational only, not financial advice.",
  "tags": ["tag1", "tag2", "tag3"]
}}"""


def build_eli10_prompt(concept: str, spend_summary: str) -> str:
    return f"""Explain "{concept}" to someone who has never studied finance.
Use a simple analogy involving everyday money situations.
Include one concrete example using small amounts (€50-€500).

User context: {spend_summary}

Respond with:
{{
  "eli10": "2-3 sentence explanation",
  "real_world_example": "1 sentence with a €amount",
  "related_concepts": ["concept1", "concept2"]
}}"""


def build_tip_prompt(top_articles: list[dict], spend_summary: str) -> str:
    headlines = "\n".join(f"- {a['title']}" for a in top_articles[:3])
    return f"""Based on today's top financial news:
{headlines}

User spending context: {spend_summary}

Give ONE short actionable tip (1-2 sentences).

Respond with:
{{
  "text": "The tip text",
  "category": "savings|investing|spending|crypto|macro",
  "urgency": "low|medium|high"
}}"""


def build_causal_chain_prompt(event_title: str, event_date: str, spend_summary: str) -> str:
    return f"""News event: {event_title}
Published: {event_date}

User's spending context: {spend_summary}

Trace the investment causal chain from this event. Return ONLY a JSON object:
{{
  "summary": "2-sentence summary for adults",
  "summary_eli10": "2-sentence summary for a 10-year-old",
  "summary_bullets": ["bullet 1", "bullet 2", "bullet 3"],
  "summary_bullets_eli10": ["eli10 bullet 1", "eli10 bullet 2", "eli10 bullet 3"],
  "user_connection": "1-2 sentences about why this matters to the user based on their spending",
  "user_connection_eli10": "same but for a 10-year-old",
  "user_relevance_score": 0.75,
  "chain": [
    {{
      "step_number": 1,
      "event": "Short event title (5-8 words)",
      "mechanism": "One sentence explaining the financial mechanism",
      "affected_entity": "Company or sector name",
      "entity_type": "company",
      "ticker": "TICKER or null",
      "direction": "up",
      "confidence": "high",
      "plain_english": "1 sentence for adults",
      "plain_english_eli10": "1 sentence for a 10-year-old",
      "price_change_pct": 5.2,
      "event_date": "{event_date}"
    }}
  ]
}}
Rules: 3-4 chain steps max. entity_type: company|sector|commodity|currency|index. direction: up|down|neutral. confidence: high|medium|low."""
