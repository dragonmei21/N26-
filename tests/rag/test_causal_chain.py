import pytest
from unittest.mock import patch, MagicMock
from rag.causal_chain import generate_causal_chain, CausalChainResponse

@patch("rag.causal_chain.get_client")
def test_causal_chain_generation(mock_get_client):
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client
    
    mock_response = MagicMock()
    # Mocking ChatGPT-5 example
    mock_response.choices[0].message.content = '''
    {
      "chain": [
        {
          "step_number": 1,
          "event": "OpenAI releases ChatGPT-5",
          "mechanism": "AI race accelerates, all major tech firms race to match",
          "affected_entity": "AI Sector",
          "entity_type": "sector",
          "ticker": null,
          "direction": "up",
          "confidence": "high",
          "plain_english": "Every tech company now needs to build or buy AI fast"
        },
        {
          "step_number": 2,
          "event": "Cloud compute demand spikes",
          "mechanism": "Training and running models requires GPUs",
          "affected_entity": "NVIDIA",
          "entity_type": "company",
          "ticker": "NVDA",
          "direction": "up",
          "confidence": "high",
          "plain_english": "NVIDIA makes GPUs that power AI."
        }
      ],
      "user_connection": "You spent €124 at Amazon, solving compute needs requires NVIDIA chips."
    }
    '''
    mock_client.chat.completions.create.return_value = mock_response

    res = generate_causal_chain(
        article_title="OpenAI releases ChatGPT-5",
        article_chunks="OpenAI announced ChatGPT-5 with huge improvements in reasoning.",
        published_at="2026-02-21",
        spend_summary="You spent €124 at Amazon last month."
    )
    
    # Validation checks
    assert isinstance(res, CausalChainResponse)
    assert len(res.chain) == 2
    assert res.chain[0].confidence == "high"
    assert res.chain[1].ticker == "NVDA"
    assert "Amazon" in res.user_connection
