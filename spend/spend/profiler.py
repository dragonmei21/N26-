from datetime import datetime, date, timedelta
from models.spend import WeightedInterestProfile, SpendContext, CategorizedTransaction


def build_profile(user_id: str, transactions: list[CategorizedTransaction]) -> WeightedInterestProfile:
    now = date.today()
    category_weights: dict[str, float] = {}
    spend_context: list[SpendContext] = []

    for tx in transactions:
        if tx.amount >= 0:
            continue
        amount = abs(tx.amount)
        # Recent transactions weighted 2x
        days_old = (now - tx.date).days if isinstance(tx.date, date) else 30
        recency_factor = 2.0 if days_old <= 7 else 1.0

        for cat in tx.categories:
            category_weights[cat] = category_weights.get(cat, 0) + amount * recency_factor

        spend_context.append(SpendContext(
            category=tx.categories[0] if tx.categories else "other",
            amount_eur=amount,
            merchant=tx.merchant,
            period="last_30d",
        ))

    if category_weights:
        max_weight = max(category_weights.values())
        interests = {k: round(v / max_weight, 3) for k, v in category_weights.items()}
    else:
        interests = {}

    return WeightedInterestProfile(
        user_id=user_id,
        interests=interests,
        spend_context=spend_context,
        computed_at=datetime.utcnow(),
    )


def build_spend_summary(profile: WeightedInterestProfile) -> str:
    top = sorted(profile.interests.items(), key=lambda x: x[1], reverse=True)[:5]
    categories = ", ".join(f"{k} ({v:.0%})" for k, v in top)
    merchants = list({ctx.merchant for ctx in profile.spend_context[:5]})
    return f"Top spending categories: {categories}. Recent merchants: {', '.join(merchants)}."
