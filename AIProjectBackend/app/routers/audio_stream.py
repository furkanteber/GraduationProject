from fastapi import APIRouter, UploadFile, File, Form
from app.services.audio_pipeline import analyze_audio_chunk
from app.services.session_storage import add_audio_data

# /stream prefix'i ile çalışsın:
# POST /stream/audio
audio_router = APIRouter(prefix="/stream")


@audio_router.post("/audio")
async def stream_audio(
    sessionId: str = Form(...),
    audio: UploadFile = File(...),
):
    """
    Frontend'den 15 sn'lik audio webm chunk'ları alır,
    analyze_audio_chunk ile analiz eder ve sonucu session belleğine yazar.
    """
    raw_bytes = await audio.read()

    # Ses analizi (kendi audio_pipeline'ındaki fonksiyon)
    result = analyze_audio_chunk(raw_bytes)

    # Sonucu session'a ekle (dict veya score olabilir, session_storage bunu kaldırıyor)
    add_audio_data(sessionId, result)

    return {"success": True, "data": result}
