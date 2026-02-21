from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

from api.routes.feed import router as feed_router
from api.routes.causal_chain import router as causal_chain_router

app = FastAPI(title="N26 AI News Curator", version="1.0.0")

app.include_router(feed_router)
app.include_router(causal_chain_router)

@app.get("/health")
def health():
    return {"status": "ok"}
