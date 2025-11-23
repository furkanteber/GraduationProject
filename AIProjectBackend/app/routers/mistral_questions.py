# app/mistral_model.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Dict

from app.microsoft_model import generate_interview_question

router = APIRouter(prefix="/questions")


class GenerateQuestionRequest(BaseModel):
    topic: Optional[str] = None
    level: Optional[str] = None
    role: Optional[str] = None
    question_type: Optional[str] = None
    expected_answer_type: Optional[str] = None
    interview_style: Optional[str] = None
    fast_mode: Optional[bool] = None


@router.post("/generate")
async def generate_question(payload: GenerateQuestionRequest):
    topic = payload.topic or "Genel Yazılım"
    level = payload.level or "Orta"
    role = payload.role or "Yazılım Mühendisi"
    question_type = payload.question_type or "Teknik derinlemesine"
    expected_answer_type = payload.expected_answer_type or "Kod örneği"
    interview_style = payload.interview_style or "Profesyonel teknik"

    try:
        result = generate_interview_question(
            topic=topic,
            level=level,
            role=role,
            question_type=question_type,
            expected_answer_type=expected_answer_type,
            interview_style=interview_style,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Question generation failed")

    question_tr = result.get("turkish_question") or ""
    question_en = result.get("english_question") or ""

    question_doc: Dict[str, Any] = {
        "topic": result.get("topic", topic),
        "question": question_tr or question_en,
        "answer": question_en or question_tr,
        "metadata": result.get("metadata") or {},
    }

    return [question_doc]
