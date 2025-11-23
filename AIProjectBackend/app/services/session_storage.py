from typing import Dict, Any, List
from app.db.mongodb_connection import get_db


def _get_collection():
    db = get_db()
    if db is None:
        return None
    return db["sessions"]


def add_audio_data(session_id: str, audio_item):
    col = _get_collection()
    if col is None:
        return

    if isinstance(audio_item, dict):
        item = audio_item
    else:
        item = {"score": float(audio_item)}

    col.update_one(
        {"sessionId": session_id},
        {"$setOnInsert": {"sessionId": session_id}, "$push": {"audio": item}},
        upsert=True,
    )


save_audio_result = add_audio_data


def add_video_data(session_id: str, frame_info: dict):
    col = _get_collection()
    if col is None:
        return

    col.update_one(
        {"sessionId": session_id},
        {"$setOnInsert": {"sessionId": session_id}, "$push": {"video": frame_info}},
        upsert=True,
    )


save_video_result = add_video_data


def get_session_data(session_id: str):
    col = _get_collection()
    if col is None:
        return None

    doc = col.find_one({"sessionId": session_id}, {"_id": 0})
    if not doc:
        return None

    audio = doc.get("audio", [])
    video = doc.get("video", [])
    return {"audio": audio, "video": video}


def clear_session(session_id: str):
    col = _get_collection()
    if col is None:
        return

    col.delete_one({"sessionId": session_id})
