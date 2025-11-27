from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

from app.db.mongodb_connection import get_db


class AnswerPayload(BaseModel):
    sessionId: Optional[str] = None
    question: str
    answer: str
    topic: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


router = APIRouter(prefix="/answers", tags=["Answers"])


@router.post("")
async def save_answer(payload: AnswerPayload):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    doc = {
        "sessionId": payload.sessionId,
        "question": payload.question,
        "answer": payload.answer,
        "topic": payload.topic,
        "metadata": payload.metadata or {},
    }

    try:
        result = db["answers"].insert_one(doc)

        #ilgili interview kaydına bu soruyu ekle
        if payload.sessionId:
            try:
                interviews_col = db["interviews"]
                meta = payload.metadata or {}

                duration_seconds = meta.get("durationSeconds") or 0
                answer_text = payload.answer or ""
                num_tokens = len(str(answer_text).split())

                #bir soru skoru süre ve metin uzunluğunu 0-100 arası normalize et
                try:
                    duration_norm = min(max(float(duration_seconds), 0.0) / 120.0, 1.0)
                except Exception:
                    duration_norm = 0.0

                text_norm = min(float(num_tokens), 60.0) / 60.0 if num_tokens > 0 else 0.0

                question_score = round((duration_norm * 100.0) * 0.5 + (text_norm * 100.0) * 0.5, 2)
                meta["questionScore"] = question_score

                question_entry = {
                    "index": meta.get("questionIndex"),
                    "topic": payload.topic,
                    "question": payload.question,
                    "answer": payload.answer,
                    "duration_seconds": meta.get("durationSeconds"),
                    "saved_at": datetime.utcnow().isoformat() + "Z",
                    "metadata": meta,
                    "score": question_score,
                }
                interviews_col.update_one(
                    {"sessionId": payload.sessionId},
                    {"$push": {"questions": question_entry}},
                    upsert=False,
                )
            except Exception as e:
                print(f"[MongoDB] interviews update error: {e}")

        return {"id": str(result.inserted_id)}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to save answer")
