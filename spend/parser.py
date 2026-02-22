import json
from pathlib import Path

TRANSACTIONS_PATH = Path(__file__).parent.parent / "data" / "mock_transactions.json"

_data: dict | None = None


def _load() -> dict:
    global _data
    if _data is None:
        with open(TRANSACTIONS_PATH) as f:
            _data = json.load(f)
    return _data


def get_user_transactions(user_id: str) -> list[dict]:
    """Return raw transaction list for a user_id."""
    data = _load()
    user = data.get(user_id)
    if not user:
        raise ValueError(f"Unknown user_id: {user_id}. Available: {list(data.keys())}")
    return user["transactions"]


def get_user_meta(user_id: str) -> dict:
    """Return name, risk_appetite, savings_balance for a user."""
    data = _load()
    user = data.get(user_id)
    if not user:
        raise ValueError(f"Unknown user_id: {user_id}")
    return {
        "name": user["name"],
        "risk_appetite": user["risk_appetite"],
        "savings_balance_eur": user["savings_balance_eur"],
    }


def get_user_portfolio(user_id: str) -> dict:
    """Return portfolio positions for a user."""
    data = _load()
    user = data.get(user_id)
    if not user:
        raise ValueError(f"Unknown user_id: {user_id}")
    return user.get("portfolio", {"positions": []})


def list_user_ids() -> list[str]:
    return list(_load().keys())
