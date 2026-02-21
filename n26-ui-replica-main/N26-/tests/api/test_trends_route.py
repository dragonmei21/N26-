from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from api.main import app

client = TestClient(app)


@patch("api.routes.trends.clean_articles")
@patch("api.routes.trends.fetch_articles")
def test_trends_returns_correct_shape(mock_fetch, mock_clean):
    mock_article = MagicMock()
    mock_article.title = "NVIDIA GPU demand surges as OpenAI releases ChatGPT-5"
    mock_article.content = "NVIDIA and GPU chips are driving AI demand. Bitcoin crypto also rising."
    mock_fetch.return_value = [mock_article]
    mock_clean.return_value = [mock_article]  # bypass model_copy

    res = client.get("/trends")

    assert res.status_code == 200
    data = res.json()
    assert "generated_at" in data
    assert "trending" in data
    assert isinstance(data["trending"], list)


@patch("api.routes.trends.clean_articles")
@patch("api.routes.trends.fetch_articles")
def test_trends_detects_spike(mock_fetch, mock_clean):
    # 5 articles all mentioning NVIDIA
    mock_articles = []
    for _ in range(5):
        a = MagicMock()
        a.title = "NVIDIA earnings beat expectations"
        a.content = "NVIDIA NVDA GPU chips data center AI demand H100"
        mock_articles.append(a)
    mock_fetch.return_value = mock_articles
    mock_clean.return_value = mock_articles

    res = client.get("/trends")

    assert res.status_code == 200
    trending = res.json()["trending"]
    nvidia_entry = next((t for t in trending if t["topic"] == "nvidia"), None)
    assert nvidia_entry is not None
    assert nvidia_entry["mention_count_24h"] > 0


@patch("api.routes.trends.clean_articles")
@patch("api.routes.trends.fetch_articles")
def test_trends_sparkline_has_seven_buckets(mock_fetch, mock_clean):
    mock_article = MagicMock()
    mock_article.title = "Bitcoin surges after ETF approval"
    mock_article.content = "Bitcoin BTC crypto exchange ETF"
    mock_fetch.return_value = [mock_article]
    mock_clean.return_value = [mock_article]

    res = client.get("/trends")

    assert res.status_code == 200
    trending = res.json()["trending"]
    if trending:
        sparkline = trending[0]["visualization"]["data"]
        assert len(sparkline["labels"]) == 7
        assert len(sparkline["values"]) == 7


@patch("api.routes.trends.clean_articles")
@patch("api.routes.trends.fetch_articles")
def test_trends_empty_articles_still_returns(mock_fetch, mock_clean):
    mock_fetch.return_value = []
    mock_clean.return_value = []

    res = client.get("/trends")

    assert res.status_code == 200
    assert isinstance(res.json()["trending"], list)
