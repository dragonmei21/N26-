from spend.parser import get_user_transactions, get_user_meta
from spend.categorizer import categorize


def build_profile(user_id: str) -> dict:
    """
    Build a full spend profile for a user.
    Returns structured dict used by the RAG / causal chain engine.
    """
    meta = get_user_meta(user_id)
    transactions = get_user_transactions(user_id)
    categories = categorize(transactions)

    total_spend = sum(c["total_eur"] for c in categories.values())

    # Flatten all tickers from all categories (deduped, ordered by spend)
    all_tickers: list[str] = []
    seen = set()
    for cat_data in categories.values():
        for ticker in cat_data["tickers"]:
            if ticker not in seen:
                seen.add(ticker)
                all_tickers.append(ticker)

    # Human-readable spend summary for LLM prompts
    top_cats = list(categories.items())[:4]
    spend_lines = [
        f"€{d['total_eur']:.0f} on {cat.replace('_', ' ')} ({', '.join(d['merchants'][:2])})"
        for cat, d in top_cats
    ]
    spend_summary = (
        f"{meta['name']} spent €{total_spend:.0f} this month. "
        f"Top categories: {'; '.join(spend_lines)}. "
        f"Risk appetite: {meta['risk_appetite']}. "
        f"Savings balance: €{meta['savings_balance_eur']:,.0f}."
    )

    return {
        "user_id": user_id,
        "name": meta["name"],
        "risk_appetite": meta["risk_appetite"],
        "savings_balance_eur": meta["savings_balance_eur"],
        "total_spend_eur": round(total_spend, 2),
        "categories": categories,
        "ticker_interests": all_tickers,
        "spend_summary": spend_summary,   # injected into LLM prompts
    }
