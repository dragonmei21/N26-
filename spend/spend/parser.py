import json
import os
from models.spend import Transaction

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "mock_transactions.json")


def load_transactions(user_id: str) -> list[Transaction]:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    user_data = data.get(user_id)
    if not user_data:
        return []
    return [Transaction(**t) for t in user_data["transactions"]]


def get_user_meta(user_id: str) -> dict:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    user_data = data.get(user_id, {})
    return {
        "name": user_data.get("name", "User"),
        "savings_balance": user_data.get("savings_balance", 0),
    }
