import json
from datetime import date
from pydantic import BaseModel
from .llm_client import complete_json

class MacroEvent(BaseModel):
    is_macro: bool
    category: str
    primary_entities: list[str]
    potential_tickers: list[str]
    event_date: date

def classify_event(article_text: str, article_date: date = None) -> MacroEvent:
    if article_date is None:
        article_date = date.today()
        
    user_prompt = f"""Is this a macro event with investment implications?
Extract entities and likely affected stocks.
Format your response as a JSON object matching this schema:
{{
  "is_macro": boolean,
  "category": "string (e.g. tech_launch, rate_decision, earnings, geopolitical)",
  "primary_entities": ["list", "of", "entities"],
  "potential_tickers": ["list", "of", "stock", "tickers"],
  "event_date": "YYYY-MM-DD"
}}

Article Date: {article_date.isoformat()}
Article Text: {article_text}"""

    try:
        content = complete_json(
            system="You are a financial news classifier. Output valid JSON only.",
            user=user_prompt,
            temperature=0.1,
            max_tokens=300,
        )
        data = json.loads(content)
        return MacroEvent(**data)
    except Exception as e:
        print(f"Error calling LLM or parsing: {e}")
        return MacroEvent(
            is_macro=False, 
            category="unknown", 
            primary_entities=[], 
            potential_tickers=[], 
            event_date=article_date
        )
