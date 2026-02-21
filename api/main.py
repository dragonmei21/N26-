from dotenv import load_dotenv
load_dotenv()

import io
import json
import os
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from spend.parser import load_transactions, get_user_meta
from spend.categorizer import categorize
from spend.profiler import build_profile, build_spend_summary
from spend.merchant_lookup import MERCHANT_TO_TICKERS, CATEGORY_TO_TICKERS
from rag.llm_client import call_llm
from rag.prompt_builder import (
    SYSTEM_SUMMARY, SYSTEM_ELI10, SYSTEM_TIP, SYSTEM_CAUSAL,
    build_summary_prompt, build_eli10_prompt, build_tip_prompt, build_causal_chain_prompt,
)
from rag.response_parser import parse_summary
from rag.price_correlator import enrich_chain_with_prices, TICKER_BASE_PRICES
from viz.formatters import category_chart, sparkline_data
from trends.counter import get_trending_topics
from cache.store import cache

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

app = FastAPI(title="N26 AI Financial News Curator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_articles() -> list[dict]:
    path = os.path.join(DATA_DIR, "mock_articles.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


MACRO_EVENTS = [
    {"id": "gpt5",         "title": "OpenAI releases ChatGPT-5",                   "source": "TechCrunch",     "date": "2026-02-20", "category": "tech",       "emoji": "🤖"},
    {"id": "fed-cut",      "title": "Fed cuts rates by 50bp",                       "source": "Reuters",        "date": "2026-02-18", "category": "macro",      "emoji": "🏛️"},
    {"id": "eu-ai-act",    "title": "EU AI Act enforcement begins",                 "source": "Financial Times","date": "2026-02-15", "category": "regulatory", "emoji": "⚖️"},
    {"id": "china-taiwan", "title": "China increases military drills near Taiwan",  "source": "Bloomberg",      "date": "2026-02-17", "category": "geo",        "emoji": "🌏"},
    {"id": "nvda-earnings","title": "NVIDIA Q4 earnings smash estimates",           "source": "CNBC",           "date": "2026-02-19", "category": "earnings",   "emoji": "💚"},
]
EVENT_META = {e["id"]: e for e in MACRO_EVENTS}


# ── /feed ────────────────────────────────────────────────────────────────────

@app.get("/feed")
def get_feed(user_id: str = "mock_user_1", limit: int = 8, category: str = "all"):
    cache_key = f"feed:{user_id}:{category}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    transactions = load_transactions(user_id)
    if not transactions:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

    categorized = categorize(transactions)
    profile = build_profile(user_id, categorized)
    spend_summary = build_spend_summary(profile)

    articles = load_articles()
    if category != "all":
        articles = [a for a in articles if a.get("category") == category]

    articles = articles[:limit]
    feed_items = []
    trending_topics = get_trending_topics(articles)

    for article in articles:
        try:
            prompt = build_summary_prompt(
                article["title"], article["content"], article["source_name"], spend_summary
            )
            raw = call_llm(prompt, SYSTEM_SUMMARY, temperature=0.2, max_tokens=400)
            summary = parse_summary(raw, [article["url"]])
            tags = raw.get("tags", [article["category"]])
        except Exception:
            from models.news import AISummary
            summary = AISummary(
                plain_english="Financial news update.",
                for_you="This may be relevant to your interests.",
                confidence="low",
                sources=[article["url"]],
            )
            tags = [article["category"]]

        viz = category_chart(article["category"], article["title"])

        feed_items.append({
            "id": article["article_id"],
            "title": article["title"],
            "source_name": article["source_name"],
            "source_url": article["url"],
            "published_at": article["published_at"],
            "category": article["category"],
            "relevance_score": profile.interests.get(article["category"], 0.5),
            "thumbnail_url": None,
            "ai_summary": summary.model_dump(),
            "visualization": viz,
            "tags": tags,
            "is_trending": any(t["is_spike"] for t in trending_topics if article["category"] in t["topic"]),
            "trend_score": 0.5,
            "has_causal_chain": False,
        })

    try:
        tip_prompt = build_tip_prompt(articles[:3], spend_summary)
        tip_raw = call_llm(tip_prompt, SYSTEM_TIP, temperature=0.3, max_tokens=200)
    except Exception:
        tip_raw = {"text": "Review your spending categories to find potential investment opportunities.", "category": "investing", "urgency": "low"}

    result = {
        "user_id": user_id,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "feed": feed_items,
        "trending_topics": [t["display_name"] for t in trending_topics[:3]],
        "daily_tip": tip_raw,
    }
    cache.set(cache_key, result, ttl_seconds=300)
    return result


# ── /insight/{article_id} ────────────────────────────────────────────────────

@app.get("/insight/{article_id}")
def get_insight(article_id: str, user_id: str = "mock_user_1"):
    cache_key = f"insight:{article_id}:{user_id}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    articles = load_articles()
    article = next((a for a in articles if a["article_id"] == article_id), None)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    transactions = load_transactions(user_id)
    categorized = categorize(transactions)
    profile = build_profile(user_id, categorized)
    spend_summary = build_spend_summary(profile)

    try:
        prompt = build_summary_prompt(article["title"], article["content"], article["source_name"], spend_summary)
        raw = call_llm(prompt, SYSTEM_SUMMARY, temperature=0.2, max_tokens=600)
    except Exception:
        raw = {"plain_english": article["content"][:200], "for_you": "", "confidence": "low"}

    result = {
        "article_id": article_id,
        "title": article["title"],
        "full_summary": raw.get("plain_english", ""),
        "key_takeaways": raw.get("tags", [])[:3],
        "what_you_can_do": {
            "for_saver": "Review how this news affects your N26 Instant Savings.",
            "for_investor": "Consider relevant ETFs if you have a 2+ year horizon.",
            "minimum_amount_eur": 50,
        },
        "reasoning_trace": raw.get("for_you", ""),
        "sources": [{"title": article["title"], "url": article["url"], "reliability": "primary"}],
        "visualization": category_chart(article["category"], article["title"]),
    }
    cache.set(cache_key, result, ttl_seconds=3600)
    return result


# ── /eli10/{concept} ─────────────────────────────────────────────────────────

@app.get("/eli10/{concept}")
def get_eli10(concept: str, user_id: str = "mock_user_1"):
    cache_key = f"eli10:{concept}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    transactions = load_transactions(user_id)
    categorized = categorize(transactions)
    profile = build_profile(user_id, categorized)
    spend_summary = build_spend_summary(profile)

    try:
        prompt = build_eli10_prompt(concept, spend_summary)
        raw = call_llm(prompt, SYSTEM_ELI10, temperature=0.4, max_tokens=300)
    except Exception:
        raw = {"eli10": f"{concept} is a financial term.", "real_world_example": "Ask a financial advisor for details.", "related_concepts": []}

    result = {
        "concept": concept,
        "eli10": raw.get("eli10", ""),
        "real_world_example": raw.get("real_world_example", ""),
        "related_concepts": raw.get("related_concepts", []),
        "visualization": {
            "type": "simple_number",
            "label": f"About {concept}",
            "value": None,
            "unit": "",
        },
    }
    cache.set(cache_key, result, ttl_seconds=3600)
    return result


# ── /trends ──────────────────────────────────────────────────────────────────

@app.get("/trends")
def get_trends():
    cache_key = "trends:current"
    cached = cache.get(cache_key)
    if cached:
        return cached

    articles = load_articles()
    trending = get_trending_topics(articles)

    result = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "trending": trending,
    }
    cache.set(cache_key, result, ttl_seconds=1800)
    return result


# ── /spend-map ───────────────────────────────────────────────────────────────

@app.get("/spend-map")
def get_spend_map(user_id: str = "mock_user_1"):
    cache_key = f"spend_map:{user_id}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    transactions = load_transactions(user_id)
    categorized = categorize(transactions)

    INSTRUMENT_DATA = {
        "travel": {"name": "iShares Global Airlines ETF", "ticker": "JETS", "performance_1y": "+18.4%", "what_it_means": "You spend on airlines. You could also own a slice of them."},
        "grocery": {"name": "Consumer Staples Select SPDR ETF", "ticker": "XLP", "performance_1y": "+6.2%", "what_it_means": "The supermarkets you shop at are publicly traded."},
        "ecommerce": {"name": "Amazon", "ticker": "AMZN", "performance_1y": "+32.1%", "what_it_means": "You're already a customer. You could also be a shareholder."},
        "tech_stocks": {"name": "Invesco QQQ Trust", "ticker": "QQQ", "performance_1y": "+28.5%", "what_it_means": "Your tech subscriptions support companies in this ETF."},
        "energy": {"name": "iShares Clean Energy ETF", "ticker": "ICLN", "performance_1y": "+12.3%", "what_it_means": "Your energy bills fund companies like Iberdrola."},
        "streaming": {"name": "Netflix", "ticker": "NFLX", "performance_1y": "+45.2%", "what_it_means": "You pay for their service every month."},
        "investing": {"name": "iShares Core MSCI World ETF", "ticker": "IWDA", "performance_1y": "+24.0%", "what_it_means": "Broad diversified global exposure."},
    }

    category_totals: dict[str, float] = {}
    category_merchants: dict[str, list[str]] = {}
    for tx in categorized:
        if tx.amount >= 0:
            continue
        cat = tx.categories[0] if tx.categories else "other"
        category_totals[cat] = category_totals.get(cat, 0) + abs(tx.amount)
        if cat not in category_merchants:
            category_merchants[cat] = []
        if tx.merchant not in category_merchants[cat]:
            category_merchants[cat].append(tx.merchant)

    mappings = []
    for cat, total in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
        if cat not in INSTRUMENT_DATA:
            continue
        inst = INSTRUMENT_DATA[cat]
        mappings.append({
            "spend_category": cat,
            "spend_amount_eur_30d": round(total, 2),
            "merchant_examples": category_merchants.get(cat, [])[:3],
            "related_instruments": [{"minimum_invest_eur": 50, **inst}],
            "visualization": {
                "type": "donut_with_arrow",
                "spend_label": f"Your {cat} spend",
                "spend_value": round(total, 2),
                "instrument_label": f"{inst['ticker']} 1Y return",
                "instrument_value": float(inst["performance_1y"].replace("%", "").replace("+", "")),
                "color": "#00D4A8",
            },
        })

    total_mapped = sum(category_totals.values())
    result = {
        "user_id": user_id,
        "mappings": mappings[:5],
        "total_spend_mapped_eur": round(total_mapped, 2),
        "insight": f"You spent €{total_mapped:.0f} last month. If you had invested 10% in related ETFs 1 year ago, your theoretical gain could have been ~€{total_mapped * 0.1 * 0.2:.0f}.",
    }
    cache.set(cache_key, result, ttl_seconds=300)
    return result


# ── /fund-tracker ─────────────────────────────────────────────────────────────

@app.get("/fund-tracker")
def get_fund_tracker(topic: str = ""):
    cache_key = f"fund_tracker:{topic}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    result = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "funds": [
            {
                "name": "ARK Innovation ETF",
                "ticker": "ARKK",
                "manager": "Cathie Wood",
                "latest_moves": [
                    {"action": "bought", "instrument": "Tesla", "amount_approx": "$45M", "plain_english": "ARK bet big on Tesla — they think EV + robotaxi demand is recovering", "date": "2026-02-20"},
                    {"action": "bought", "instrument": "NVIDIA", "amount_approx": "$28M", "plain_english": "ARK increased NVIDIA exposure ahead of earnings", "date": "2026-02-18"},
                ],
                "current_top_holdings": ["Tesla", "Coinbase", "Palantir", "Roku", "NVIDIA"],
                "ytd_performance": -4.2,
                "what_regular_investor_can_do": "Buy ARKK ETF directly for ~€50 min on most EU brokers",
                "visualization": {"type": "horizontal_bar", "title": "ARK Top Holdings Weight", "data": {"labels": ["Tesla", "Coinbase", "Palantir", "Roku", "Other"], "values": [22, 15, 12, 8, 43], "colors": ["#E31937", "#F7931A", "#6C5CE7", "#00B4D8", "#95A5A6"]}},
            },
            {
                "name": "Vanguard FTSE Europe ETF",
                "ticker": "VGK",
                "manager": "Vanguard",
                "latest_moves": [
                    {"action": "increased", "instrument": "European Bonds", "amount_approx": "+4% allocation", "plain_english": "Vanguard is betting ECB will cut rates — locking in current yields", "date": "2026-02-19"},
                ],
                "current_top_holdings": ["ASML", "Novo Nordisk", "LVMH", "SAP", "Nestle"],
                "ytd_performance": 8.3,
                "what_regular_investor_can_do": "VGK gives you exposure to 1,200+ European companies for one fee",
                "visualization": {"type": "horizontal_bar", "title": "VGK Sector Allocation", "data": {"labels": ["Financials", "Healthcare", "Consumer", "Tech", "Industrials"], "values": [18, 16, 15, 14, 12], "colors": ["#00D4A8", "#6C5CE7", "#F59E0B", "#00B4D8", "#4CAF50"]}},
            },
        ],
    }
    cache.set(cache_key, result, ttl_seconds=3600)
    return result


