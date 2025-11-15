import cv2
import numpy as np
from deepface import DeepFace

def analyze_video_frame(file_bytes: bytes):
    # bytes -> numpy array
    np_arr = np.frombuffer(file_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if frame is None:
        return {"error": "Frame decode edilemedi."}

    try:
        result = DeepFace.analyze(
            frame,
            actions=['emotion'],
            enforce_detection=False
        )

        if isinstance(result, list):
            result = result[0]

        emotions = result["emotion"]
        dominant = result["dominant_emotion"]

        return {
            "dominant": dominant,
            "emotions": emotions
        }

    except Exception as e:
        return {"error": str(e)}
