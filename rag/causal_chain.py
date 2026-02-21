import json
from typing import List, Literal, Optional
from pydantic import BaseModel
from .llm_client import complete_json

class CausalStep(BaseModel):
    step_number: int
    event: str
    mechanism: str
    affected_entity: str
    entity_type: Literal["company", "sector", "commodity", "currency", "index"]
    ticker: Optional[str] = None
    direction: Literal["up", "down", "neutral"]
    confidence: Literal["high", "medium", "low"]
    plain_english: str

class CausalChainResponse(BaseModel):
    chain: List[CausalStep]
    user_connection: str

def generate_causal_chain(article_title: str, article_chunks: str, published_at: str, spend_summary: str) -> CausalChainResponse:
    system_prompt = """You are a financial analyst explaining macro investment chains to everyday people.
Your job: trace how a news event ripples through the economy to specific stocks.

Rules:
1. Maximum 4 steps in the chain (keep it digestible)
2. Each step must be logically connected to the previous
3. Only include stocks where the connection is DIRECT and defensible
4. Set confidence "high" only if this is a well-established causal pattern
5. Set confidence "medium" if plausible but not certain
6. Never include a step just because a stock is popular
7. Respond ONLY in valid JSON matching the schema."""

    user_prompt = f"""News event: {article_title}
Article content: {article_chunks}
Published: {published_at}

User's spending context: {spend_summary}

Trace the investment causal chain from this event.
For each step identify: the mechanism, affected entity, ticker if public, direction, and plain English explanation.
Then write one sentence connecting the final step to the user's spending.

Respond as JSON: {{ "chain": [...], "user_connection": "..." }}"""

    try:
        content = complete_json(system=system_prompt, user=user_prompt, temperature=0.2, max_tokens=800)
        data = json.loads(content)
        
        # Validation checks
        parsed_response = CausalChainResponse(**data)
        
        # Guardrail: Maximum 4 steps
        if len(parsed_response.chain) > 4:
            parsed_response.chain = parsed_response.chain[:4]
            
        # Guardrail: Reject if no "high" confidence step exists (return empty chain)
        if not any(step.confidence == "high" for step in parsed_response.chain):
            parsed_response.chain = []
            parsed_response.user_connection = "This event does not have a highly confident macro implication path."
            
        return parsed_response
        
    except Exception as e:
        print(f"Error generating causal chain: {e}")
        return CausalChainResponse(chain=[], user_connection="Error analyzing causal chain.")
