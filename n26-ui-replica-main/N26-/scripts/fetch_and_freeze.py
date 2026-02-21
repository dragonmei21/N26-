"""
Run ONCE before the demo to pull 40 real news articles and freeze them.
After this runs, the app reads from data/frozen_articles.json — no live API needed.

Usage:
    python scripts/fetch_and_freeze.py

Requires:
    NEWSAPI_KEY in .env
"""

import sys
import json
from pathlib import Path
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent.parent))
load_dotenv()

from ingestion.fetcher import fetch_from_newsapi

OUTPUT_PATH = Path(__file__).parent.parent / "data" / "frozen_articles.json"


def main():
    print("[freeze] Fetching 40 business articles from NewsAPI...")

    articles = fetch_from_newsapi(page_size=40)

    if not articles:
        print("[freeze] ERROR: No articles passed the >200 char filter. Check NEWSAPI_KEY.")
        sys.exit(1)

    OUTPUT_PATH.parent.mkdir(exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(
            [a.model_dump(mode="json") for a in articles],
            f,
            indent=2,
            default=str,
        )

    print(f"[freeze] Saved {len(articles)} articles to {OUTPUT_PATH}")
    print()
    print("--- Articles ---")
    for i, a in enumerate(articles, 1):
        print(f"  {i:2}. [{a.source_name[:20]:20}] {a.title[:70]}")

    print()
    print("Done. data/frozen_articles.json is your demo-safe source.")
    print("Pick 5–8 hero articles (earnings, rate decisions, product launches, geo events).")


if __name__ == "__main__":
    main()
