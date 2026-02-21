from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from datetime import date
from typing import List, Optional
import json as _json
from pathlib import Path

from rag.event_classifier import classify_event
from rag.causal_chain import generate_causal_chain
from rag.price_correlator import enrich_chain_with_prices
from ingestion.fetcher import fetch_articles
from ingestion.cleaner import clean_articles
from spend.profiler import build_profile

_FALLBACK_CHAIN_PATH = Path(__file__).parent.parent.parent / "data" / "fallback_chain.json"


def _load_fallback_chain(article_id: str) -> list:
    try:
        data = _json.loads(_FALLBACK_CHAIN_PATH.read_text())
        return data.get(article_id, {}).get("chain", [])
    except Exception:
        return []


def _load_fallback_connection(article_id: str) -> str:
    try:
        data = _json.loads(_FALLBACK_CHAIN_PATH.read_text())
        return data.get(article_id, {}).get("user_connection", "This event may affect your investments.")
    except Exception:
        return "This event may affect your investments."

router = APIRouter(prefix="/causal-chain", tags=["Macro Reasoning"])

# --- Models ---
# Repeating Team B API Contract expectations for the Response Model
class TimelineChartData(BaseModel):
    labels: List[str]
    values: List[float]
    event_index: int
    color: str

class EventPriceData(BaseModel):
    type: str = "timeline_with_event"
    title: str
    event_label: str
    data: TimelineChartData

class PricedCausalStep(BaseModel):
    step_number: int
    event: str
    mechanism: str
    affected_entity: str
    entity_type: str
    ticker: Optional[str] = None
    direction: str
    confidence: str
    plain_english: str
    price_data: Optional[EventPriceData] = None
    price_change_pct: Optional[float] = None
    event_date: date

class CausalChainEndpointResponse(BaseModel):
    trigger_event: str
    trigger_date: date
    trigger_source_url: str
    chain: List[PricedCausalStep]
    user_connection: str
    user_relevance_score: float
    summary: str
    disclaimer: str

# --- Endpoints ---
@router.get("/{article_id}", response_model=CausalChainEndpointResponse)
async def get_causal_chain(article_id: str, user_id: str = Query(...)):
    """
    Generates a personalized causal chain for a specific macro news event.
    """
    
    # 1. Fetch article from frozen source
    articles = clean_articles(fetch_articles())
    raw = next((a for a in articles if a.id == article_id), None)

    if not raw:
        raise HTTPException(status_code=404, detail=f"Article {article_id} not found.")

    article = {
        "id": raw.id,
        "title": raw.title,
        "content": raw.content,
        "published_at": raw.published_at.date().isoformat(),
        "url": raw.source_url,
    }

    # 2. Build user profile via spend/profiler
    try:
        profile = build_profile(user_id)
        spend_summary = profile["spend_summary"]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # 3. Classify Event + Generate Causal Chain
    # Wrapped together: any LLM exception triggers the pre-generated fallback chain
    event_info = None
    chain_response = None
    try:
        event_info = classify_event(article["content"], date.fromisoformat(article["published_at"]))

        if not event_info.is_macro:
            raise HTTPException(status_code=400, detail="Article is not a macro event capable of generating a causal chain.")

        chain_response = generate_causal_chain(
            article_title=article["title"],
            article_chunks=article["content"],
            published_at=article["published_at"],
            spend_summary=spend_summary
        )
    except HTTPException:
        raise
    except Exception:
        chain_response = None

    # If LLM failed or returned no steps, serve the pre-generated fallback chain
    if chain_response is None or not chain_response.chain:
        fallback_steps = _load_fallback_chain(article_id)
        if fallback_steps:
            return CausalChainEndpointResponse(
                trigger_event=article["title"],
                trigger_date=event_info.event_date if event_info else date.fromisoformat(article["published_at"]),
                trigger_source_url=article["url"],
                chain=fallback_steps,
                user_connection=_load_fallback_connection(article_id),
                user_relevance_score=0.85,
                summary=f"Analysis of {article['title']} mapped to your spend profile.",
                disclaimer="Educational only, not financial advice."
            )
        raise HTTPException(status_code=404, detail="Could not derive a confident causal chain.")

    # 5. Connect and Enrich with Prices
    priced_chain = enrich_chain_with_prices(
        chain=chain_response.chain, 
        event_date=event_info.event_date,
        trigger_event_label=event_info.category
    )

    # 6. Format Final Response
    return CausalChainEndpointResponse(
        trigger_event=article["title"],
        trigger_date=event_info.event_date,
        trigger_source_url=article["url"],
        chain=priced_chain,
        user_connection=chain_response.user_connection,
        user_relevance_score=0.85, # Mock relevance score for UI
        summary=f"Analysis of {article['title']} mapped to your spend profile.",
        disclaimer="Educational only, not financial advice."
    )
