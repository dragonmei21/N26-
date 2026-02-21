"""
Orchestrates the full ingestion pipeline:
  frozen_articles.json → clean → chunk → embed → ChromaDB

Run this on startup (or after fetch_and_freeze.py).

Usage:
    python scripts/seed_news.py
"""

import sys
from pathlib import Path
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent.parent))
load_dotenv()

from ingestion.fetcher import fetch_articles
from ingestion.cleaner import clean_articles
from ingestion.chunker import chunk_articles
from ingestion.embedder import embed_chunks
from ingestion.indexer import upsert_chunks, get_collection_count, query_similar


def main():
    # 1. Load frozen articles
    print("[seed] Loading frozen articles...")
    articles = fetch_articles()
    print(f"[seed] Loaded {len(articles)} articles")

    # 2. Clean
    print("[seed] Cleaning...")
    articles = clean_articles(articles)

    # 3. Chunk
    print("[seed] Chunking...")
    chunks = chunk_articles(articles)
    print(f"[seed] Created {len(chunks)} chunks from {len(articles)} articles")

    # 4. Embed
    print("[seed] Embedding chunks...")
    embeddings = embed_chunks(chunks)
    print(f"[seed] Generated {len(embeddings)} embeddings")

    # 5. Index
    print("[seed] Upserting into ChromaDB...")
    n = upsert_chunks(chunks, embeddings)
    print(f"[seed] Upserted {n} chunks")
    print(f"[seed] Total chunks in DB: {get_collection_count()}")

    # 6. Sanity check
    print()
    print("[seed] Sanity check — querying 'AI chip demand'...")
    results = query_similar("AI chip demand", k=5)
    for i, r in enumerate(results, 1):
        print(f"  {i}. (score={r['score']:.3f}) [{r['source_name']}] {r['title'][:60]}")
        print(f"     {r['text'][:100]}...")

    print()
    print("[seed] Done. ChromaDB is ready.")


if __name__ == "__main__":
    main()