# ── /tip ──────────────────────────────────────────────────────────────────────

@app.get("/tip")
def get_tip(user_id: str = "mock_user_1"):
    cache_key = f"tip:{user_id}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    transactions = load_transactions(user_id)
    categorized = categorize(transactions)
    profile = build_profile(user_id, categorized)
    spend_summary = build_spend_summary(profile)
    articles = load_articles()[:3]

    try:
        prompt = build_tip_prompt([{"title": a["title"]} for a in articles], spend_summary)
        raw = call_llm(prompt, SYSTEM_TIP, temperature=0.4, max_tokens=200)
    except Exception:
        raw = {"text": "Review your spending to identify potential investment opportunities.", "category": "investing", "urgency": "low"}

    result = {
        "tip": {
            "text": raw.get("text", ""),
            "category": raw.get("category", "investing"),
            "urgency": raw.get("urgency", "low"),
            "potential_gain_eur": None,
            "based_on": ["current_news", "spend_profile"],
            "cta": {"text": "Explore Investments", "deep_link": "n26://investments"},
        }
    }
    cache.set(cache_key, result, ttl_seconds=1800)
    return result


# ── /events + /events/{id}/causal-chain ──────────────────────────────────────

@app.get("/events")
def get_events():
    return MACRO_EVENTS


