from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

from api.routes.feed import router as feed_router

app = FastAPI(title="N26 AI News Curator", version="1.0.0")

app.include_router(feed_router)


@app.get("/health")
def health():
    return {"status": "ok"}
