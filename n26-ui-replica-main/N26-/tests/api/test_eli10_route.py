from fastapi.testclient import TestClient
from unittest.mock import patch

from api.main import app

client = TestClient(app)


@patch("api.routes.eli10.complete")
def test_eli10_returns_correct_shape(mock_complete):
    mock_complete.return_value = '{"eli10": "Interest rate is how much extra you pay to borrow money.", "real_world_example": "If you borrow €100, you pay back €103 — that €3 is the interest.", "related_concepts": ["inflation", "bond", "savings_account"]}'

    res = client.get("/eli10/interest_rate")

    assert res.status_code == 200
    data = res.json()
    assert data["concept"] == "interest_rate"
    assert "eli10" in data
    assert "real_world_example" in data
    assert "related_concepts" in data
    assert isinstance(data["related_concepts"], list)
    assert "visualization" in data


@patch("api.routes.eli10.complete")
def test_eli10_hardcoded_viz_for_known_concept(mock_complete):
    mock_complete.return_value = '{"eli10": "Inflation means things get more expensive over time.", "real_world_example": "A coffee that cost €2 last year costs €2.05 today.", "related_concepts": ["interest_rate", "purchasing_power"]}'

    res = client.get("/eli10/inflation")

    assert res.status_code == 200
    viz = res.json()["visualization"]
    # Inflation has a hardcoded visualization override
    assert viz["type"] == "simple_number"
    assert viz["value"] == 2.8


def test_eli10_cache_hit_skips_llm():
    """Second call for same concept must not call complete() again."""
    import api.routes.eli10 as eli10_module

    # Pre-seed the cache
    eli10_module._cache["cached_concept"] = {
        "concept": "cached_concept",
        "eli10": "cached explanation",
        "real_world_example": "cached example",
        "related_concepts": [],
        "visualization": {"type": "simple_number", "label": "cached_concept", "value": 0, "unit": "", "comparison": None},
    }

    with patch("api.routes.eli10.complete") as mock_complete:
        res = client.get("/eli10/cached_concept")
        mock_complete.assert_not_called()

    assert res.status_code == 200
    assert res.json()["eli10"] == "cached explanation"


@patch("api.routes.eli10.complete")
def test_eli10_fallback_on_bad_llm_response(mock_complete):
    mock_complete.return_value = "not json"

    res = client.get("/eli10/some_concept")

    assert res.status_code == 200
    data = res.json()
    assert data["eli10"] != ""  # fallback text must be non-empty
