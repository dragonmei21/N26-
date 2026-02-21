---
name: data-generation
description: "Use when you need realistic demo data fast. Contains generators for banking/fintech data (N26 case), user profiles, synthetic datasets, and API mocking patterns. Also useful when case partner data is missing or messy."
---

# Data Generation & API Mocking — Fake It Till You Demo It

## Quick Decision

```
What data do you need?
├─ Banking/transactions (N26 case) → Use fintech generators below
├─ User profiles / personas → Use profile generator
├─ ML training data → Use LLM to generate or Faker for tabular
├─ API that doesn't exist yet → Mock it with FastAPI
└─ Realistic file uploads → Generate PDFs/CSVs on the fly
```

---

## Fintech / Banking Data (N26 Case)

### Transaction Generator
```python
import random
from datetime import datetime, timedelta
import json

def generate_transactions(user_id="user_001", n=100, days_back=90):
    """Generate realistic banking transactions for demo."""
    
    merchants = {
        "food": [
            ("Mercadona", 15, 85), ("Lidl", 10, 60), ("Carrefour", 20, 120),
            ("Starbucks", 3, 8), ("McDonald's", 5, 15), ("La Boqueria", 8, 35),
            ("Glovo Food", 12, 30), ("Just Eat", 10, 25)
        ],
        "transport": [
            ("TMB Metro", 1.2, 1.2), ("Cabify", 5, 25), ("Renfe", 8, 45),
            ("Vueling", 30, 200), ("Ryanair", 20, 150), ("Bolt", 4, 18),
            ("T-Mobilitat", 40, 40)
        ],
        "entertainment": [
            ("Netflix", 12.99, 12.99), ("Spotify", 9.99, 9.99),
            ("Cinema Yelmo", 8, 15), ("Steam", 5, 60),
            ("HBO Max", 8.99, 8.99), ("PlayStation Store", 10, 70)
        ],
        "bills": [
            ("Endesa", 50, 120), ("Vodafone", 25, 45), ("Movistar", 30, 55),
            ("Agua Barcelona", 20, 40), ("Allianz Insurance", 80, 80),
            ("Gym McFit", 29.90, 29.90)
        ],
        "shopping": [
            ("Zara", 15, 90), ("Amazon", 5, 200), ("El Corte Inglés", 20, 150),
            ("MediaMarkt", 15, 500), ("IKEA", 10, 300), ("Mango", 15, 80)
        ],
        "income": [
            ("Salary - TechCorp", 2800, 2800), ("Freelance Payment", 200, 800),
            ("Bizum Received", 5, 50)
        ]
    }
    
    category_weights = {
        "food": 0.35, "transport": 0.15, "entertainment": 0.10,
        "bills": 0.10, "shopping": 0.15, "income": 0.05
    }
    
    transactions = []
    base_date = datetime.now()
    
    for i in range(n):
        category = random.choices(
            list(category_weights.keys()),
            weights=list(category_weights.values())
        )[0]
        
        merchant_name, min_amt, max_amt = random.choice(merchants[category])
        amount = round(random.uniform(min_amt, max_amt), 2)
        
        # Income is positive, expenses are negative
        if category == "income":
            amount = abs(amount)
        else:
            amount = -abs(amount)
        
        date = base_date - timedelta(
            days=random.randint(0, days_back),
            hours=random.randint(6, 23),
            minutes=random.randint(0, 59)
        )
        
        transactions.append({
            "id": f"tx_{i:05d}",
            "user_id": user_id,
            "date": date.isoformat(),
            "merchant": merchant_name,
            "category": category,
            "amount": amount,
            "currency": "EUR",
            "balance_after": round(random.uniform(500, 5000), 2),
            "is_recurring": merchant_name in ["Netflix", "Spotify", "HBO Max", "Gym McFit", 
                                                "Endesa", "Vodafone", "Movistar", "T-Mobilitat"],
            "location": random.choice(["Barcelona", "Barcelona", "Barcelona", "Online", "Madrid"])
        })
    
    return sorted(transactions, key=lambda x: x["date"], reverse=True)


def generate_user_profile():
    """Generate a realistic N26 user profile."""
    return {
        "user_id": "user_001",
        "name": "Maria García",
        "email": "maria.garcia@email.com",
        "age": 28,
        "occupation": "Software Engineer",
        "monthly_income": 2800,
        "account_type": "N26 Smart",
        "member_since": "2022-03-15",
        "credit_score": 720,
        "savings_goal": 10000,
        "current_savings": 3450,
        "monthly_spending_limit": 2000,
        "categories_budget": {
            "food": 400,
            "transport": 150,
            "entertainment": 100,
            "shopping": 200,
            "bills": 300
        }
    }

# Usage:
# transactions = generate_transactions(n=200)
# profile = generate_user_profile()
# with open("data/transactions.json", "w") as f:
#     json.dump(transactions, f, indent=2)
```

