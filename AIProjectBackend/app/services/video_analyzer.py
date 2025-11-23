import cv2
import numpy as np
from deepface import DeepFace
import logging

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def analyze_video_frame(file_bytes: bytes):
    # bytes -> numpy array
    np_arr = np.frombuffer(file_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if frame is None:
        logging.error("Video frame decode edilemedi")
        return {"error": "frame_decode_failed"}

    try:
        has_face = False
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
            has_face = len(faces) > 0
        except Exception as fe:
            logging.exception("Face detection error: %s", fe)

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
            "emotions": emotions,
            "face": has_face,
        }

    except Exception as e:
        logging.exception("DeepFace analiz hatası: %s", e)
        return {"error": "deepface_error", "detail": str(e)}
