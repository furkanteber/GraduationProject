from fastapi import APIRouter, UploadFile, File, Form
from app.services.video_analyzer import analyze_video_frame
from app.services.session_storage import save_video_result

video_router = APIRouter(prefix="/stream")


@video_router.post("/video")
async def stream_video(
    sessionId: str = Form(...),
    frame: UploadFile = File(...)
):
    file_bytes = await frame.read()
    result = analyze_video_frame(file_bytes)

    if "error" not in result:
        save_video_result(sessionId, result["emotions"])

    return {"status": "ok", "analyzed": result}
