import httpx
import sys

BASE = "http://localhost:8000"
USERS = ["mock_user_1", "mock_user_2"]
HERO_IDS = [
    "4a78a6cfdc3be77a",
    "937b0457b2a098e0",
    "130268006d14a68d",
    "20fe422209448409",
]


def warm(base: str = BASE) -> None:
    for user in USERS:
        for ep in [
            f"/feed?user_id={user}",
            f"/spend-map?user_id={user}",
            f"/tip?user_id={user}",
        ]:
            httpx.get(f"{base}{ep}", timeout=30)
        for aid in HERO_IDS:
            httpx.get(f"{base}/causal-chain/{aid}?user_id={user}", timeout=30)

    httpx.get(f"{base}/trends", timeout=30)

    for concept in ["interest_rate", "inflation", "etf", "dividend"]:
        httpx.get(f"{base}/eli10/{concept}", timeout=30)

    print("Cache warmed.")


if __name__ == "__main__":
    warm(sys.argv[1] if len(sys.argv) > 1 else BASE)
