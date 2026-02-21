from pathlib import Path
import chromadb
from ingestion.chunker import Chunk
from ingestion.embedder import embed_query

DB_PATH = str(Path(__file__).parent.parent / "chroma_db")
COLLECTION_NAME = "news_chunks"

# Singleton client + collection
_client = None
_collection = None


def get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=DB_PATH)
        _collection = _client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def upsert_chunks(chunks: list[Chunk], embeddings: list[list[float]]) -> int:
    """
    Upsert chunks into ChromaDB. Returns number of chunks upserted.
    Deduplication is handled by chunk_id as the document ID.
    """
    collection = get_collection()

    ids = [c.chunk_id for c in chunks]
    documents = [c.text for c in chunks]
    metadatas = [
        {
            "article_id": c.article_id,
            "chunk_index": c.chunk_index,
            "total_chunks": c.total_chunks,
            "title": c.title,
            "source_name": c.source_name,
            "source_url": c.source_url,
            "published_at": c.published_at,
            "category": c.category,
        }
        for c in chunks
    ]

    # Upsert in batches of 100 to avoid memory issues
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        collection.upsert(
            ids=ids[i:i + batch_size],
            documents=documents[i:i + batch_size],
            embeddings=embeddings[i:i + batch_size],
            metadatas=metadatas[i:i + batch_size],
        )

    return len(chunks)


def query_similar(query: str, k: int = 5, category: str | None = None) -> list[dict]:
    """
    Semantic search over indexed chunks.
    Returns list of dicts with text + metadata.
    """
    collection = get_collection()
    query_embedding = embed_query(query)

    where = {"category": category} if category else None

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k,
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    output = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        output.append({
            "text": doc,
            "score": round(1 - dist, 4),   # cosine distance → similarity
            **meta,
        })

    return output


def get_collection_count() -> int:
    return get_collection().count()
