import pytest
from datetime import date
from unittest.mock import patch, MagicMock
from rag.event_classifier import classify_event

@patch("rag.event_classifier.get_client")
def test_event_classifier_is_macro(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '''
    {
      "is_macro": true,
      "category": "tech_launch",
      "primary_entities": ["OpenAI", "ChatGPT", "AI sector"],
      "potential_tickers": ["MSFT", "NVDA"],
      "event_date": "2026-02-21"
    }
    '''
    mock_client.chat.completions.create.return_value = mock_response

    res = classify_event("OpenAI launches ChatGPT-5 with huge improvements.")
    assert res.is_macro is True
    assert res.category == "tech_launch"
    assert "OpenAI" in res.primary_entities
    assert "NVDA" in res.potential_tickers
    assert res.event_date == date(2026, 2, 21)
