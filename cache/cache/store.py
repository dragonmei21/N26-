import time
from typing import Any, Optional


class TTLCache:
    def __init__(self):
        self._store: dict = {}

    def set(self, key: str, value: Any, ttl_seconds: int = 3600):
        self._store[key] = {
            "value": value,
            "expires_at": time.time() + ttl_seconds,
        }

    def get(self, key: str) -> Optional[Any]:
        item = self._store.get(key)
        if not item:
            return None
        if time.time() > item["expires_at"]:
            del self._store[key]
            return None
        return item["value"]

    def delete(self, key: str):
        self._store.pop(key, None)

    def clear(self):
        self._store.clear()


cache = TTLCache()