@app.get("/events/{event_id}/causal-chain")
def get_causal_chain(event_id: str, user_id: str = "mock_user_1"):
    if event_id not in EVENT_META:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found")

    cache_key = f"chain:{event_id}:{user_id}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    event = EVENT_META[event_id]

    transactions = load_transactions(user_id)
    categorized = categorize(transactions)
    profile = build_profile(user_id, categorized)
    spend_summary = build_spend_summary(profile)

    try:
        prompt = build_causal_chain_prompt(event["title"], event["date"], spend_summary)
        raw = call_llm(prompt, SYSTEM_CAUSAL, temperature=0.3, max_tokens=1500)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI error: {e}")

    chain = enrich_chain_with_prices(raw.get("chain", []), event["date"])

    result = {
        "trigger_event": event["title"],
        "trigger_date": event["date"],
        "trigger_source_url": f"https://{event['source'].lower().replace(' ', '')}.com",
        "chain": chain,
        "summary": raw.get("summary", ""),
        "summary_eli10": raw.get("summary_eli10", ""),
        "summary_bullets": raw.get("summary_bullets", []),
        "summary_bullets_eli10": raw.get("summary_bullets_eli10", []),
        "user_connection": raw.get("user_connection", ""),
        "user_connection_eli10": raw.get("user_connection_eli10", ""),
        "user_relevance_score": raw.get("user_relevance_score", 0.5),
        "disclaimer": "This is for educational purposes only and does not constitute financial advice. Past performance does not guarantee future results.",
    }
    cache.set(cache_key, result, ttl_seconds=3600)
    return result


