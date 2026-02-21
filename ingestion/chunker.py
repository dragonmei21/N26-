from dataclasses import dataclass
from models.news import RawArticle

CHUNK_SIZE = 300    # target tokens (approximated as words)
CHUNK_OVERLAP = 50  # overlap tokens between consecutive chunks

# 1 token ≈ 0.75 words (rough approximation, good enough for retrieval)
WORDS_PER_TOKEN = 0.75
CHUNK_WORDS = int(CHUNK_SIZE * WORDS_PER_TOKEN)       # ~225 words
OVERLAP_WORDS = int(CHUNK_OVERLAP * WORDS_PER_TOKEN)  # ~37 words


@dataclass
class Chunk:
    chunk_id: str        # "{article_id}_chunk_{n}"
    article_id: str
    text: str
    chunk_index: int
    total_chunks: int
    # metadata passed through for retrieval
    title: str
    source_name: str
    source_url: str
    published_at: str
    category: str


def chunk_article(article: RawArticle) -> list[Chunk]:
    """Split article content into overlapping word-based chunks."""
    words = article.content.split()

    if not words:
        return []

    chunks = []
    start = 0
    index = 0

    while start < len(words):
        end = start + CHUNK_WORDS
        chunk_words = words[start:end]
        text = " ".join(chunk_words)

        chunks.append(Chunk(
            chunk_id=f"{article.id}_chunk_{index}",
            article_id=article.id,
            text=text,
            chunk_index=index,
            total_chunks=0,   # filled in after we know the total
            title=article.title,
            source_name=article.source_name,
            source_url=article.source_url,
            published_at=str(article.published_at),
            category=article.category,
        ))

        start = end - OVERLAP_WORDS
        index += 1

    # Back-fill total_chunks
    total = len(chunks)
    for c in chunks:
        c.total_chunks = total

    return chunks


def chunk_articles(articles: list[RawArticle]) -> list[Chunk]:
    all_chunks = []
    for article in articles:
        all_chunks.extend(chunk_article(article))
    return all_chunks
