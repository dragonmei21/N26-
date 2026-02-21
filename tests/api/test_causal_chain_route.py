from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from api.main import app

client = TestClient(app)

@patch("api.routes.causal_chain.classify_event")
@patch("api.routes.causal_chain.generate_causal_chain")
@patch("api.routes.causal_chain.enrich_chain_with_prices")
def test_causal_chain_endpoint_success(mock_enrich, mock_generate, mock_classify):
    from datetime import date
    
    # Mock Event Classification
    mock_event = MagicMock()
    mock_event.is_macro = True
    mock_event.category = "tech_launch"
    mock_event.event_date = date(2026, 2, 21)
    mock_classify.return_value = mock_event

    # Mock Causal Chain Generation
    from rag.causal_chain import CausalChainResponse, CausalStep
    mock_chain_res = MagicMock(spec=CausalChainResponse)
    
    mock_step1 = MagicMock()
    mock_step1.model_dump.return_value = {
        "step_number": 1,
        "event": "Launch",
        "mechanism": "Tech",
        "affected_entity": "OpenAI",
        "entity_type": "company",
        "ticker": None,
        "direction": "up",
        "confidence": "high",
        "plain_english": "OpenAI released new model"
    }

    mock_chain_res.chain = [mock_step1]
    mock_chain_res.user_connection = "You use tech products."
    mock_generate.return_value = mock_chain_res

    # Mock Price Enrichment
    mock_price_step = mock_step1.model_dump()
    mock_price_step["price_data"] = None
    mock_price_step["price_change_pct"] = None
    mock_price_step["event_date"] = "2026-02-21"
    
    mock_enrich.return_value = [mock_price_step]

    res = client.get("/causal-chain/article_123?user_id=mock_user_1")
    assert res.status_code == 200
    
    data = res.json()
    assert "trigger_event" in data
    assert "chain" in data
    assert "user_connection" in data
    assert len(data["chain"]) == 1
    assert data["chain"][0]["event"] == "Launch"

@patch("api.routes.causal_chain.classify_event")
def test_causal_chain_endpoint_not_macro(mock_classify):
    mock_event = MagicMock()
    mock_event.is_macro = False
    mock_classify.return_value = mock_event

    res = client.get("/causal-chain/article_123?user_id=mock_user_1")
    assert res.status_code == 400
    assert "not a macro event" in res.json()["detail"]
