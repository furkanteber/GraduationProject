from collections import defaultdict
from typing import Dict, Any, List

# bellekte session bazlı veri tutuyoruz
# Örnek yapı:
# {
#   "session-id-1": {
#       "audio": [ { "score": 0.8 }, { "score": 0.75 }, ... ],
#       "video": [ { "face": True, "emotions": {...} }, ... ]
#   },
#   ...
# }

SESSIONS: Dict[str, Dict[str, List[Any]]] = defaultdict(
    lambda: {"audio": [], "video": []}
)


def add_audio_data(session_id: str, audio_item):
    
    if isinstance(audio_item, dict):
        SESSIONS[session_id]["audio"].append(audio_item)
    else:
        SESSIONS[session_id]["audio"].append({"score": float(audio_item)})


save_audio_result = add_audio_data


def add_video_data(session_id: str, frame_info: dict):

    SESSIONS[session_id]["video"].append(frame_info)


save_video_result = add_video_data



def get_session_data(session_id: str):
    return SESSIONS.get(session_id)


def clear_session(session_id: str):
    if session_id in SESSIONS:
        del SESSIONS[session_id]
