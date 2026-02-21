TOPIC_KEYWORDS: dict[str, dict] = {
    "bitcoin":   {"display": "Bitcoin",   "keywords": ["bitcoin", "btc", "crypto", "cryptocurrency"], "color": "#F7931A"},
    "nvidia":    {"display": "NVIDIA",    "keywords": ["nvidia", "nvda", "gpu", "h100", "blackwell"],  "color": "#76B900"},
    "ecb_rates": {"display": "ECB Rates", "keywords": ["ecb", "rate", "interest rate", "basis points", "lagarde"], "color": "#00D4A8"},
    "ai":        {"display": "AI / LLMs", "keywords": ["openai", "chatgpt", "llm", "artificial intelligence", "ai model"], "color": "#6C5CE7"},
    "amazon":    {"display": "Amazon",    "keywords": ["amazon", "aws", "amzn"],                      "color": "#FF9900"},
    "apple":     {"display": "Apple",     "keywords": ["apple", "aapl", "iphone", "vision pro"],      "color": "#555555"},
}


def count_topics(articles: list) -> dict[str, int]:
    """
    Count total keyword mentions per topic across all article titles + content.
    Returns {topic_key: mention_count}.
    """
    counts: dict[str, int] = {topic: 0 for topic in TOPIC_KEYWORDS}

    for article in articles:
        text = ""
        if hasattr(article, "title"):
            text += (article.title or "").lower() + " "
        if hasattr(article, "content"):
            text += (article.content or "").lower()

        for topic, info in TOPIC_KEYWORDS.items():
            for keyword in info["keywords"]:
                counts[topic] += text.count(keyword)

    return counts
