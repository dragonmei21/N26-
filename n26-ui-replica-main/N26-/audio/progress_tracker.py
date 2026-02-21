from datetime import datetime
from cache.store import cache


def save_progress(user_id: str, podcast_id: str, position_sec: int, total_sec: int):
    pct = (position_sec / total_sec) * 100
    cache.set(f"podcast_progress:{user_id}:{podcast_id}", {
        "position_seconds": position_sec,
        "total_seconds": total_sec,
        "pct_complete": round(pct, 1),
        "updated_at": datetime.utcnow().isoformat(),
        "finished": pct >= 90
    }, ttl_seconds=86400)


def get_progress(user_id: str, podcast_id: str) -> dict | None:
    return cache.get(f"podcast_progress:{user_id}:{podcast_id}")


def should_send_notification(user_id: str, podcast_id: str) -> bool:
    p = get_progress(user_id, podcast_id)
    if not p or p["finished"] or p["pct_complete"] < 10:
        return False
    hours_since = (datetime.utcnow() - datetime.fromisoformat(p["updated_at"])).seconds / 3600
    return hours_since >= 2
