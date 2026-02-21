from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class Transaction(BaseModel):
    id: str
    date: date
    merchant: str
    amount: float
    currency: str = "EUR"
    category_raw: str


class CategorizedTransaction(Transaction):
    categories: list[str]


class SpendContext(BaseModel):
    category: str
    amount_eur: float
    merchant: str
    period: str = "last_30d"


class WeightedInterestProfile(BaseModel):
    user_id: str
    interests: dict[str, float]
    spend_context: list[SpendContext]
    computed_at: datetime
