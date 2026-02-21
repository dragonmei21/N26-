import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query

from ingestion.fetcher import fetch_articles
from ingestion.cleaner import clean_articles
from spend.profiler import build_profile
from relevance.scorer import score
from rag.prompt_builder import build_summary_prompt
from rag.llm_client import complete
from cache.store import cache

router = APIRouter()


def _parse_summary(raw: str) -> dict:
    """Parse LLM JSON response, return safe fallback on failure."""
    try:
        return json.loads(raw)
    except Exception:
        return {
            "plain_english": raw[:200] if raw else "Summary unavailable.",
            "for_you": "Check back later for personalised insights.",
        }


@router.get("/feed")
def get_feed(
    user_id: str = Query(..., description="mock_user_1 or mock_user_2"),
    limit: int = Query(8, le=20),
):
    # 1. Load + clean articles
    articles = clean_articles(fetch_articles())

    # 2. Build user profile
    try:
        profile = build_profile(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # 3. Score and rank
    scored = sorted(
        articles,
        key=lambda a: score(a, profile["ticker_interests"]),
        reverse=True,
    )
    top = scored[:limit]

    # 4. Enrich with LLM summaries
    feed = []
    for article in top:
        prompt = build_summary_prompt(article, profile["spend_summary"])
        raw = complete(prompt)
        summary = _parse_summary(raw)

        feed.append({
            "id": article.id,
            "title": article.title,
            "source_name": article.source_name,
            "source_url": article.source_url,
            "published_at": article.published_at.isoformat(),
            "category": article.category,
            "relevance_score": score(article, profile["ticker_interests"]),
            "thumbnail_url": article.thumbnail_url,
            "ai_summary": {
                "plain_english": summary.get("plain_english", ""),
                "for_you": summary.get("for_you", ""),
                "disclaimer": "Educational only, not financial advice."
            },
            "has_causal_chain": True # Mocked as True for the Hackathon demo path always showing the endpoint capabilities
        })

    response = {
        "user_id": user_id,
        "name": profile["name"],
        "risk_appetite": profile["risk_appetite"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "feed": feed,
    }
    cache.set(f"feed:{user_id}", response, ttl_seconds=3600)
    return response