# ── Root ─────────────────────────────────────────────────────────────────────

# ── /audio-script ─────────────────────────────────────────────────────────────

class AudioScriptRequest(BaseModel):
    stories: list[dict]        # [{id, label, slides: [{headline, body, source}]}]
    duration: str = "auto"     # "1" | "5" | "10" | "auto"
    user_id: str = "mock_user_1"


SYSTEM_AUDIO = """You are a professional financial news broadcaster writing a spoken audio briefing for the N26 banking app.
Write in a warm, conversational, radio-host style. Use short sentences. No bullet points — this is meant to be read aloud.
Never say "hashtag", never use symbols like %, $, € in a way that sounds unnatural when spoken (spell them out: "percent", "dollars", "euros").
Do not fabricate any numbers not given to you. Respond ONLY with the plain spoken script text — no JSON, no markdown, no headers."""


@app.post("/audio-script")
def generate_audio_script(req: AudioScriptRequest):
    cache_key = f"audio:{req.user_id}:{req.duration}:{'_'.join(s['id'] for s in req.stories)}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    sentences_map = {"1": 1, "5": 2, "10": 3, "auto": 2}
    sentences_per_topic = sentences_map.get(req.duration, 2)

    stories_text = ""
    for story in req.stories:
        stories_text += f"\n\nTopic: {story['label']}\n"
        for slide in story.get("slides", [])[:sentences_per_topic]:
            stories_text += f"- {slide['headline']}: {slide['body']} (Source: {slide.get('source', '')})\n"

    prompt = f"""Write a spoken audio briefing covering these financial news topics.
Duration target: {req.duration} minute{'s' if req.duration != '1' else ''}.
Sentences per topic: {sentences_per_topic}.

News topics to cover:
{stories_text}

Write a natural, engaging spoken script. Start with a short intro like "Here's your N26 market briefing." 
Cover each topic smoothly, transition naturally between them, and end with a brief sign-off.
Write ONLY the script text — nothing else."""

    from rag.llm_client import get_client
    client = get_client()
    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": SYSTEM_AUDIO},
            {"role": "user", "content": prompt},
        ],
        model="llama-3.3-70b-versatile",
        temperature=0.6,
        max_tokens=800,
    )
    script = response.choices[0].message.content.strip()

    result = {"script": script}
    cache.set(cache_key, result, ttl_seconds=3600)
    return result