### Account Summary Generator
```python
def generate_account_summary(transactions):
    """Generate spending summary from transactions."""
    import pandas as pd
    
    df = pd.DataFrame(transactions)
    df['amount'] = pd.to_numeric(df['amount'])
    df['date'] = pd.to_datetime(df['date'])
    
    expenses = df[df['amount'] < 0]
    income = df[df['amount'] > 0]
    
    return {
        "total_income": round(income['amount'].sum(), 2),
        "total_expenses": round(abs(expenses['amount'].sum()), 2),
        "net": round(df['amount'].sum(), 2),
        "by_category": expenses.groupby('category')['amount'].sum().abs().round(2).to_dict(),
        "top_merchants": expenses.groupby('merchant')['amount'].sum().abs().round(2).nlargest(5).to_dict(),
        "avg_daily_spend": round(abs(expenses['amount'].sum()) / 30, 2),
        "transaction_count": len(df),
        "recurring_total": round(abs(expenses[expenses['is_recurring']]['amount'].sum()), 2)
    }
```

---

## Generic Data Generators

### User Profiles (with Faker)
```python
# pip install faker
from faker import Faker
fake = Faker()

def generate_users(n=20):
    return [{
        "id": f"user_{i:03d}",
        "name": fake.name(),
        "email": fake.email(),
        "age": random.randint(18, 65),
        "city": random.choice(["Barcelona", "Madrid", "Valencia", "Sevilla"]),
        "signup_date": fake.date_between(start_date="-2y").isoformat(),
        "is_premium": random.random() > 0.7,
    } for i in range(n)]
```

### Using LLM for Complex Data
```python
from openai import OpenAI
import json

client = OpenAI()

def generate_with_llm(description, n=20):
    """Generate any kind of structured data using an LLM."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"""Generate {n} realistic data entries as a JSON array.
Each entry should be: {description}
Return ONLY valid JSON, no markdown, no explanation.
Make the data diverse and realistic."""
        }],
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)

# Examples:
# generate_with_llm("customer support tickets with subject, body, priority, category, sentiment", 50)
# generate_with_llm("product reviews with rating (1-5), text, product_name, helpful_votes", 30)
# generate_with_llm("job applications with name, role, years_experience, skills[], status", 40)
```

### CSV Generator
```python
import pandas as pd

def save_demo_data(data, filename="data/demo_data.csv"):
    """Save generated data as CSV for ML pipeline or demo."""
    import os
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False)
    print(f"✅ Saved {len(df)} rows to {filename}")
    print(f"   Columns: {list(df.columns)}")
    return df
```

---

## API Mocking (When the real API isn't ready)

