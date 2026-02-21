from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from api.main import app

client = TestClient(app)


@patch("api.routes.tip.complete")
@patch("api.routes.tip.fetch_articles")
@patch("api.routes.tip.build_profile")
def test_tip_returns_correct_shape(mock_profile, mock_fetch, mock_complete):
    mock_profile.return_value = {
        "spend_summary": "Alex spent €450 this month on groceries and transport.",
        "savings_balance_eur": 3200,
        "risk_appetite": "low",
    }
    mock_article = MagicMock()
    mock_article.title = "ECB holds rates at 3.5%"
    mock_fetch.return_value = [mock_article]
    mock_complete.return_value = '{"text": "Keep savings in N26 Instant Savings for best yield.", "category": "savings", "urgency": "low", "potential_gain_eur": 18, "based_on": ["ecb_rate_hold"]}'

    res = client.get("/tip?user_id=mock_user_1")

    assert res.status_code == 200
    data = res.json()
    assert "tip" in data
    tip = data["tip"]
    assert "text" in tip
    assert "category" in tip
    assert "urgency" in tip
    assert "potential_gain_eur" in tip
    assert "cta" in tip
    assert tip["cta"]["deep_link"] == "n26://savings/instant"


@patch("api.routes.tip.complete")
@patch("api.routes.tip.fetch_articles")
@patch("api.routes.tip.build_profile")
def test_tip_uses_fallback_on_bad_llm_response(mock_profile, mock_fetch, mock_complete):
    mock_profile.return_value = {
        "spend_summary": "Marco spent €1200 on tech and crypto.",
        "savings_balance_eur": 800,
        "risk_appetite": "high",
    }
    mock_fetch.return_value = []
    mock_complete.return_value = "not valid json at all"

    res = client.get("/tip?user_id=mock_user_2")

    assert res.status_code == 200
    tip = res.json()["tip"]
    # Fallback for "high" risk should be investing-related
    assert tip["text"] != ""
    assert tip["category"] in ("savings", "investing", "crypto", "spending")


@patch("api.routes.tip.build_profile")
def test_tip_unknown_user_returns_404(mock_profile):
    mock_profile.side_effect = ValueError("User not found")

    res = client.get("/tip?user_id=nobody")

    assert res.status_code == 404
