import json
from fastapi import APIRouter

from rag.llm_client import complete

router = APIRouter()

# In-memory cache — avoids re-hitting LLM for same concept during demo
_cache: dict[str, dict] = {}

# Hardcoded visualizations for the concepts most likely to appear in demo
_VIZ_OVERRIDES = {
    "interest_rate": {
        "type": "simple_number",
        "label": "Your current N26 savings rate",
        "value": 2.5,
        "unit": "%",
        "comparison": {"label": "ECB base rate", "value": 3.5},
    },
    "inflation": {
        "type": "simple_number",
        "label": "Current EU inflation rate",
        "value": 2.8,
        "unit": "%",
        "comparison": {"label": "ECB target", "value": 2.0},
    },
    "etf": {
        "type": "simple_number",
        "label": "Avg ETF annual return (S&P 500, 10yr)",
        "value": 10.5,
        "unit": "%",
        "comparison": {"label": "Average savings account", "value": 2.5},
    },
    "dividend": {
        "type": "simple_number",
        "label": "Avg dividend yield (EU stocks)",
        "value": 3.2,
        "unit": "%",
        "comparison": {"label": "ECB base rate", "value": 3.5},
    },
    "bitcoin": {
        "type": "simple_number",
        "label": "Bitcoin 1Y return",
        "value": 112.0,
        "unit": "%",
        "comparison": {"label": "S&P 500 1Y return", "value": 24.0},
    },
}

_RELATED: dict[str, list[str]] = {
    "interest_rate": ["inflation", "savings_account", "bond", "ecb"],
    "inflation":     ["interest_rate", "purchasing_power", "bond", "commodities"],
    "etf":           ["index_fund", "diversification", "dividend", "stock"],
    "dividend":      ["etf", "stock", "yield", "reinvestment"],
    "bitcoin":       ["crypto", "etf", "volatility", "blockchain"],
    "bond":          ["interest_rate", "yield", "duration", "credit_rating"],
    "stock":         ["equity", "dividend", "etf", "market_cap"],
}


def _parse(raw: str) -> dict | None:
    try:
        return json.loads(raw)
    except Exception:
        return None


@router.get("/eli10/{concept}")
def get_eli10(concept: str):
    key = concept.lower().strip().replace(" ", "_").replace("-", "_")

    if key in _cache:
        return _cache[key]

    prompt = f"""You are a financial educator explaining concepts to a 10-year-old.

Concept: "{concept}"

Explain it in 1 simple sentence a child can understand. Give 1 real-world example involving everyday spending or money (max 25 words each).

Respond ONLY with valid JSON:
{{"eli10": "explanation here", "real_world_example": "example here", "related_concepts": ["concept1", "concept2", "concept3"]}}"""

    raw = complete(prompt, temperature=0.3, max_tokens=250)
    data = _parse(raw)

    if not data or "eli10" not in data:
        data = {
            "eli10": f"{concept.replace('_', ' ').title()} is a key financial concept that affects how money grows and moves in the economy.",
            "real_world_example": "When you save money in a bank account, this concept determines how much extra money you earn over time.",
            "related_concepts": _RELATED.get(key, ["savings", "investing", "economy"]),
        }

    visualization = _VIZ_OVERRIDES.get(key, {
        "type": "simple_number",
        "label": concept.replace("_", " ").title(),
        "value": 0,
        "unit": "",
        "comparison": None,
    })

    result = {
        "concept": key,
        "eli10": data.get("eli10", ""),
        "real_world_example": data.get("real_world_example", ""),
        "related_concepts": data.get("related_concepts", _RELATED.get(key, [])),
        "visualization": visualization,
    }

    _cache[key] = result
    return result
