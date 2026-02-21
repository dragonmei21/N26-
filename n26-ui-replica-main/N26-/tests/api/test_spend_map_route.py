from fastapi.testclient import TestClient
from unittest.mock import patch

from api.main import app

client = TestClient(app)


@patch("api.routes.spend_map.build_profile")
def test_spend_map_returns_mappings(mock_profile):
    mock_profile.return_value = {
        "categories": {
            "travel": {"total_eur": 340.0, "merchants": ["Ryanair", "Booking.com"], "tickers": ["RYAAY"], "sector": "travel"},
            "groceries": {"total_eur": 180.0, "merchants": ["Mercadona"], "tickers": ["XLP"], "sector": "consumer_staples"},
        }
    }

    res = client.get("/spend-map?user_id=mock_user_1")

    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "mock_user_1"
    assert len(data["mappings"]) == 2
    assert data["total_spend_mapped_eur"] == 520.0
    assert "insight" in data


@patch("api.routes.spend_map.build_profile")
def test_spend_map_visualization_shape(mock_profile):
    mock_profile.return_value = {
        "categories": {
            "ecommerce": {"total_eur": 200.0, "merchants": ["Amazon"], "tickers": ["AMZN"], "sector": "ecommerce"},
        }
    }

    res = client.get("/spend-map?user_id=mock_user_2")

    assert res.status_code == 200
    mapping = res.json()["mappings"][0]
    viz = mapping["visualization"]
    assert viz["type"] == "donut_with_arrow"
    assert viz["spend_value"] == 200.0
    assert "instrument_label" in viz
    assert "color" in viz


@patch("api.routes.spend_map.build_profile")
def test_spend_map_skips_unknown_categories(mock_profile):
    mock_profile.return_value = {
        "categories": {
            "unknown_category": {"total_eur": 50.0, "merchants": ["SomeShop"], "tickers": [], "sector": None},
        }
    }

    res = client.get("/spend-map?user_id=mock_user_1")

    assert res.status_code == 200
    assert res.json()["mappings"] == []


@patch("api.routes.spend_map.build_profile")
def test_spend_map_unknown_user_returns_404(mock_profile):
    mock_profile.side_effect = ValueError("User not found")

    res = client.get("/spend-map?user_id=nonexistent_user")

    assert res.status_code == 404
