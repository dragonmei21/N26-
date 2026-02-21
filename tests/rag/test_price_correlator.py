import pytest
from datetime import date
from unittest.mock import patch, MagicMock
from rag.price_correlator import fetch_price_timeline, enrich_chain_with_prices
from rag.causal_chain import CausalStep, CausalChainResponse

@patch("rag.price_correlator.yf.Ticker")
def test_fetch_price_timeline_success(mock_ticker):
    mock_instance = MagicMock()
    mock_ticker.return_value = mock_instance
    
    # Mocking a DataFrame return from yfinance
    import pandas as pd
    dates = pd.date_range(end=date(2026, 2, 21), periods=30)
    mock_df = pd.DataFrame({"Close": [100.0 + i for i in range(30)]}, index=dates)
    mock_instance.history.return_value = mock_df

    res = fetch_price_timeline("NVDA", date(2026, 2, 20))
    assert res is not None
    assert "labels" in res
    assert "values" in res
    assert "event_index" in res
    assert res["event_index"] == 28 # Expected index for 2026-02-20
    assert "pct_change" in res

@patch("rag.price_correlator.yf.Ticker")
def test_fetch_price_timeline_failure(mock_ticker):
    mock_instance = MagicMock()
    mock_ticker.return_value = mock_instance
    
    # Mocking an empty DataFrame (invalid ticker)
    import pandas as pd
    mock_instance.history.return_value = pd.DataFrame()

    res = fetch_price_timeline("INVALID_TICKER", date(2026, 2, 20))
    assert res is None

@patch("rag.price_correlator.fetch_price_timeline")
def test_enrich_chain_with_prices(mock_fetch):
    mock_fetch.return_value = {
        "labels": ["Jan 22", "Feb 20"],
        "values": [136.2, 142.5],
        "event_index": 1,
        "pct_change": 11.4
    }

    chain = [
        CausalStep(
            step_number=1,
            event="Cloud demand spikes",
            mechanism="Training needs GPUs",
            affected_entity="NVIDIA",
            entity_type="company",
            ticker="NVDA",
            direction="up",
            confidence="high",
            plain_english="NVIDIA makes GPUs."
        ),
        CausalStep(
            step_number=2,
            event="Macro event",
            mechanism="Unknown",
            affected_entity="AI Sector",
            entity_type="sector",
            ticker=None,
            direction="up",
            confidence="medium",
            plain_english="Sector rises."
        )
    ]

    priced_chain = enrich_chain_with_prices(chain, date(2026, 2, 20), "ChatGPT-5 Launch")
    assert len(priced_chain) == 2
    
    # First step should have price data
    assert priced_chain[0].price_data is not None
    assert priced_chain[0].price_change_pct == 11.4
    assert priced_chain[0].price_data["title"] == "NVIDIA — 30 Day Price"
    
    # Second step should not have price data (ticker is None)
    assert priced_chain[1].price_data is None
    assert priced_chain[1].price_change_pct is None
