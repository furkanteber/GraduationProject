import json
import os
from fastapi import APIRouter
from app.services.session_storage import get_session_data, clear_session

finalize_router = APIRouter()

RESULTS_DIR = "results"

os.makedirs(RESULTS_DIR, exist_ok=True)


@finalize_router.get("/finalize-session")
def finalize_session(sessionId: str):
    data = get_session_data(sessionId)

    if not data:
        return {"error": "Session not found"}

    audio_chunks = data["audio"]
    video_frames = data["video"]

    audio_values = [item["score"] for item in audio_chunks if "score" in item]
    audio_avg = sum(audio_values) / len(audio_values) if audio_values else 0.0

    if not video_frames:
        video_score = 0
        final_score = audio_avg * 0.6

        result_json = {
            "sessionId": sessionId,
            "audio_avg": audio_avg,
            "video_score": 0,
            "final_score": final_score,
            "detail": {}
        }

        path = os.path.join(RESULTS_DIR, f"{sessionId}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(result_json, f, ensure_ascii=False, indent=4)

        clear_session(sessionId)
        return result_json

    positive_scores = [
        f["emotions"].get("happy", 0) + f["emotions"].get("neutral", 0)
        for f in video_frames
    ]
    positive_avg = sum(positive_scores) / len(positive_scores)

    stress_scores = [
        f["emotions"].get("sad", 0)
        + f["emotions"].get("angry", 0)
        + f["emotions"].get("fear", 0)
        for f in video_frames
    ]
    stress_avg = sum(stress_scores) / len(stress_scores)

    face_detect_count = sum(1 for f in video_frames if f["face"])
    focus_score = (face_detect_count / len(video_frames)) * 100

    stability_values = []
    for i in range(1, len(positive_scores)):
        diff = abs(positive_scores[i] - positive_scores[i - 1])
        stability_values.append(diff)

    stability_score = 100 - (sum(stability_values) / len(stability_values)) if stability_values else 100

    video_score = (
        positive_avg * 0.4 +
        focus_score * 0.2 +
        stability_score * 0.2 +
        (100 - stress_avg) * 0.2
    )

    final_score = audio_avg * 0.6 + video_score * 0.4

    result_json = {
        "sessionId": sessionId,
        "audio_avg": audio_avg,
        "video_score": video_score,
        "final_score": final_score,
        "detail": {
            "positive_avg": positive_avg,
            "stress_avg": stress_avg,
            "focus_score": focus_score,
            "stability_score": stability_score
        }
    }

    path = os.path.join(RESULTS_DIR, f"{sessionId}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(result_json, f, ensure_ascii=False, indent=4)


    clear_session(sessionId)

    return result_json
