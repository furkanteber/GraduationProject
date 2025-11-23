from fastapi import APIRouter, HTTPException
from typing import List

from app.db.mongodb_connection import get_db

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.get("/results")
async def list_session_results(limit: int = 50) -> List[dict]:
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    docs = list(
        db["sessionResults"].find({}, {"_id": 0}).sort("sessionId", -1).limit(limit)
    )
    return docs


@router.get("/results/{session_id}")
async def get_session_result(session_id: str) -> dict:
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    doc = db["sessionResults"].find_one({"sessionId": session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session result not found")
    return doc
