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


def analyze_video_frames_batch(frame_paths: list) -> dict:
    """
    Birden fazla video frame'ini analiz et ve özet istatistikler döndür.
    """
    if not frame_paths:
        return {"error": "no_frames"}
    
    emotions_sum = {}
    face_detected_count = 0
    total_frames = len(frame_paths)
    analyzed_frames = 0
    
    for frame_path in frame_paths:
        try:
            with open(frame_path, "rb") as f:
                file_bytes = f.read()
            
            result = analyze_video_frame(file_bytes)
            
            if "error" not in result:
                analyzed_frames += 1
                
                if result.get("face"):
                    face_detected_count += 1
                
                emotions = result.get("emotions", {})
                for emotion, value in emotions.items():
                    if emotion not in emotions_sum:
                        emotions_sum[emotion] = 0
                    emotions_sum[emotion] += value
        
        except Exception as e:
            logging.warning(f"Frame analiz hatası ({frame_path}): {e}")
            continue
    
    if analyzed_frames == 0:
        return {"error": "no_frames_analyzed", "total_frames": total_frames}
    
    # Ortalama duygu değerleri
    emotions_avg = {k: v / analyzed_frames for k, v in emotions_sum.items()}
    
    # Dominant duygu
    dominant_emotion = max(emotions_avg, key=emotions_avg.get) if emotions_avg else None
    
    # Pozitiflik ve stres skorları
    positive_score = emotions_avg.get("happy", 0) + emotions_avg.get("neutral", 0)
    stress_score = emotions_avg.get("sad", 0) + emotions_avg.get("angry", 0) + emotions_avg.get("fear", 0)
    
    # Odaklanma skoru (yüz algılama oranı)
    focus_score = (face_detected_count / total_frames) * 100 if total_frames > 0 else 0
    
    return {
        "total_frames": total_frames,
        "analyzed_frames": analyzed_frames,
        "face_detected_count": face_detected_count,
        "focus_score": focus_score,
        "dominant_emotion": dominant_emotion,
        "emotions_avg": emotions_avg,
        "positive_score": positive_score,
        "stress_score": stress_score,
    }
