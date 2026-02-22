import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from audio.script_generator import generate_podcast_script
from audio.tts_engine import generate_audio
from audio.progress_tracker import save_progress, get_progress, should_send_notification
from models.podcast import PodcastMetadata
from cache.store import cache
from spend.parser import get_user_portfolio, get_user_meta

router = APIRouter(prefix="/podcast", tags=["podcast"])


@router.post("/generate", response_model=PodcastMetadata)
async def generate_podcast(
    user_id: str,
    length: Literal["flash", "brief", "deep_dive"],
    mode: Literal["personal", "macro"]
):
    # Reuse already-cached feed/trends — no new fetches
    feed = cache.get(f"feed:{user_id}") or {}
    trends = cache.get("trends:current") or {}

    # Portfolio: read directly from data file so it's always available
    # (cache fallback kept for any future enrichment like live price changes)
    cached_portfolio = cache.get(f"portfolio:{user_id}")
    if cached_portfolio:
        portfolio = cached_portfolio
    else:
        raw = get_user_portfolio(user_id)
        meta = get_user_meta(user_id)
        portfolio = {**raw, "name": meta["name"], "risk_appetite": meta["risk_appetite"]}

    script = await generate_podcast_script(
        length=length,
        mode=mode,
        feed_articles=feed.get("feed", []),
        trends=trends.get("trending", []),
        portfolio=portfolio,
        user_name=portfolio.get("name", "there")
    )

    podcast_id = str(uuid.uuid4())[:8]
    audio_text = f"Hello and welcome to the N26 Financial Briefing. {script.full_text}"
    await generate_audio(audio_text, user_id, podcast_id)

    metadata = PodcastMetadata(
        podcast_id=podcast_id,
        user_id=user_id,
        length=length,
        mode=mode,
        title=f"Your {length.replace('_', ' ').title()} — {date.today().strftime('%b %d')}",
        estimated_duration_sec=script.estimated_duration_sec,
        audio_url=f"/podcast/{podcast_id}/stream",
        created_at=datetime.utcnow().isoformat()
    )

    cache.set(f"podcast_meta:{podcast_id}", metadata.model_dump(), ttl_seconds=86400)
    return metadata


@router.get("/{podcast_id}/stream")
async def stream_podcast(podcast_id: str):
    files = list(Path("/tmp/audio").glob(f"*_{podcast_id}.mp3"))
    if not files:
        raise HTTPException(404, "Podcast not found or expired")
    return FileResponse(str(files[0]), media_type="audio/mpeg",
                        headers={"Accept-Ranges": "bytes"})


@router.post("/{podcast_id}/progress")
async def update_progress(podcast_id: str, user_id: str, position_seconds: int):
    meta = cache.get(f"podcast_meta:{podcast_id}")
    if not meta:
        raise HTTPException(404, "Podcast not found")
    save_progress(user_id, podcast_id, position_seconds, meta["estimated_duration_sec"])
    return {"ok": True}


@router.get("/{podcast_id}/notification-check")
async def notification_check(podcast_id: str, user_id: str):
    if not should_send_notification(user_id, podcast_id):
        return {"send_notification": False}

    progress = get_progress(user_id, podcast_id)
    return {
        "send_notification": True,
        "title": "You left something unfinished",
        "body": f"You were {round(progress['pct_complete'])}% through your financial briefing. We saved your spot.",
        "deep_link": f"n26://podcast/{podcast_id}?resume=true",
        "resume_position_seconds": progress["position_seconds"]
    }
