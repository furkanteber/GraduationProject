from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form
from app.services.audio_pipeline import analyze_audio_chunk
from app.services.session_storage import add_audio_data
from app.services.media_storage import save_audio_chunk, get_chunk_count

# prefix ile önce /stream gelsin ve sonra çalışsın:
audio_router = APIRouter(prefix="/stream")


@audio_router.post("/audio")
async def stream_audio(
    sessionId: str = Form(...),
    audio: UploadFile = File(...),
    questionIndex: Optional[int] = Form(None),
):
    """
    ön yüzden 15 sn'lik audio webm chunkları alır
    analyze_audio_chunk ile analiz eder ve sonucu session belleğine yazar.
    Ayrıca ses verisini dosya olarak kaydeder (soru bazlı).
    """
    raw_bytes = await audio.read()
    
    q_idx = questionIndex if questionIndex is not None else -1

    # Ses chunk'ını dosyaya kaydet (soru bazlı)
    chunk_index = get_chunk_count(sessionId, "audio", q_idx)
    save_audio_chunk(sessionId, raw_bytes, chunk_index, q_idx)

    # Ses analizi audio_pipeline'ındaki fonksiyon
    result = analyze_audio_chunk(raw_bytes)

    # Sonucu sessiona ekle
    add_audio_data(sessionId, result)

    return {"success": True, "data": result, "chunk_saved": chunk_index, "questionIndex": q_idx}
