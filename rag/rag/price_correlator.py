import random
from datetime import datetime, timedelta

TICKER_BASE_PRICES = {
    "NVDA": 160, "AMZN": 178, "MSFT": 337, "AAPL": 224, "GOOGL": 175,
    "META": 610, "TSMC": 175, "TSM": 175, "ASML": 900, "SOXX": 250,
    "QQQ": 480, "SPY": 590, "GLD": 295, "SLV": 29, "DXY": 103,
    "SAP": 240, "NFLX": 990, "SPOT": 620, "UBER": 82, "RYAAY": 145,
    "JETS": 22, "XLP": 78, "ICLN": 16, "BTC-USD": 94000, "ETH-USD": 3400,
    "TLT": 88, "IWDA": 95,
}


def fetch_price_timeline(ticker: str, event_date_str: str) -> dict | None:
    try:
        base = TICKER_BASE_PRICES.get(ticker.upper())
        if not base:
            return None

        event_dt = datetime.strptime(event_date_str, "%Y-%m-%d")
        start_dt = event_dt - timedelta(days=20)

        random.seed(ticker + event_date_str)
        labels, values = [], []

        for i in range(30):
            d = start_dt + timedelta(days=i)
            labels.append(f"{d.month}/{d.day}")
            noise = (random.random() - 0.5) * base * 0.015
            values.append(round(base + noise, 2))

        event_index = 20

        return {
            "labels": labels,
            "values": values,
            "event_index": event_index,
        }
    except Exception:
        return None


def enrich_chain_with_prices(chain: list[dict], event_date: str) -> list[dict]:
    for step in chain:
        ticker = step.get("ticker")
        if ticker:
            timeline = fetch_price_timeline(ticker, event_date)
            if timeline:
                impact = step.get("price_change_pct") or 0.0
                base = TICKER_BASE_PRICES.get(ticker.upper(), 100)
                values = timeline["values"].copy()
                ei = timeline["event_index"]
                for i in range(ei, len(values)):
                    days_since = i - ei
                    trend = base * (impact / 100) * (1 - (2.718 ** (-days_since * 0.3)))
                    values[i] = round(values[i] + trend, 2)
                timeline["values"] = values
                step["price_data"] = {
                    "type": "timeline_with_event",
                    "title": f"{ticker} 30-day price",
                    "event_label": "Event",
                    "data": timeline,
                }
            else:
                step["price_data"] = None
        else:
            step["price_data"] = None
    return chain
