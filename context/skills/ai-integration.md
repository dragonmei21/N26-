---
name: ai-integration
description: "Use when the hackathon solution involves AI/LLM features. Contains ready-to-use patterns for OpenAI, Anthropic, RAG pipelines, structured output, streaming, and agent patterns. Copy-paste and adapt."
---

# AI Integration Patterns — Hackathon Speed

## Quick Decision: Which AI Pattern?

| Need | Pattern | Time to implement |
|------|---------|-------------------|
| Chat / Q&A | Simple API call | 5 min |
| Chat with documents | RAG pipeline | 30 min |
| Structured data extraction | Function calling / structured output | 15 min |
| Multi-step reasoning | Agent with tools | 45 min |
| Image analysis | Vision API | 10 min |
| Streaming responses | SSE / streaming | 15 min |

---

## Pattern 1: Simple LLM API Call (FastAPI)

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class Query(BaseModel):
    message: str
    context: str = ""

@app.post("/api/chat")
async def chat(query: Query):
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # cheap + fast for hackathon
        messages=[
            {"role": "system", "content": f"You are a helpful assistant. Context: {query.context}"},
            {"role": "user", "content": query.message}
        ],
        temperature=0.7,
        max_tokens=1000
    )
    return {"response": response.choices[0].message.content}
```

### With Anthropic instead:
```python
from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{"role": "user", "content": query.message}]
)
return {"response": response.content[0].text}
```

---

## Pattern 2: RAG Pipeline (Documents + LLM)

```python
# rag.py — Minimal RAG with ChromaDB
from langchain_community.document_loaders import TextLoader, PDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.chains import RetrievalQA

def build_rag(file_paths: list[str]):
    """Build RAG index from files. Call once at startup."""
    # Load documents
    docs = []
    for path in file_paths:
        if path.endswith(".pdf"):
            loader = PDFLoader(path)
        else:
            loader = TextLoader(path)
        docs.extend(loader.load())
    
    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(docs)
    
    # Create vector store
    vectorstore = Chroma.from_documents(chunks, OpenAIEmbeddings())
    
    # Create QA chain
    qa_chain = RetrievalQA.from_chain_type(
        llm=ChatOpenAI(model="gpt-4o-mini", temperature=0),
        retriever=vectorstore.as_retriever(search_kwargs={"k": 4}),
        return_source_documents=True
    )
    return qa_chain

# Usage in FastAPI:
# qa = build_rag(["data/document1.pdf", "data/document2.txt"])
# result = qa.invoke({"query": "What is the policy on X?"})
# answer = result["result"]
```

### Even simpler RAG (no LangChain):
```python
# Simple RAG with just OpenAI
from openai import OpenAI
import numpy as np

client = OpenAI()

def embed(text: str) -> list[float]:
    resp = client.embeddings.create(model="text-embedding-3-small", input=text)
    return resp.data[0].embedding

def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Index your documents
chunks = ["chunk1 text...", "chunk2 text...", ...]  # split your docs
chunk_embeddings = [embed(c) for c in chunks]

def query_rag(question: str, top_k=3):
    q_emb = embed(question)
    scores = [cosine_sim(q_emb, ce) for ce in chunk_embeddings]
    top_indices = np.argsort(scores)[-top_k:][::-1]
    context = "\n".join([chunks[i] for i in top_indices])
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": f"Answer based on this context:\n{context}"},
            {"role": "user", "content": question}
        ]
    )
    return response.choices[0].message.content
```

---

## Pattern 3: Structured Output (Extract data from text)

```python
from openai import OpenAI
from pydantic import BaseModel

client = OpenAI()

class TransactionAnalysis(BaseModel):
    category: str
    risk_level: str  # "low", "medium", "high"
    amount: float
    summary: str
    is_suspicious: bool

def analyze_transaction(description: str) -> TransactionAnalysis:
    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Analyze this financial transaction."},
            {"role": "user", "content": description}
        ],
        response_format=TransactionAnalysis
    )
    return response.choices[0].message.parsed
```

---

## Pattern 4: Streaming Response (for chat UI)

```python
# Backend (FastAPI)
from fastapi.responses import StreamingResponse

@app.post("/api/chat/stream")
async def chat_stream(query: Query):
    def generate():
        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": query.message}],
            stream=True
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield f"data: {chunk.choices[0].delta.content}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

```javascript
// Frontend (React)
async function streamChat(message) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    const lines = text.split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      fullText += data;
      setResponse(fullText); // Update React state
    }
  }
}
```

---

## Pattern 5: Agent with Tools

```python
# Simple tool-calling agent
import json

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_transactions",
            "description": "Search user's transaction history",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "date_range": {"type": "string", "enum": ["week", "month", "year"]}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_account_balance",
            "description": "Get current account balance",
            "parameters": {"type": "object", "properties": {}}
        }
    }
]

def run_agent(user_message: str):
    messages = [{"role": "user", "content": user_message}]
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools
    )
    
    msg = response.choices[0].message
    
    if msg.tool_calls:
        # Execute tool calls
        for tool_call in msg.tool_calls:
            fn_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)
            
            # Route to your functions
            if fn_name == "search_transactions":
                result = search_transactions(**args)  # your implementation
            elif fn_name == "get_account_balance":
                result = get_account_balance()
            
            messages.append(msg)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result)
            })
        
        # Get final response with tool results
        final = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools
        )
        return final.choices[0].message.content
    
    return msg.content
```

---

## Pattern 6: Vision / Image Analysis

```python
import base64

def analyze_image(image_path: str, question: str = "What do you see?"):
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": question},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
            ]
        }]
    )
    return response.choices[0].message.content
```

---

## Quick Setup Script

```bash
#!/bin/bash
# setup-ai.sh — Run this to set up AI dependencies
pip install openai anthropic langchain langchain-openai langchain-community chromadb fastapi uvicorn python-dotenv

# Create .env file
cat > .env << 'EOF'
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
EOF

echo "✅ AI dependencies installed. Edit .env with your API keys."
```

---

## Microsoft Azure AI (since Microsoft is a case partner)

```python
# If the case requires Azure AI services:
from openai import AzureOpenAI

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version="2024-02-01",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

# Same OpenAI API interface, just different client initialization
response = client.chat.completions.create(
    model="gpt-4o-mini",  # your Azure deployment name
    messages=[{"role": "user", "content": "Hello"}]
)
```

## N26 / Fintech Specific Patterns

```python
# Transaction categorization
CATEGORIES = ["food", "transport", "entertainment", "bills", "shopping", "income", "other"]

def categorize_transactions(transactions: list[dict]) -> list[dict]:
    """Batch categorize transactions with AI."""
    tx_text = "\n".join([f"- {t['description']}: €{t['amount']}" for t in transactions])
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "system",
            "content": f"Categorize each transaction into one of: {CATEGORIES}. Return JSON array."
        }, {
            "role": "user", 
            "content": tx_text
        }],
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)
```
