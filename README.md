<div align="center">
  <img src="https://n26.com/assets/images/brand/N26-Logo.svg" alt="N26 Logo" width="100"/>
  <h1>N26 AI Financial News Curator</h1>
  <p><em>Empowering retail investors to navigate complex macroeconomic events through AI-driven, highly personalized causal chains.</em></p>
</div>

---

## 💡 The Problem
In an increasingly volatile macro environment, everyday retail investors are overwhelmed by continuous financial news. While professional traders have teams of analysts deciphering what a 50bps rate cut implies for the housing market, retail investors are left asking: **"How does this news impact *my* portfolio and *my* spending power?"**

## 🚀 Our Solution: The AI Financial News Curator
We built a unified platform that bridges the gap between global macroeconomic events and personal retail finance. Our AI doesn't just summarize articles; it **reasons** through the economic ripple effects (the "Causal Chain") of an event, correlates it against 30-day live market data, and contextualizes the final impact in terminology a retail investor intrinsically understands.

### ✨ Key Features
1. **Personalized Relevance Scoring**: Analyzes a user's transaction history (e.g., spending heavily on tech subscriptions vs. commuting) to rank daily news based on direct personal impact.
2. **AI Causal Chain Engine**: Uses GPT-4o to dynamically break down complex events into digestible, 1-to-4 step economic ripple effects explaining *Mechanism*, *Affected Entity*, and *Directional Impact*.
3. **Live Market Enrichment**: Correlates the AI's causal logic against real-time 30-day historical stock price movements using the `yfinance` integration.
4. **Immersive Audio Summaries**: Transforms dense financial reports into generated conversational podcast segments using OpenAI's TTS engine.
5. **Interactive UI**: A sleek, beautifully animated interface that unveils complex financial logic step-by-step through interactive node exploration.

---

## 🏗️ Technical Architecture
We opted for a highly decoupled client-server architecture to ensure the AI pipeline scale independently from the client application.

### Backend (The Brain)
Built entirely in **Python** using **FastAPI** to maximize speed and async data generation.
- **RAG & Profiling module**: Ingests user spending context to formulate personalized prompts.
- **Macro Reasoning Engine (`Causal Chain`)**: Interfaces with GPT-4o using strictly typed definitions (Pydantic `BaseModel`) to guarantee structured, predictable JSON output that forces the LLM to provide multi-step logical chains alongside confidence scores.
- **Price Correlator**: Intercepts the generated chain, queries `yfinance` to grab 30-day rolling data for impacted asset tickers, and calculates post-event percentage swings to statistically validate the LLM's thesis.
- **Aggressive Caching**: A custom in-memory TTL mechanism ensuring expensive LLM and finance API calls are cached for high-traffic scalability.

### Frontend (The Interface)
Built using **React (Vite), TypeScript,** and **Tailwind CSS**.
- **Framer Motion**: Extensive complex orchestrations to visualize the economic causal pipelines gracefully.
- **Componentized Design**: Modular abstractions isolating complex data hooks (e.g. merging CoinGecko live pricing with our bespoke backend endpoints).
- **Type Safety assured**: End-to-end interface alignment between FastAPI Pydantic definitions and TypeScript types to avoid runtime parsing crashes.

---

## 🛠️ Technology Stack

| Domain | Technologies |
| --- | --- |
| **Frontend Framework** | React 18, Vite, TypeScript |
| **UI Ecosystem**| Tailwind CSS, Shadcn-ui, Framer Motion, Lucide |
| **Backend Core** | Python, FastAPI, Uvicorn, Pydantic |
| **AI Intelligence** | OpenAI (`gpt-4o`, `gpt-4o-mini`, `tts-1`) |
| **Financial Data** | `yfinance` (Backend), CoinGecko (Frontend) |

---

## 📈 Impact & Future Roadmap
This prototype proves that complex banking orchestration systems can move beyond simple transactional interfaces into true advisory territory. 

**What's next?**
- Embedding native broker APIs to allow direct execution of the AI's suggestions.
- Fully integrating the causal engine to analyze individual risk exposure in highly diverse institutional portfolios.

*Built with passion for transforming how the modern retail investor experiences financial intelligence.*
