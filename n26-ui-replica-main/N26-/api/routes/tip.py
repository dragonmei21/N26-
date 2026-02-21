import json
from fastapi import APIRouter, HTTPException, Query

from spend.profiler import build_profile
from ingestion.fetcher import fetch_articles
from ingestion.cleaner import clean_articles
from rag.llm_client import complete

router = APIRouter()

_FALLBACK_TIPS = {
    "low": {
        "text": "With ECB rates stable at 3.5%, N26 Instant Savings at 2.5% is one of the best no-lock-in options. Consider moving idle money from your main account.",
        "category": "savings",
        "urgency": "low",
        "potential_gain_eur": 18,
        "based_on": ["ecb_rate_hold", "user_savings_balance"],
    },
    "high": {
        "text": "AI and semiconductor stocks are surging on NVIDIA earnings. Even a small ETF position in QQQ could capture this momentum — minimum €50.",
        "category": "investing",
        "urgency": "medium",
        "potential_gain_eur": 45,
        "based_on": ["nvidia_earnings", "user_tech_spend"],
    },
    "moderate": {
        "text": "Markets are moving fast today. Diversifying into a broad ETF like VWCE protects against single-stock risk while keeping your money working.",
        "category": "investing",
        "urgency": "low",
        "potential_gain_eur": 25,
        "based_on": ["market_volatility", "user_profile"],
    },
}


def _parse_tip(raw: str) -> dict | None:
    try:
        return json.loads(raw)
    except Exception:
        return None


@router.get("/tip")
def get_tip(user_id: str = Query(..., description="mock_user_1 or mock_user_2")):
    try:
        profile = build_profile(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Get today's top headline for context
    top_headline = ""
    try:
        articles = clean_articles(fetch_articles())
        if articles:
            top_headline = articles[0].title
    except Exception:
        pass

    spend_summary = profile["spend_summary"]
    risk = profile["risk_appetite"]

    prompt = f"""You are a personal finance assistant for N26 bank customers.

User profile: {spend_summary}
Today's top financial news: {top_headline or "Markets are active with rate and AI developments."}

Give ONE actionable financial tip for this user in under 30 words. Be specific to their spending and risk profile.

Respond ONLY with valid JSON matching exactly:
{{"text": "tip text here", "category": "savings|investing|crypto|spending", "urgency": "low|medium|high", "potential_gain_eur": <integer>, "based_on": ["<reason1>", "<reason2>"]}}"""

    raw = complete(prompt, temperature=0.3, max_tokens=200)
    tip_data = _parse_tip(raw)

    if not tip_data or "text" not in tip_data:
        tip_data = _FALLBACK_TIPS.get(risk, _FALLBACK_TIPS["moderate"])

    return {
        "tip": {
            "text": tip_data.get("text", ""),
            "category": tip_data.get("category", "savings"),
            "urgency": tip_data.get("urgency", "low"),
            "potential_gain_eur": tip_data.get("potential_gain_eur", 0),
            "based_on": tip_data.get("based_on", []),
            "cta": {
                "text": "Open Instant Savings",
                "deep_link": "n26://savings/instant",
            },
        }
    }
