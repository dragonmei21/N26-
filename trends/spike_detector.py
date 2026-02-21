from trends.counter import TOPIC_KEYWORDS


def detect_spikes(counts: dict[str, int]) -> list[dict]:
    """
    Build a sorted list of topic dicts with spike metadata.
    spike_multiplier = count / max(1, count // 3)  — relative intensity proxy.
    is_spike = spike_multiplier >= 2.0
    Returns only topics with at least 1 mention, sorted by count desc.
    """
    results = []

    for topic, count in counts.items():
        if count == 0:
            continue

        info = TOPIC_KEYWORDS.get(topic, {})
        display = info.get("display", topic)
        baseline = max(1, count // 3)
        spike_multiplier = round(count / baseline, 2)

        results.append({
            "topic": topic,
            "display_name": display,
            "mention_count_24h": count,
            "mention_count_48h_prev": max(1, count // 2),  # simulated prior window
            "spike_multiplier": spike_multiplier,
            "is_spike": spike_multiplier >= 2.0,
            "sentiment": "positive",
            "one_liner": f"{display} mentioned {count}x in today's news",
            "color": info.get("color", "#00D4A8"),
        })

    return sorted(results, key=lambda x: x["mention_count_24h"], reverse=True)