# ── /audio-tts ────────────────────────────────────────────────────────────────

# playai-tts voices mapped to UI voice styles
# playai-tts supports up to 10K chars per request — no chunking needed
VOICE_MAP = {
    "neutral":   "Fritz-PlayAI",    # calm, balanced male
    "energetic": "Chip-PlayAI",     # upbeat, dynamic male
    "calm":      "Celeste-PlayAI",  # measured, warm female
}

TTS_MODEL = "playai-tts"


class AudioTTSRequest(BaseModel):
    script: str
    voice_style: str = "neutral"   # "neutral" | "energetic" | "calm"
    user_id: str = "mock_user_1"


@app.post("/audio-tts")
def generate_audio_tts(req: AudioTTSRequest):
    """Convert a text script to audio using Groq PlayAI TTS."""
    voice_id = VOICE_MAP.get(req.voice_style, VOICE_MAP["neutral"])
    script = req.script.strip()
    if not script:
        raise HTTPException(status_code=400, detail="Script is empty")

    # playai-tts supports up to 10K chars — send the whole script at once
    script = script[:9000]

    from rag.llm_client import get_client
    client = get_client()

    try:
        response = client.audio.speech.create(
            model=TTS_MODEL,
            voice=voice_id,
            input=script,
            response_format="wav",
        )
        audio_bytes = response.read()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"TTS error: {e}")

    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/wav",
        headers={"Content-Disposition": "inline; filename=briefing.wav"},
    )



@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "N26 AI Financial News Curator",
        "endpoints": ["/feed", "/insight/{id}", "/eli10/{concept}", "/trends", "/spend-map", "/fund-tracker", "/tip", "/events", "/events/{id}/causal-chain", "/audio-script", "/audio-tts", "/docs"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
