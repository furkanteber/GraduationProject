from fastapi import APIRouter, UploadFile, File, Form
from app.services.video_analyzer import analyze_video_frame
from app.services.session_storage import save_video_result

# /stream prefix'i ile:
# POST /stream/video
video_router = APIRouter(prefix="/stream")


@video_router.post("/video")
async def stream_video(
    sessionId: str = Form(...),
    image: UploadFile = File(...),
):
    """
    Frontend'den gelen her bir JPEG frame'i (image),
    DeepFace ile analiz eder ve finalize.py'nin beklediği
    formatta session belleğine kaydeder.
    """
    file_bytes = await image.read()

    analysis = analyze_video_frame(file_bytes)

    # Eğer frame decode edilemediyse veya DeepFace hata verdiyse
    if "error" in analysis:
        return {"status": "error", "detail": analysis["error"]}

    # DeepFace'ten gelen emotions sözlüğünü float'a çevir
    emotions_raw = analysis.get("emotions", {})
    emotions = {k: float(v) for k, v in emotions_raw.items()}

    # finalize.py şu yapıyı bekliyor:
    # {
    #   "face": bool,
    #   "emotions": {...}
    # }
    frame_info = {
        "face": True,          # enforce_detection=False olduğu için basitçe True diyebiliriz
        "emotions": emotions,
    }

    # Session belleğine ekle
    save_video_result(sessionId, frame_info)

    return {
        "status": "ok",
        "analyzed": frame_info,
    }
