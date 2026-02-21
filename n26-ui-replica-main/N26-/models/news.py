from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
import hashlib


class RawArticle(BaseModel):
    id: str                          # sha256 of url — stable dedup key
    title: str
    source_name: str
    source_url: str
    published_at: datetime
    content: str                     # full cleaned text
    thumbnail_url: Optional[str] = None
    category: str = "business"

    @classmethod
    def from_newsapi(cls, item: dict, category: str = "business") -> "RawArticle":
        url = item.get("url", "")
        title = item.get("title", "").strip()

        # NewsAPI free tier truncates `content` at ~200 chars with "[+N chars]"
        # Combine description + content to maximise text; strip the truncation suffix
        description = item.get("description") or ""
        raw_content = item.get("content") or ""
        # Remove "[+XXXX chars]" truncation marker
        if "[+" in raw_content:
            raw_content = raw_content[:raw_content.rfind("[+")].strip()

        # Build the richest possible content string
        parts = [p.strip() for p in [description, raw_content] if p.strip()]
        content = " ".join(parts) or title  # absolute fallback: at least the title

        return cls(
            id=hashlib.sha256(url.encode()).hexdigest()[:16],
            title=title,
            source_name=item.get("source", {}).get("name", "Unknown"),
            source_url=url,
            published_at=datetime.fromisoformat(
                item["publishedAt"].replace("Z", "+00:00")
            ),
            content=content,
            thumbnail_url=item.get("urlToImage"),
            category=category,
        )
