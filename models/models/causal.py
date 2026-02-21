from pydantic import BaseModel
from typing import Optional, Literal
from datetime import date


class CausalStep(BaseModel):
    step_number: int
    event: str
    mechanism: str
    affected_entity: str
    entity_type: Literal["company", "sector", "commodity", "currency", "index"]
    ticker: Optional[str]
    direction: Literal["up", "down", "neutral"]
    confidence: Literal["high", "medium", "low"]
    plain_english: str
    plain_english_eli10: str


class PriceData(BaseModel):
    type: str = "timeline_with_event"
    title: str
    event_label: str
    data: dict


class PricedCausalStep(CausalStep):
    price_data: Optional[PriceData] = None
    price_change_pct: Optional[float] = None
    event_date: str


class CausalChainResponse(BaseModel):
    trigger_event: str
    trigger_date: str
    trigger_source_url: str
    chain: list[PricedCausalStep]
    user_connection: str
    user_connection_eli10: str
    user_relevance_score: float
    summary: str
    summary_eli10: str
    disclaimer: str
    summary_bullets: list[str]
    summary_bullets_eli10: list[str]
