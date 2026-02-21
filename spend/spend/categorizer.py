from models.spend import Transaction, CategorizedTransaction
from spend.merchant_lookup import get_categories


def categorize(transactions: list[Transaction]) -> list[CategorizedTransaction]:
    result = []
    for tx in transactions:
        cats = get_categories(tx.merchant)
        result.append(CategorizedTransaction(**tx.model_dump(), categories=cats))
    return result
