# merchant name (lowercase) → related tickers + sector label
MERCHANT_TO_TICKERS: dict[str, dict] = {
    # E-commerce / Cloud
    "amazon":       {"tickers": ["AMZN", "MSFT"],       "sector": "ecommerce_cloud"},
    "aws":          {"tickers": ["AMZN", "MSFT", "GOOGL"], "sector": "cloud"},

    # Apple ecosystem
    "apple store":  {"tickers": ["AAPL"],               "sector": "consumer_tech"},

    # Travel
    "ryanair":      {"tickers": ["RYAAY", "LUV"],       "sector": "aviation"},
    "booking.com":  {"tickers": ["BKNG"],               "sector": "travel"},

    # Streaming / Subscriptions
    "netflix":      {"tickers": ["NFLX", "DIS"],        "sector": "streaming"},
    "spotify":      {"tickers": ["SPOT"],               "sector": "streaming"},

    # Gaming
    "steam":        {"tickers": ["MSFT", "TTWO"],       "sector": "gaming"},

    # Groceries / Consumer Staples → ETF proxy
    "mercadona":    {"tickers": ["XLP"],                "sector": "consumer_staples"},
    "lidl":         {"tickers": ["XLP"],                "sector": "consumer_staples"},
    "carrefour":    {"tickers": ["XLP", "CA.PA"],       "sector": "consumer_staples"},

    # Transport
    "metro madrid": {"tickers": [],                     "sector": "public_transport"},
    "renfe":        {"tickers": [],                     "sector": "public_transport"},

    # Investing / Crypto
    "degiro":       {"tickers": ["GS", "MS"],           "sector": "financial_services"},
    "binance":      {"tickers": ["BTC-USD", "ETH-USD"], "sector": "crypto"},

    # Retail / Clothing → broad consumer
    "zara":         {"tickers": ["ITX.MC"],             "sector": "retail"},
    "ikea":         {"tickers": [],                     "sector": "home_retail"},

    # Food & Drink
    "starbucks":    {"tickers": ["SBUX"],               "sector": "food_drink"},
}


def lookup(merchant_name: str) -> dict:
    """Return ticker info for a merchant, or empty dict if unknown."""
    return MERCHANT_TO_TICKERS.get(merchant_name.lower().strip(), {})
