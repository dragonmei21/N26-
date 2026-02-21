from fastapi import APIRouter

router = APIRouter(prefix="/eli10", tags=["ELI10"])


@router.get("/{concept}")
def eli10(concept: str):
    return {"concept": concept, "eli10": "Coming soon."}
