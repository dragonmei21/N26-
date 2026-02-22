# Technical Architecture

The N26 AI Financial News Curator features a decoupled client-server architecture. The backend acts as a brain (ingesting, profiling, and reasoning), while the frontend provides a rich, responsive interface.

## High-Level Data Flow

1. **News Ingestion & Cleaning**: Background scripts gather recent articles from static fallbacks or live feeds, cleaning the text for LLM consumption.
2. **Profiling (The Context)**: For a given `user_id`, the system analyzes mock transaction data to generate a "Spend Summary".
3. **Relevance Scoring**: An algorithm (or LLM prompt) compares the cleaned articles against the user's spend summary to assign a relevance score.
4. **Macro Reasoning (The Core AI)**: For top articles, the system triggers the `generate_causal_chain` pipeline. An LLM determines if it's a "macro event," and if so, constructs a 1-to-4 step JSON array explaining the economic ripple effect.
5. **Price Enrichment**: The resulting causal steps are passed through `yfinance`, pulling live (or cached/mocked) 30-day timeline data for relevant stock tickers mentioned in the chain.
6. **Delivery**: The synthesized data is served to the frontend via RESTful FastAPI endpoints.

---

## Backend Sub-Systems (Python / FastAPI)

- **`api/routes/`**: Contains the FastAPI routers mapping HTTP methods to the underlying systems (`feed.py`, `causal_chain.py`, `podcast.py`, etc.).
- **`rag/` (Retrieval-Augmented Generation)**:
  - `llm_client.py`: Singleton manager and helper functions (`complete_json`) for communicating with OpenAI.
  - `event_classifier.py`: Evaluates an article's text to determine if it is a macro event.
  - `causal_chain.py`: Crafts the complex prompt rules (max 4 steps, tight confidence requirements) to map economic chains.
  - `price_correlator.py`: Interfaces with the Yahoo Finance API (`yfinance`) to fetch historical market data.
- **`audio/`**: 
  - Generates cohesive scripts from the news feed (`script_generator.py`) and converts them to audio bytes using OpenAI's TTS engine (`tts_engine.py`).
- **`cache/`**: An aggressive in-memory TTL caching layer to prevent duplicate, expensive LLM calls during hackathon demos and high-traffic bursts.

---

## Frontend Architecture (React / TypeScript)

- **`src/lib/api.ts`**: The centralized fetch layer that communicates with the Python backend. Handles the merging of dynamically fetched feed data with guaranteed "Hero Events."
- **`src/components/`**: Modular React components.
  - `MacroTab.tsx`: The primary dashboard coordinating the Feed and Event Cards.
  - `EventCard.tsx`: Displays individual news items.
  - `CausalChainView.tsx`: The complex, animated UI that visualizes the 4-step reasoning process using Framer Motion.
  - `AudioSummarySheet.tsx`: The sticky audio player for podcast playback.
- **State Management**: Uses React Hooks (`useState`, `useEffect`, `useContext` for notifications) to manage UI states and async data fetching.
