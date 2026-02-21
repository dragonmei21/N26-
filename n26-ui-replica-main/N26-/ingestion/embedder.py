from sentence_transformers import SentenceTransformer
from ingestion.chunker import Chunk

# Small, fast model — good balance of quality and speed for a hackathon
MODEL_NAME = "all-MiniLM-L6-v2"

# Singleton — load once, reuse across calls
_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print(f"[embedder] Loading model {MODEL_NAME}...")
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_chunks(chunks: list[Chunk]) -> list[list[float]]:
    """Return a list of embedding vectors, one per chunk."""
    model = get_model()
    texts = [c.text for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=32)
    return embeddings.tolist()


def embed_query(query: str) -> list[float]:
    """Embed a single query string for similarity search."""
    model = get_model()
    return model.encode(query).tolist()
