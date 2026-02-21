import time
from typing import Any

class _TTLCache:
    """Simple in-memory TTL cache. No external dependencies."""

    def __init__(self):
        self._store: dict[str, tuple[Any, float]] = {}  # key → (value, expires_at)

    def set(self, key: str, value: Any, ttl_seconds: int = 3600):
        self._store[key] = (value, time.time() + ttl_seconds)

    def get(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.time() > expires_at:
            del self._store[key]
            return None
        return value

    def delete(self, key: str):
        self._store.pop(key, None)


cache = _TTLCache()
