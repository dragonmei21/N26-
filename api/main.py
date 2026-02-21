from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from api.routes.feed import router as feed_router
from api.routes.causal_chain import router as causal_chain_router
from api.routes.spend_map import router as spend_map_router
from api.routes.tip import router as tip_router
from api.routes.eli10 import router as eli10_router
from api.routes.trends import router as trends_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from ingestion.scheduler import start_scheduler
        from scripts.seed_news import main as seed
        sched = start_scheduler(seed)
        yield
        sched.shutdown()
    except Exception:
        yield  # scheduler is optional — don't crash if apscheduler missing


app = FastAPI(title="N26 AI News Curator", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(feed_router)
app.include_router(causal_chain_router)
app.include_router(spend_map_router)
app.include_router(tip_router)
app.include_router(eli10_router)
app.include_router(trends_router)


@app.get("/health")
def health():
    return {"status": "ok"}