### Full Mock API Server
```python
# mock_api.py — Run this as your "backend" during early development
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import random
from datetime import datetime

app = FastAPI(title="Mock API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Load mock data at startup
TRANSACTIONS = generate_transactions(n=200)  # from generator above
PROFILE = generate_user_profile()

@app.get("/api/user/profile")
async def get_profile():
    return PROFILE

@app.get("/api/transactions")
async def get_transactions(limit: int = 20, category: str = None):
    txns = TRANSACTIONS
    if category:
        txns = [t for t in txns if t["category"] == category]
    return {"transactions": txns[:limit], "total": len(txns)}

@app.get("/api/spending/summary")
async def get_summary():
    return generate_account_summary(TRANSACTIONS)

@app.post("/api/ai/analyze")
async def analyze(data: dict):
    """Mock AI endpoint — returns a plausible response with a delay."""
    import asyncio
    await asyncio.sleep(1)  # simulate AI thinking
    
    return {
        "analysis": f"Based on your spending patterns, you spend most on food (€{random.randint(300,500)}/month). "
                     f"Your biggest expense this month was {random.choice(['Amazon', 'Zara', 'MediaMarkt'])}. "
                     f"You could save €{random.randint(50,200)}/month by reducing entertainment spending.",
        "recommendations": [
            {"action": "Set a food budget alert at €400", "potential_savings": 80},
            {"action": "Cancel unused subscriptions", "potential_savings": 20},
            {"action": "Switch to monthly transport pass", "potential_savings": 30},
        ],
        "confidence": 0.87
    }

@app.post("/api/ai/chat")
async def chat(data: dict):
    """Mock chat endpoint."""
    import asyncio
    await asyncio.sleep(0.5)
    
    message = data.get("message", "").lower()
    
    if "spend" in message or "budget" in message:
        reply = "This month you've spent €1,247 so far. That's 15% less than last month. Your biggest category is food at €380."
    elif "save" in message or "saving" in message:
        reply = "You're currently saving €553/month on average. At this rate, you'll reach your €10,000 goal by August 2026."
    elif "fraud" in message or "suspicious" in message:
        reply = "I found 2 potentially suspicious transactions: a €89.99 charge from an unknown merchant in Romania, and a duplicate €12.99 Netflix charge."
    else:
        reply = "I can help you analyze your spending, find savings opportunities, or check for suspicious transactions. What would you like to know?"
    
    return {"response": reply, "timestamp": datetime.now().isoformat()}

# Run: uvicorn mock_api:app --reload --port 8000
```

### Inline Mock (no separate server)
```javascript
// lib/mockApi.js — Use this in frontend when backend isn't ready
const MOCK_DELAY = 500; // simulate network

export async function mockFetch(endpoint, options) {
  await new Promise(r => setTimeout(r, MOCK_DELAY));
  
  const mocks = {
    '/api/user/profile': {
      name: 'Maria García',
      balance: 3450.00,
      monthlyIncome: 2800,
    },
    '/api/transactions': {
      transactions: [
        { id: 1, merchant: 'Mercadona', amount: -45.30, category: 'food', date: '2026-02-19' },
        { id: 2, merchant: 'TMB Metro', amount: -1.20, category: 'transport', date: '2026-02-19' },
        { id: 3, merchant: 'Netflix', amount: -12.99, category: 'entertainment', date: '2026-02-18' },
      ]
    },
    '/api/ai/analyze': {
      analysis: 'Your spending is 15% lower than last month. Great job on reducing food expenses!',
      score: 82,
    }
  };
  
  return mocks[endpoint] || { error: 'Not mocked yet' };
}

// Usage: const data = await mockFetch('/api/transactions');
// When backend is ready, just swap mockFetch → fetch
```

---

## Quick Data for ML

### Classification Dataset
```python
def generate_fraud_dataset(n=1000, fraud_rate=0.05):
    """Generate a labeled fraud detection dataset."""
    import numpy as np
    
    data = []
    for i in range(n):
        is_fraud = random.random() < fraud_rate
        
        if is_fraud:
            amount = random.uniform(200, 5000)
            hour = random.randint(0, 5)  # unusual hours
            location_change = 1
            num_transactions_last_hour = random.randint(5, 20)
        else:
            amount = random.uniform(1, 200)
            hour = random.randint(8, 22)
            location_change = random.random() > 0.9
            num_transactions_last_hour = random.randint(0, 3)
        
        data.append({
            "amount": round(amount, 2),
            "hour": hour,
            "day_of_week": random.randint(0, 6),
            "is_international": int(random.random() > 0.85),
            "location_changed": int(location_change),
            "num_txns_last_hour": num_transactions_last_hour,
            "merchant_category": random.choice(["food", "transport", "online", "atm", "pos"]),
            "is_recurring": int(random.random() > 0.7),
            "is_fraud": int(is_fraud)
        })
    
    return pd.DataFrame(data)

# Generate and save:
# df = generate_fraud_dataset(2000)
# df.to_csv("data/fraud_dataset.csv", index=False)
# Then use with ml_pipeline_auto.py: DATA_SOURCE="data/fraud_dataset.csv", TARGET="is_fraud"
```
