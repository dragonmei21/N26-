import json
import random
from datetime import date, timedelta
import yfinance as yf

# In-memory cache for pricing TTL
_price_cache = {}

def fetch_price_timeline(ticker: str, event_date: date) -> dict | None:
    """
    Fetch 30 days of price data centered around the event date.
    Returns chart-ready JSON or None if ticker invalid or fails.
    """
    cache_key = f"{ticker}:{event_date.isoformat()}"
    if cache_key in _price_cache:
        return _price_cache[cache_key]

    try:
        start = event_date - timedelta(days=20)
        end = event_date + timedelta(days=10)
        
        tk = yf.Ticker(ticker)
        hist = tk.history(start=start, end=end)
        
        # Fallback to mock data if yfinance is empty or fails
        if hist.empty:
            return _get_mock_timeline(ticker, event_date)
        
        labels = [d.strftime("%b %d") for d in hist.index]
        values = [round(v, 2) for v in hist["Close"].tolist()]
        
        # Find index of event_date in the series
        event_index = next(
            (i for i, d in enumerate(hist.index) if d.date() >= event_date),
            len(labels) - 1
        )
        
        # Price change: close on event_date vs 5 days before
        pre_event_price = hist["Close"].iloc[max(0, event_index - 5)]
        post_event_price = hist["Close"].iloc[min(len(hist) - 1, event_index + 3)]
        pct_change = round(((post_event_price - pre_event_price) / pre_event_price) * 100, 2)
        
        result = {
            "labels": labels,
            "values": values,
            "event_index": event_index,
            "pct_change": pct_change
        }
        
        _price_cache[cache_key] = result
        return result
        
    except Exception as e:
        print(f"Error fetching live prices: {e}")
        return _get_mock_timeline(ticker, event_date)

def _get_mock_timeline(ticker: str, event_date: date) -> dict | None:
    """Fallback generator for mock data if yfinance fails or is down (hackathon resilience)"""
    try:
        with open("data/mock_prices.json", "r") as f:
            mocks = json.load(f)
            if ticker in mocks:
                return mocks[ticker]
    except FileNotFoundError:
        pass
    return None

def enrich_chain_with_prices(chain: list, event_date: date, trigger_event_label: str) -> list:
    """Enriches the base causal chain with historical price data graphs"""
    priced_chain = []
    
    # Recreate the PricedCausalStep format expected by Team B UI
    for idx, step in enumerate(chain):
        step_dict = step.model_dump()
        
        if step.ticker:
            price_info = fetch_price_timeline(step.ticker, event_date)
            if price_info:
                # Add Team B color schema mapping based on direction
                color = "#00D4A8" if step.direction == "up" else "#F43F5E" if step.direction == "down" else "#6B7280"
                
                step_dict["price_data"] = {
                    "type": "timeline_with_event",
                    "title": f"{step.affected_entity} — 30 Day Price",
                    "event_label": trigger_event_label[:15] + "..." if len(trigger_event_label) > 15 else trigger_event_label,
                    "data": {
                        "labels": price_info["labels"],
                        "values": price_info["values"],
                        "event_index": price_info["event_index"],
                        "color": color
                    }
                }
                step_dict["price_change_pct"] = price_info["pct_change"]
            else:
                step_dict["price_data"] = None
                step_dict["price_change_pct"] = None
        else:
            step_dict["price_data"] = None
            step_dict["price_change_pct"] = None
            
        step_dict["event_date"] = event_date.isoformat()
        
        # Pydantic prevents direct dynamic assignment without recreating or wrapping object,
        # Team B's response wants JSON layout, return raw dicts that map to the wrapper class later.
        
        from pydantic import BaseModel
        from typing import Literal, Optional
        
        class PricedCausalStep(BaseModel):
            step_number: int
            event: str
            mechanism: str
            affected_entity: str
            entity_type: Literal["company", "sector", "commodity", "currency", "index"]
            ticker: Optional[str] = None
            direction: Literal["up", "down", "neutral"]
            confidence: Literal["high", "medium", "low"]
            plain_english: str
            price_data: Optional[dict] = None
            price_change_pct: Optional[float] = None
            event_date: date
            
        priced_chain.append(PricedCausalStep(**step_dict))
        
    return priced_chain
