from datetime import datetime
from typing import Optional, Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db.mongodb_connection import get_db


router = APIRouter(prefix="/interviews", tags=["Interviews"])


class InterviewStartPayload(BaseModel):
    sessionId: str
    preset: Optional[str] = None
    userEmail: Optional[str] = None
    profile: Optional[Dict[str, Any]] = None


@router.post("/start")
async def start_interview(payload: InterviewStartPayload):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    col = db["interviews"]

    base_doc = {
        "sessionId": payload.sessionId,
        "preset": payload.preset,
        "userEmail": payload.userEmail,
        "profile": payload.profile or {},
        "started_at": datetime.utcnow().isoformat() + "Z",
        "status": "in_progress",
    }

    try:
        col.update_one(
            {"sessionId": payload.sessionId},
            {
                "$setOnInsert": {
                    **base_doc,
                    "questions": [],
                    "overall_scores": None,
                }
            },
            upsert=True,
        )
        return {"ok": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to start interview")
