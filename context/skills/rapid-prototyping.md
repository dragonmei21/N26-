---
name: rapid-prototyping
description: "Use when scaffolding a new hackathon project. Contains stack selection logic, project setup commands, and boilerplate generation. Gets from zero to running app in <10 minutes."
---

# Rapid Prototyping — Zero to Running in 10 Minutes

## Stack Selection Decision Tree

```
What's the core of your solution?
│
├─ AI / LLM chat or analysis
│  ├─ Needs nice UI? → Next.js + FastAPI + OpenAI
│  └─ UI not critical? → Streamlit + OpenAI (fastest possible)
│
├─ Data dashboard / visualization
│  ├─ Interactive? → Next.js + Recharts/Plotly
│  └─ Static analysis? → Streamlit + Plotly
│
├─ Web app with user flows
│  └─ Next.js + shadcn/ui + SQLite (via Prisma)
│
├─ ML model serving
│  └─ FastAPI + scikit-learn/pytorch + React frontend
│
└─ Fintech / banking
   └─ Next.js + FastAPI + mock banking API
```

---

## Option A: Full-Stack (Next.js + FastAPI) — Most Versatile

### Setup (5 minutes)

```bash
# Frontend
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd frontend
npx shadcn@latest init -d
npx shadcn@latest add button card input dialog tabs chart
cd ..

# Backend
mkdir backend && cd backend
cat > requirements.txt << 'EOF'
fastapi
uvicorn[standard]
python-dotenv
openai
anthropic
pandas
scikit-learn
pydantic
python-multipart
EOF
pip install -r requirements.txt

# Backend skeleton
cat > main.py << 'PYEOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Add your endpoints below:

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
PYEOF
cd ..

# Environment
cat > .env << 'EOF'
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
```

### Run
```bash
# Terminal 1: Backend
cd backend && python main.py

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## Option B: Streamlit (Fastest for demos)

```bash
pip install streamlit openai plotly pandas

cat > app.py << 'PYEOF'
import streamlit as st
from openai import OpenAI
import os

st.set_page_config(page_title="Hackathon App", layout="wide")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

st.title("🚀 [Your App Name]")

# Sidebar for configuration
with st.sidebar:
    st.header("Settings")
    # Add controls here

# Main content
col1, col2 = st.columns(2)

with col1:
    user_input = st.text_area("Enter your query:")
    if st.button("Analyze", type="primary"):
        with st.spinner("Thinking..."):
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": user_input}]
            )
            st.session_state.result = response.choices[0].message.content

with col2:
    if "result" in st.session_state:
        st.markdown(st.session_state.result)
PYEOF

# Run: streamlit run app.py
```

---

## Option C: Next.js Only (Full-stack with API routes)

```bash
npx create-next-app@latest app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd app
npx shadcn@latest init -d
npx shadcn@latest add button card input tabs

# API route example:
mkdir -p src/app/api/chat
cat > src/app/api/chat/route.ts << 'EOF'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { message } = await req.json()
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: message }]
    })
  })
  
  const data = await response.json()
  return NextResponse.json({ response: data.choices[0].message.content })
}
EOF
```

---

## Common Components to Have Ready

### API Fetch Hook (React)
```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function apiCall(endpoint: string, data?: any) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: data ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
```

### Loading Component
```tsx
// components/Loading.tsx
export function Loading({ text = "Analyzing..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
      <span>{text}</span>
    </div>
  )
}
```

### Quick Chart (Recharts)
```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function QuickChart({ data, xKey, yKey }: any) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={yKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

---

## Deployment (One-command)

### Vercel (Frontend)
```bash
npx vercel --prod
```

### Railway (Backend)
```bash
# railway.toml
cat > railway.toml << 'EOF'
[build]
builder = "nixpacks"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
EOF

railway up
```

### Or just run locally
For a hackathon demo, running locally is totally fine. Use ngrok if you need a public URL:
```bash
ngrok http 3000  # expose your local app
```

---

## Hackathon-Specific Shortcuts

### Fake Auth (don't build real auth)
```typescript
// Just use a context with hardcoded user
const DEMO_USER = { id: "1", name: "Demo User", email: "demo@example.com" }
```

### Fake Database (just use JSON)
```python
import json

DB_FILE = "data/db.json"

def load_db():
    try:
        with open(DB_FILE) as f:
            return json.load(f)
    except FileNotFoundError:
        return {"items": []}

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)
```

### Demo Data Generator
```python
import random
from datetime import datetime, timedelta

def generate_transactions(n=50):
    categories = ["food", "transport", "entertainment", "bills", "shopping"]
    merchants = {
        "food": ["Mercadona", "Lidl", "Starbucks", "McDonalds"],
        "transport": ["TMB Metro", "Cabify", "Renfe", "Vueling"],
        "entertainment": ["Netflix", "Spotify", "Cinema Yelmo", "Steam"],
        "bills": ["Endesa", "Vodafone", "Agua Barcelona", "Allianz"],
        "shopping": ["Zara", "Amazon", "El Corte Inglés", "MediaMarkt"]
    }
    
    txns = []
    for i in range(n):
        cat = random.choice(categories)
        txns.append({
            "id": f"tx_{i:04d}",
            "date": (datetime.now() - timedelta(days=random.randint(0, 90))).isoformat(),
            "merchant": random.choice(merchants[cat]),
            "category": cat,
            "amount": round(random.uniform(1.5, 200), 2),
            "currency": "EUR"
        })
    return sorted(txns, key=lambda x: x["date"], reverse=True)
```
