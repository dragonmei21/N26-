from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal


class RawArticle(BaseModel):
    article_id: str
    title: str
    content: str
    url: str
    source_name: str
    published_at: datetime
    category: str


class AISummary(BaseModel):
    plain_english: str
    for_you: str
    confidence: Literal["high", "medium", "low"]
    sources: list[str]
    disclaimer: str = "Educational only, not financial advice."
    reasoning_trace: Optional[str] = None


class VisualizationBlock(BaseModel):
    type: Literal["line_chart", "comparison_bar", "sparkline",
                  "donut_with_arrow", "horizontal_bar", "simple_number", "timeline_with_event"]
    title: str
    data: dict
    annotation: Optional[str] = None
    color: Optional[str] = None


class EnrichedArticle(BaseModel):
    id: str
    title: str
    source_name: str
    source_url: str
    published_at: str
    category: str
    relevance_score: float
    thumbnail_url: Optional[str] = None
    ai_summary: AISummary
    visualization: VisualizationBlock
    tags: list[str]
    is_trending: bool = False
    trend_score: float = 0.0
    has_causal_chain: bool = False
