from pydantic import BaseModel
from typing import Literal


class PodcastSegment(BaseModel):
    name: str
    text: str
    word_count: int
    estimated_duration_sec: int


class PodcastScript(BaseModel):
    length: Literal["flash", "brief", "deep_dive"]
    mode: Literal["personal", "macro"]
    segments: list[PodcastSegment]
    total_words: int
    estimated_duration_sec: int
    full_text: str


class PodcastMetadata(BaseModel):
    podcast_id: str
    user_id: str
    length: str
    mode: str
    title: str
    estimated_duration_sec: int
    audio_url: str
    created_at: str
    progress_pct: float = 0.0
    finished: bool = False
