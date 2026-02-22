# Technology Stack

The project relies on a modern, fast, and scalable technology stack, selected intentionally to balance rapid prototyping (Hackathon mode) with robust structural design.

## Frontend (Client-Side)

- **Framework**: React 18
- **Build Tool**: Vite (Extremely fast Hot Module Replacement)
- **Language**: TypeScript (Provides strict typing, interfaces for API responses like `MacroEvent` and `CausalStep`)
- **Styling**: Tailwind CSS (Utility-first CSS for rapid, responsive UI development without leaving the JSX)
- **Animations**: Framer Motion (Used extensively in the `CausalChainView` to smoothly reveal complex economic steps one by one)
- **Icons**: Lucide React (Clean, minimalist SVG icons)
- **Routing/State**: Standard React Hooks & Context APIs.

## Backend (Server-Side)

- **Framework**: FastAPI (Python)
  - Selected for its async capabilities, auto-generated OpenAPI documentation, and massive speed advantages over Flask/Django for building robust APIs.
- **Server**: Uvicorn (ASGI server for running FastAPI)
- **Data Validation**: Pydantic
  - Defines strict schemas for both the API payloads and the structured JSON objects requested from the LLM (e.g., `MacroEvent`, `CausalChainResponse`).

## AI & APIs

- **Core Intelligence**: OpenAI API
  - `gpt-4o`: Used for complex, logic-heavy generation tasks requiring high coherence (e.g., The Causal Chain generation).
  - `gpt-4o-mini`: Used for faster, cheaper tasks like initial event classification or summarization.
  - `tts-1`: The OpenAI Text-to-Speech model used to power the Podcast audio generation.
- **Financial Data**: `yfinance`
  - A Python library acting as a wrapper for the Yahoo Finance API. Used to validate causal chains by pulling live 30-day historical stock prices for entities mentioned in the news.

## Infrastructure & Environment

- **Package Management**:
  - `npm` for the frontend Node dependencies.
  - `pip` / `venv` for the isolated Python ecosystem.
- **Caching**: Custom built in-memory TTL mechanism (`cache/store.py`) to minimize external API costs and improve response times.
- **Version Control**: Git / GitHub.
