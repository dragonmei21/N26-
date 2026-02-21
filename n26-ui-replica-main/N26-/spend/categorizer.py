from collections import defaultdict
from spend.merchant_lookup import lookup


def categorize(transactions: list[dict]) -> dict:
    """
    Group transactions by category, sum amounts, collect merchant names and tickers.
    Returns dict keyed by category.
    """
    categories: dict[str, dict] = defaultdict(lambda: {
        "total_eur": 0.0,
        "merchants": [],
        "tickers": set(),
        "sector": None,
    })

    for tx in transactions:
        cat = tx.get("category", "other")
        merchant = tx.get("merchant", "")
        amount = tx.get("amount", 0.0)

        categories[cat]["total_eur"] += amount
        if merchant not in categories[cat]["merchants"]:
            categories[cat]["merchants"].append(merchant)

        info = lookup(merchant)
        if info:
            categories[cat]["tickers"].update(info.get("tickers", []))
            if not categories[cat]["sector"]:
                categories[cat]["sector"] = info.get("sector")

    # Convert sets to sorted lists for JSON serialisation
    return {
        cat: {
            **data,
            "total_eur": round(data["total_eur"], 2),
            "tickers": sorted(data["tickers"]),
        }
        for cat, data in sorted(
            categories.items(), key=lambda x: x[1]["total_eur"], reverse=True
        )
    }
