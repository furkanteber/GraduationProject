from fastapi import APIRouter, UploadFile, File, Form
from app.services.audio_pipeline import analyze_audio_chunk
from app.services.session_storage import add_audio_data

audio_router = APIRouter()

@audio_router.post("/stream/audio")
async def stream_audio(
    sessionId: str = Form(...),
    chunk: UploadFile = File(...)
):
    raw_bytes = await chunk.read()

    result = analyze_audio_chunk(raw_bytes)

    add_audio_data(sessionId, result)

    return {"success": True, "data": result}
