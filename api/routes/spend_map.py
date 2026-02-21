from fastapi import APIRouter, HTTPException, Query

from spend.profiler import build_profile

router = APIRouter()

# Category → investment instrument mapping
CATEGORY_TO_INSTRUMENT = {
    "groceries":     {"name": "Consumer Staples Select SPDR ETF", "ticker": "XLP",  "performance_1y": 6.2,  "what_it_means": "The supermarkets and food brands you shop at are publicly traded. This ETF owns all of them."},
    "ecommerce":     {"name": "Invesco QQQ Trust",                "ticker": "QQQ",  "performance_1y": 18.4, "what_it_means": "The platforms you shop on power this index. Your spending habits are already driving their revenue."},
    "travel":        {"name": "iShares Global Airlines ETF",      "ticker": "JETS", "performance_1y": 14.2, "what_it_means": "You buy tickets from these airlines. You could also own a slice of the airline."},
    "subscriptions": {"name": "Communication Services ETF",       "ticker": "XLC",  "performance_1y": 22.1, "what_it_means": "Netflix, Spotify, and the apps you pay monthly are inside this ETF."},
    "tech":          {"name": "iShares Semiconductor ETF",        "ticker": "SOXX", "performance_1y": 28.3, "what_it_means": "The chips inside every Apple and Amazon device you use are made by companies in this ETF."},
    "crypto":        {"name": "ProShares Bitcoin Strategy ETF",   "ticker": "BITO", "performance_1y": 45.1, "what_it_means": "You already use crypto exchanges. This ETF gives regulated Bitcoin exposure through your broker."},
    "investing":     {"name": "Goldman Sachs Group Inc.",         "ticker": "GS",   "performance_1y": 31.4, "what_it_means": "You invest through platforms backed by financial giants. You can also invest in the giants themselves."},
    "clothing":      {"name": "SPDR S&P Retail ETF",              "ticker": "XRT",  "performance_1y": 9.8,  "what_it_means": "The fashion brands you buy from are publicly traded. This ETF tracks the whole retail sector."},
    "home":          {"name": "iShares U.S. Home Construction ETF","ticker": "ITB",  "performance_1y": 12.1, "what_it_means": "Home goods companies you shop at — from IKEA suppliers to furniture brands — are in this index."},
    "food_drink":    {"name": "Invesco Dynamic Food & Beverage",  "ticker": "PBJ",  "performance_1y": 7.4,  "what_it_means": "The coffee chains and food brands you visit daily are publicly traded. This ETF bundles them together."},
    "transport":     {"name": "iShares Transportation Avg ETF",   "ticker": "IYT",  "performance_1y": 11.5, "what_it_means": "The trains and metro systems you use are backed by infrastructure companies tracked in this ETF."},
}


@router.get("/spend-map")
def get_spend_map(user_id: str = Query(..., description="mock_user_1 or mock_user_2")):
    try:
        profile = build_profile(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    categories = profile["categories"]
    mappings = []
    total_spend_mapped = 0.0
    theoretical_gain = 0.0

    for category, data in categories.items():
        instrument = CATEGORY_TO_INSTRUMENT.get(category)
        if not instrument or data["total_eur"] <= 0:
            continue

        spend_eur = data["total_eur"]
        total_spend_mapped += spend_eur
        theoretical_gain += spend_eur * (instrument["performance_1y"] / 100)

        perf_str = f"+{instrument['performance_1y']}%" if instrument["performance_1y"] >= 0 else f"{instrument['performance_1y']}%"

        mappings.append({
            "spend_category": category,
            "spend_amount_eur_30d": round(spend_eur, 2),
            "merchant_examples": data["merchants"][:3],
            "related_instruments": [
                {
                    "name": instrument["name"],
                    "ticker": instrument["ticker"],
                    "performance_1y": perf_str,
                    "what_it_means": instrument["what_it_means"],
                    "minimum_invest_eur": 50,
                }
            ],
            "visualization": {
                "type": "donut_with_arrow",
                "spend_label": f"Your {category} spend",
                "spend_value": round(spend_eur, 2),
                "instrument_label": f"{instrument['ticker']} 1Y return",
                "instrument_value": instrument["performance_1y"],
                "color": "#00D4A8",
            },
        })

    return {
        "user_id": user_id,
        "mappings": mappings,
        "total_spend_mapped_eur": round(total_spend_mapped, 2),
        "insight": (
            f"You spent €{total_spend_mapped:.0f} last month. "
            f"If you had invested equivalent amounts in related ETFs 1 year ago, "
            f"your theoretical gain would be ~€{theoretical_gain:.0f}."
        ),
    }
