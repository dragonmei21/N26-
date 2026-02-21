# Data Flow
**Tracing data from raw news to personalized visual insight**

---

## Flow 1: News Ingestion (Background, every 15 min)

```
TRIGGER: APScheduler fires
    │
    ▼
fetcher.py
  - GET https://newsapi.org/v2/top-headlines?category=business&language=en
  - GET https://gnews.io/api/v4/search?q=finance+ECB+crypto
  - GET https://query1.finance.yahoo.com/v1/finance/news  (RSS parse)
  - Result: List[RawArticle]
    │
    ▼
cleaner.py
  - Strip HTML tags
  - Remove boilerplate ("Subscribe to read more...")
  - Normalize quotes, whitespace
  - Detect language (keep EN, ES, DE only)
  - Result: List[CleanArticle]
    │
    ▼
chunker.py
  - Split article body into 300-token chunks
  - 50-token overlap between chunks
  - Each chunk carries: {article_id, chunk_index, title, url, published_at}
  - Result: List[Chunk]
    │
    ▼
embedder.py
  - Load sentence-transformers/all-MiniLM-L6-v2
  - Batch encode all chunks (batch_size=32)
  - Result: List[EmbeddedChunk] (chunk + 384-dim vector)
    │
    ▼
indexer.py
  - Upsert to ChromaDB collection "financial_news"
  - Dedup by article_id (don't re-index same article)
  - Prune articles older than 72 hours
  - Log: "{n} articles indexed, {m} skipped (duplicate)"
```

---

## Flow 2: User Feed Request

```
REQUEST: GET /feed?user_id=mock_user_1
    │
    ▼
[Spend Profile Load]
spend/parser.py
  - Load mock_transactions.json for user_id
  - Result: List[Transaction]
    │
    ▼
spend/categorizer.py
  - Map each merchant to category using lookup table
  - Ryanair → "travel", "aviation", "fuel"
  - Amazon → "ecommerce", "tech", "AMZN"
  - Fallback: OpenAI function call if not in lookup (optional)
  - Result: List[CategorizedTransaction]
    │
    ▼
spend/profiler.py
  - Aggregate by category, weight by recency + amount
  - Recent (7d) transactions weighted 2x vs older
  - Result: WeightedInterestProfile
  {
    "interests": {"travel": 0.85, "grocery": 0.72, ...},
    "raw_spend": [...]
  }
    │
    ▼
[Relevance Scoring]
relevance/scorer.py
  - Embed user interest vector (weighted average of category embeddings)
  - Query ChromaDB: top-30 chunks by cosine similarity
  - Group chunks back to articles
  - Score each article: 0.6*semantic + 0.4*category_overlap
  - Result: List[ScoredArticle] sorted by score desc
    │
    ▼
relevance/ranker.py
  - Take top 8 articles
  - Ensure category diversity (max 3 per category)
  - Flag trending articles (from trends service)
  - Result: List[RankedArticle] (8 items)
    │
    ▼
[RAG Enrichment — parallel for each article]
rag/retriever.py
  - For each article: fetch top-3 most relevant chunks
  - Also fetch article metadata

rag/prompt_builder.py
  - Build system prompt (see PROMPT_TEMPLATES below)
  - Inject: article chunks + user spend context
  
rag/llm_client.py
  - POST to Anthropic API
  - Model: claude-sonnet-4-6
  - Temperature: 0.2
  - Max tokens: 400
  - Structured output: JSON mode

rag/response_parser.py
  - Validate JSON schema with Pydantic
  - Extract: plain_english, for_you, confidence
  - Reject/retry if confidence fields missing
  
rag/citation_tracker.py
  - Map each claim to source chunk URL
  - Build sources[] array
  - Result: EnrichedArticle
    │
    ▼
[Visualization Formatting]
viz/formatters.py
  - Determine chart type per article category:
    macro → line_chart (rate history)
    crypto → sparkline (price 7d)
    etf → comparison_bar (fund weights)
    stocks → line_chart (price vs index)
  - Fetch required time-series data (Yahoo Finance / ECB API)
  - Shape into chart JSON contracts
  - Result: EnrichedArticle + visualization block
    │
    ▼
[Response Assembly]
api/routes/feed.py
  - Combine all enriched articles
  - Add trending_topics from trend service
  - Add daily_tip from tip service
  - Serialize to FeedResponse Pydantic model
  - Return JSON

RESPONSE TIME TARGET: < 4 seconds
  - Spend profile load: ~50ms
  - ChromaDB query: ~200ms  
  - RAG calls (8 parallel): ~2s (dominant)
  - Viz data fetch: ~500ms (cached where possible)
  - Assembly: ~50ms
```

