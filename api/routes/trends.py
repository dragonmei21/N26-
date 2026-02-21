from fastapi import APIRouter

router = APIRouter(prefix="/trends", tags=["Trends"])


@router.get("")
def trends():
    return {"trending": []}
