from datetime import datetime
from typing import Optional, Any, Dict, List
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.db.mongodb_connection import get_db
from app.services.media_storage import (
    get_recording_path, 
    RECORDINGS_DIR,
    finalize_question_recording,
    get_question_media_paths,
)


router = APIRouter(prefix="/interviews", tags=["Interviews"])


# ─────────────────────────────────────────────────────────────────────────────
# Tüm mülakatları listele
# ─────────────────────────────────────────────────────────────────────────────
@router.get("")
async def list_interviews(
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None, description="Filter by status: in_progress, completed"),
    user_email: Optional[str] = Query(None, alias="userEmail"),
) -> List[dict]:
    """Kayıtlı tüm mülakatları listeler."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if user_email:
        query["userEmail"] = user_email

    docs = list(
        db["interviews"]
        .find(query, {"_id": 0})
        .sort("started_at", -1)
        .limit(limit)
    )
    return docs


# ─────────────────────────────────────────────────────────────────────────────
# Tek mülakat detayı
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{session_id}")
async def get_interview(session_id: str) -> dict:
    """Belirli bir mülakatın detaylarını döndürür."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    doc = db["interviews"].find_one({"sessionId": session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Interview not found")
    return doc


# ─────────────────────────────────────────────────────────────────────────────
# Mülakat sil
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/{session_id}")
async def delete_interview(session_id: str):
    """Belirtilen mülakatı siler."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    result = db["interviews"].delete_one({"sessionId": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Interview not found")
    return {"ok": True, "deleted": session_id}


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


# ─────────────────────────────────────────────────────────────────────────────
# Mülakat kaydı bilgisi
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{session_id}/recording")
async def get_interview_recording(session_id: str):
    """Mülakat ses/video kayıt dosyalarının bilgilerini döndürür."""
    recording = get_recording_path(session_id)
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    return recording


# ─────────────────────────────────────────────────────────────────────────────
# Ses kaydını indir
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{session_id}/recording/audio")
async def download_audio_recording(session_id: str):
    """Mülakat ses kaydını indir."""
    recording = get_recording_path(session_id)
    if not recording or "audio_path" not in recording:
        raise HTTPException(status_code=404, detail="Audio recording not found")
    
    audio_path = Path(recording["audio_path"])
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(
        path=str(audio_path),
        filename=f"{session_id}_audio.webm",
        media_type="audio/webm"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Video kaydını indir
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{session_id}/recording/video")
async def download_video_recording(session_id: str):
    """Mülakat video kaydını indir."""
    recording = get_recording_path(session_id)
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    # MP4 varsa onu döndür
    if "video_path" in recording:
        video_path = Path(recording["video_path"])
        if video_path.exists() and video_path.suffix == ".mp4":
            return FileResponse(
                path=str(video_path),
                filename=f"{session_id}_video.mp4",
                media_type="video/mp4"
            )
    
    raise HTTPException(status_code=404, detail="Video recording not found")


# ─────────────────────────────────────────────────────────────────────────────
# Soru bazlı kayıt analizi
# ─────────────────────────────────────────────────────────────────────────────
class QuestionAnalyzeRequest(BaseModel):
    questionIndex: int
    questionText: Optional[str] = None
    expectedAnswer: Optional[str] = None
    userAnswer: Optional[str] = None
    durationSeconds: Optional[int] = None


@router.post("/{session_id}/question/analyze")
async def analyze_question_recording(session_id: str, request: QuestionAnalyzeRequest):
    """
    Belirli bir sorunun ses ve video kayıtlarını birleştir, analiz et ve sonucu döndür.
    Soru bittiğinde frontend tarafından çağrılır.
    """
    from app.services.audio_pipeline import analyze_audio_file
    from app.services.video_analyzer import analyze_video_frames_batch
    
    q_idx = request.questionIndex
    
    # Kayıtları birleştir ve kaydet
    recording_info = finalize_question_recording(session_id, q_idx)
    
    if "error" in recording_info:
        return {"error": recording_info["error"], "questionIndex": q_idx}
    
    # Ses analizi
    audio_analysis = None
    if recording_info.get("audio_path"):
        try:
            audio_path = Path(recording_info["audio_path"])
            if audio_path.exists():
                audio_analysis = analyze_audio_file(str(audio_path))
        except Exception as e:
            print(f"[question_analyze] Ses analizi hatası: {e}")
    
    # Video analizi
    video_analysis = None
    if recording_info.get("video_path"):
        try:
            video_path = Path(recording_info["video_path"])
            # Eğer frames klasörüyse frame'leri analiz et
            if video_path.is_dir():
                frames = sorted(video_path.glob("frame_*.jpg"))
                if frames:
                    video_analysis = analyze_video_frames_batch([str(f) for f in frames])
        except Exception as e:
            print(f"[question_analyze] Video analizi hatası: {e}")
    
    # Sonucu MongoDB'ye kaydet
    db = get_db()
    if db is not None:
        question_result = {
            "index": q_idx,
            "question": request.questionText,
            "answer": request.userAnswer,
            "expectedAnswer": request.expectedAnswer,
            "duration_seconds": request.durationSeconds,
            "recording": recording_info,
            "audio_analysis": audio_analysis,
            "video_analysis": video_analysis,
            "analyzed_at": datetime.utcnow().isoformat() + "Z",
        }
        
        try:
            db["interviews"].update_one(
                {"sessionId": session_id},
                {"$push": {"questions": question_result}}
            )
        except Exception as e:
            print(f"[question_analyze] MongoDB güncelleme hatası: {e}")
    
    return {
        "success": True,
        "questionIndex": q_idx,
        "recording": recording_info,
        "audio_analysis": audio_analysis,
        "video_analysis": video_analysis,
    }
