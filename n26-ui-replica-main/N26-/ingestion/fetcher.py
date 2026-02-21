import os
import json
import httpx
from pathlib import Path

from models.news import RawArticle

NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
NEWSAPI_EVERYTHING = "https://newsapi.org/v2/everything"
FROZEN_PATH = Path(__file__).parent.parent / "data" / "frozen_articles.json"

MIN_CONTENT_LENGTH = 80   # free tier truncates content; description fills the gap

# Trusted financial news sources (NewsAPI source IDs)
FINANCIAL_SOURCES = ",".join([
    "reuters",
    "bloomberg",
    "cnbc",
    "financial-times",
    "the-wall-street-journal",
    "fortune",
    "business-insider",
    "marketwatch",
])

# Keyword queries — each targets a different part of the causal chain demo
FINANCIAL_QUERIES = [
    "earnings revenue profit stock market",
    "Federal Reserve ECB interest rate inflation",
    "NVIDIA AMD AI chips semiconductor",
    "Bitcoin Ethereum crypto ETF",
    "Amazon Apple Microsoft Google tech results",
    "oil energy commodity gold market",
]


def fetch_from_newsapi(page_size: int = 40) -> list[RawArticle]:
    """
    Pull financial news via NewsAPI /everything endpoint.
    Combines trusted sources filter + financial keyword queries.
    Deduplicates and returns up to page_size articles.
    """
    if not NEWSAPI_KEY:
        raise RuntimeError("NEWSAPI_KEY not set in .env")

    seen_urls: set[str] = set()
    all_articles: list[RawArticle] = []

    with httpx.Client(timeout=15) as client:
        for query in FINANCIAL_QUERIES:
            if len(all_articles) >= page_size:
                break

            params = {
                "q": query,
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 15,          # 15 per query × 6 queries = up to 90 candidates
                "apiKey": NEWSAPI_KEY,
            }

            try:
                resp = client.get(NEWSAPI_EVERYTHING, params=params)
                resp.raise_for_status()
                data = resp.json()
            except Exception as e:
                print(f"[fetcher] Query '{query[:40]}' failed: {e}")
                continue

            for item in data.get("articles", []):
                url = item.get("url", "")
                if not url or url in seen_urls:
                    continue

                try:
                    article = RawArticle.from_newsapi(item, category="financial")
                    if len(article.content) >= MIN_CONTENT_LENGTH and article.title:
                        seen_urls.add(url)
                        all_articles.append(article)
                except Exception:
                    continue

    return all_articles[:page_size]


def load_from_frozen() -> list[RawArticle]:
    """Load the hardcoded frozen articles from disk (primary source during demo)."""
    if not FROZEN_PATH.exists():
        raise FileNotFoundError(
            f"Frozen articles not found at {FROZEN_PATH}. "
            "Run: python scripts/fetch_and_freeze.py"
        )
    with open(FROZEN_PATH) as f:
        raw = json.load(f)
    return [RawArticle(**item) for item in raw]


def fetch_articles() -> list[RawArticle]:
    """
    Primary entry point for the pipeline.
    Always loads from the frozen JSON — stable and demo-safe.
    """
    return load_from_frozen()
