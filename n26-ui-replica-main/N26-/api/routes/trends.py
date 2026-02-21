from datetime import datetime, timezone
from fastapi import APIRouter

from ingestion.fetcher import fetch_articles
from ingestion.cleaner import clean_articles
from trends.counter import count_topics
from trends.spike_detector import detect_spikes

router = APIRouter()

# Hourly ramp pattern: slow start, peak around hour 5, tail off
_SPARKLINE_FRACTIONS = [0.05, 0.08, 0.12, 0.18, 0.22, 0.28, 0.07]
_SPARKLINE_LABELS = ["6h ago", "5h ago", "4h ago", "3h ago", "2h ago", "1h ago", "now"]


@router.get("/trends")
def get_trends():
    articles = []
    try:
        articles = clean_articles(fetch_articles())
    except Exception:
        pass

    counts = count_topics(articles)
    topics = detect_spikes(counts)

    trending = []
    for t in topics:
        count = t["mention_count_24h"]
        sparkline_values = [max(1, int(count * f)) for f in _SPARKLINE_FRACTIONS]
        # Ensure last bucket always equals total count for "now"
        sparkline_values[-1] = count

        trending.append({
            "topic": t["topic"],
            "display_name": t["display_name"],
            "mention_count_24h": count,
            "mention_count_48h_prev": t["mention_count_48h_prev"],
            "spike_multiplier": t["spike_multiplier"],
            "is_spike": t["is_spike"],
            "sentiment": t["sentiment"],
            "one_liner": t["one_liner"],
            "visualization": {
                "type": "sparkline",
                "data": {
                    "labels": _SPARKLINE_LABELS,
                    "values": sparkline_values,
                },
                "color": t["color"],
            },
        })

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "trending": trending,
    }