---

## Flow 3: ELI10 Request

```
REQUEST: GET /eli10/interest_rate
    │
    ▼
Check cache (in-memory dict, TTL 1 hour)
  - If hit: return cached
  - If miss: continue
    │
    ▼
rag/prompt_builder.py
  - Build ELI10 prompt (see template below)
  - Include: concept name + user's relevant spend context

rag/llm_client.py  
  - Single call, temperature 0.4 (slightly more creative)
  - Max tokens: 200

viz/formatters.py
  - Format simple_number card
  - Pull live rate if available (ECB API for rates, Yahoo for prices)
    │
    ▼
Cache result + return
```

---

## Flow 4: Trend Detection (Background, every 30 min)

```
TRIGGER: APScheduler
    │
    ▼
trends/counter.py
  - Query ChromaDB: articles from last 6 hours
  - Extract topics via NER / keyword extraction
  - Count frequency per topic
  - Compare to frequency from 24h prior window
    │
    ▼
trends/spike_detector.py
  - spike = current_count / baseline_count > 2.0
  - Store in trends_cache dict: {topic: TrendData}
    │
    ▼
trends/momentum.py
  - Calculate acceleration: is the spike growing or decelerating?
  - Score 0-1 for each trending topic
```

---

## Prompt Templates

### System Prompt (all RAG calls)
```
You are a financial education assistant inside the N26 banking app. 
Your job is to make financial news understandable to everyday people.

Rules:
1. NEVER fabricate statistics or prices. If unsure, say "according to sources"
2. Always explain WHY something matters to the specific user
3. Keep plain_english to 1-2 sentences max
4. Keep for_you to 1 sentence directly referencing their spending
5. Set confidence: "high" if 2+ sources, "medium" if 1 source, "low" if none
6. Always include disclaimer: "Educational only, not financial advice."
7. Respond ONLY in valid JSON matching the schema provided.
```

### User Prompt Template (feed enrichment)
```
Article to summarize:
Title: {title}
Content: {chunks_text}
Published: {published_at}
Source: {source_name}

User context:
- Top spending categories: {interests_summary}
- Recent relevant transaction: {most_relevant_transaction}
- Savings balance (approx): {savings_balance_bucket} (low/medium/high)

Respond with:
{
  "plain_english": "...",
  "for_you": "...",
  "confidence": "high|medium|low",
  "disclaimer": "Educational only, not financial advice."
}
```

### ELI10 Prompt Template
```
Explain "{concept}" to someone who has never studied finance.
Use a simple analogy involving everyday money situations.
Include one concrete example using small amounts (€50-€500).
Be warm, encouraging, never condescending.

User context: {relevant_spend_context}

Respond with:
{
  "eli10": "...(2-3 sentences)...",
  "real_world_example": "...(1 sentence with €amount)..."
}
```

---

## Mock Data Structure

```json
// mock_transactions.json
{
  "user_id": "mock_user_1",
  "name": "Alex",
  "savings_balance": 1200,
  "transactions": [
    {
      "id": "txn_001",
      "date": "2026-02-18",
      "merchant": "Ryanair",
      "amount": -89.99,
      "currency": "EUR",
      "category_raw": "travel"
    },
    {
      "id": "txn_002", 
      "date": "2026-02-15",
      "merchant": "Mercadona",
      "amount": -67.40,
      "currency": "EUR",
      "category_raw": "groceries"
    },
    {
      "id": "txn_003",
      "date": "2026-02-10",
      "merchant": "Amazon",
      "amount": -124.00,
      "currency": "EUR",
      "category_raw": "shopping"
    },
    {
      "id": "txn_004",
      "date": "2026-02-08",
      "merchant": "Iberdrola",
      "amount": -78.50,
      "currency": "EUR",
      "category_raw": "utilities"
    },
    {
      "id": "txn_005",
      "date": "2026-02-05",
      "merchant": "Ryanair",
      "amount": -250.00,
      "currency": "EUR",
      "category_raw": "travel"
    }
  ]
}
```
