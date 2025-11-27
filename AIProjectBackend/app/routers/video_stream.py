from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form
from app.services.video_analyzer import analyze_video_frame
from app.services.session_storage import save_video_result
from app.services.media_storage import save_video_frame, get_chunk_count

# /stream prefixi
video_router = APIRouter(prefix="/stream")


@video_router.post("/video")
async def stream_video(
    sessionId: str = Form(...),
    image: UploadFile = File(...),
    questionIndex: Optional[int] = Form(None),
):
    """
    Frontend'den gelen her bir JPEG frame'i (image),
    DeepFace ile analiz eder ve finalize.py'nin beklediği
    formatta session belleğine kaydeder.
    Ayrıca frame'i dosya olarak kaydeder (soru bazlı).
    """
    file_bytes = await image.read()
    
    q_idx = questionIndex if questionIndex is not None else -1

    # Video frame'ini dosyaya kaydet (soru bazlı)
    frame_index = get_chunk_count(sessionId, "video", q_idx)
    save_video_frame(sessionId, file_bytes, frame_index, q_idx)

    analysis = analyze_video_frame(file_bytes)

    # eğer frame decode edilemediyse veya DeepFace hata verdiyse
    if "error" in analysis:
        return {"status": "error", "detail": analysis["error"]}

    # DeepFaceten gelen emotions sözlüğünü floata çevir
    emotions_raw = analysis.get("emotions", {})
    emotions = {k: float(v) for k, v in emotions_raw.items()}

    has_face = bool(analysis.get("face", False))

    frame_info = {
        "face": has_face,
        "emotions": emotions,
    }

    # session belleğine ekle
    save_video_result(sessionId, frame_info)

    return {
        "status": "ok",
        "analyzed": frame_info,
    }
