# USER_PROFILE: Matches the N26 Case Study "Marco" profile
USER_PROFILE = {
    "name": "Marco",
    "balance": 2345.67,
    "interest_rate": 0.025, # 2.5% as per N26 slides
    "interests": ["Crypto", "Tech Stocks", "Sustainable Living", "Travel"],
    "recent_transactions": [
        {"category": "Salary", "amount": 2345.67, "type": "incoming"},
        {"category": "Supermarket", "amount": -150.00, "type": "outgoing"},
        {"category": "Netflix", "amount": -12.99, "type": "outgoing"}
    ]
}

# FINANCIAL_NEWS: A diverse set of articles to test AI filtering
FINANCIAL_NEWS = [
    {
        "id": 1,
        "title": "ECB Interest Rate Hike: What it means for your savings",
        "content": "The European Central Bank has raised interest rates again. While this makes loans more expensive, it typically leads to higher interest rates for savings accounts like N26 Instant Savings."
    },
    {
        "id": 2,
        "title": "NVIDIA Stock Surges 10% after AI Earnings Report",
        "content": "Tech giant NVIDIA continues its record run, driven by massive demand for AI chips. Stock market investors are seeing significant gains in the semiconductor sector."
    },
    {
        "id": 3,
        "title": "New Green Energy Tax Credits Announced",
        "content": "The EU is introducing new subsidies for citizens investing in sustainable home upgrades and solar energy projects, encouraging sustainable living transitions."
    },
    {
        "id": 4,
        "title": "Bitcoin Price Volatility: Crypto markets under pressure",
        "content": "The cryptocurrency market saw a sharp 5% drop today as regulators discuss new stablecoin rules. Investors are advised to check their portfolio exposure."
    },
    {
        "id": 5,
        "title": "Post-Holiday Travel Deals: Airline prices dropping",
        "content": "Airlines are slashing prices for spring destinations. Major carriers are offering up to 30% off flights to Europe and Asia for a limited time."
    }
]