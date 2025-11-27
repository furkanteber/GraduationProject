import json
import os
from datetime import datetime
from fastapi import APIRouter
from app.services.session_storage import get_session_data, clear_session
from app.services.text_features import analyze_texts
from app.services.media_storage import finalize_recording, get_recording_path
from app.db.mongodb_connection import get_db

finalize_router = APIRouter()

RESULTS_DIR = "results"

# skorlama ağırlıkları
AUDIO_WEIGHT = 0.6
VIDEO_WEIGHT = 0.4

VIDEO_POSITIVE_WEIGHT = 0.4
VIDEO_FOCUS_WEIGHT = 0.2
VIDEO_STABILITY_WEIGHT = 0.2
VIDEO_STRESS_WEIGHT = 0.2

os.makedirs(RESULTS_DIR, exist_ok=True)


def _text_similarity(a: str, b: str) -> float:
    a_tokens = {w.lower() for w in a.split() if w}
    b_tokens = {w.lower() for w in b.split() if w}
    if not a_tokens or not b_tokens:
        return 0.0
    inter = len(a_tokens & b_tokens)
    union = len(a_tokens | b_tokens)
    if union == 0:
        return 0.0
    return (inter / union) * 100.0


def _attach_per_question_scores(questions: list, audio_score: float, video_score: float) -> list:
    updated = []
    for q in questions:
        q_copy = dict(q)
        meta = dict(q_copy.get("metadata") or {})
        expected_answer = meta.get("expectedAnswer") or ""
        user_answer = q_copy.get("answer") or ""
        text_sim = None
        if expected_answer and user_answer:
            text_sim = _text_similarity(str(expected_answer), str(user_answer))
        scores = {
            "audio": float(audio_score) if audio_score is not None else None,
            "video": float(video_score) if video_score is not None else None,
            "text": float(text_sim) if text_sim is not None else None,
        }
        if text_sim is not None:
            q_copy["text_similarity"] = float(text_sim)
        q_copy["scores"] = scores
        updated.append(q_copy)
    return updated


@finalize_router.get("/finalize-session")
def finalize_session(sessionId: str):
    data = get_session_data(sessionId)

    if not data:
        return {"error": "Session not found"}

    # Ses ve video kayıtlarını dosya olarak birleştir ve kaydet
    recording_info = finalize_recording(sessionId)
    print(f"[finalize] Recording saved: {recording_info}")

    audio_chunks = data["audio"]
    video_frames = data["video"]

    created_at = datetime.utcnow().isoformat() + "Z"
    audio_count = len(audio_chunks)
    video_count = len(video_frames)

    # yazılı cevap ve soru bilgisini answers-interviews koleksiyonundan çek
    question_text = None
    written_answer = None
    questions_detail = []
    db_for_answers = get_db()
    preset = None
    if db_for_answers is not None:
        try:
            answer_doc = db_for_answers["answers"].find_one({"sessionId": sessionId})
            if answer_doc:
                question_text = answer_doc.get("question")
                written_answer = answer_doc.get("answer")
        except Exception as e:
            print(f"[MongoDB] answers query error: {e}")

        try:
            interview_doc = db_for_answers["interviews"].find_one({"sessionId": sessionId})
            if interview_doc:
                questions_detail = interview_doc.get("questions", [])
                preset = interview_doc.get("preset")
        except Exception as e:
            print(f"[MongoDB] interviews query error: {e}")

    audio_values = [item["score"] for item in audio_chunks if "score" in item]
    audio_avg = sum(audio_values) / len(audio_values) if audio_values else 0.0

    # audio RMSyi 0-100 arası bir skora normalize et
    if audio_avg <= 0:
        audio_score = 0.0
    else:
        ref_rms = 0.05
        audio_score = min(max(audio_avg / ref_rms, 0.0), 1.0) * 100.0

    audio_score = float(audio_score)
    audio_score_norm = audio_score / 100.0

    #audio stabilite ardışık skor farklarına dayalı basit metrik
    audio_stability_values = []
    for i in range(1, len(audio_values)):
        audio_stability_values.append(abs(audio_values[i] - audio_values[i - 1]))
    audio_stability_score = 100 - (sum(audio_stability_values) / len(audio_stability_values)) if audio_stability_values else 100

    # metin skorunu öncelikle yazılı cevap üzerinden hesapla;
    # yazılı cevap yoksa ses transkriptlerini fallback olarak kullan.
    text_features = {}
    text_source = None

    if written_answer and str(written_answer).strip():
        text_source = written_answer
    else:
        transcripts = []
        for item in audio_chunks:
            if isinstance(item, dict):
                t = str(item.get("text") or "").strip()
                if t:
                    transcripts.append(t)

        if transcripts:
            text_source = " ".join(transcripts)

    if text_source:
        try:
            text_features = analyze_texts([text_source])
        except Exception as e:
            print(f"[text_features] analyze_texts error: {e}")
            text_features = {}

    #basit bir metin skoru token sayısı ve tfidf_mean'den türetilen 0-100 arası değer
    text_score = 0.0
    if text_features:
        num_tokens = float(text_features.get("num_tokens") or 0.0)
        tfidf_mean = float(text_features.get("tfidf_mean") or 0.0)

        # 0-100 arası kaba normalizasyonlar
        length_score = min(num_tokens / 100.0 * 100.0, 100.0)  # 100+ token tam puan
        tfidf_score = min(tfidf_mean * 100.0, 100.0)           # küçük değerler için ölçek

        text_score = 0.5 * length_score + 0.5 * tfidf_score

    text_score_norm = text_score / 100.0 if text_score > 0 else 0.0

    if not video_frames:
        video_score = 0

        questions_with_scores = _attach_per_question_scores(
            questions_detail,
            audio_score=audio_score,
            video_score=video_score,
        )

        if text_features:
            # ses %30, metin %30, görüntü %40
            final_score_norm = audio_score_norm * 0.3 + text_score_norm * 0.3 + 0.0 * 0.4
        else:
            # metin yoksa ses %60, görüntü %40
            final_score_norm = audio_score_norm * 0.6 + 0.0 * 0.4

        final_score = final_score_norm * 100.0

        result_json = {
            "sessionId": sessionId,
            "created_at": created_at,
            "preset": preset,
            "audio_avg": audio_avg,
            "audio_score": audio_score,
            "video_score": 0,
            "final_score": final_score,
            "audio_chunk_count": audio_count,
            "video_frame_count": video_count,
            "question": question_text,
            "written_answer": written_answer,
            "detail": {
                "audio_stability_score": audio_stability_score,
                "text": text_features,
            },
            "questions": questions_with_scores,
            "recording": recording_info,
            "simulation": {
                "sessionId": sessionId,
                "created_at": created_at,
                "preset": preset,
                "overall": {
                    "audio_score": audio_score,
                    "video_score": 0,
                    "text_score": text_score,
                    "final_score": final_score,
                },
                "questions": questions_with_scores,
            },
        }

        path = os.path.join(RESULTS_DIR, f"{sessionId}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(result_json, f, ensure_ascii=False, indent=4)

        # MongoDB ye de kaydet
        db = get_db()
        if db is not None:
            try:
                db["sessionResults"].insert_one(result_json.copy())
            except Exception as e:
                print(f"[MongoDB] sessionResults insert error: {e}")

            # interviews koleksiyonunu güncelle
            try:
                scores_payload = {
                    "audio_avg": audio_avg,
                    "audio_score": audio_score,
                    "video_score": 0,
                    "final_score": final_score,
                    "detail": {
                        "audio_stability_score": audio_stability_score,
                        "text": text_features,
                    },
                }
                db["interviews"].update_one(
                    {"sessionId": sessionId},
                    {
                        "$set": {
                            "overall_scores": scores_payload,
                            "finished_at": created_at,
                            "status": "completed",
                            "recording": recording_info,
                        }
                    },
                    upsert=False,
                )
            except Exception as e:
                print(f"[MongoDB] interviews update error: {e}")

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

    # eğer hiçbir karede yüz algılanmadıysa video skoru doğrudan 0 olsun.
    if face_detect_count == 0:
        video_score = 0.0
    else:
        video_score = (
            positive_avg * VIDEO_POSITIVE_WEIGHT +
            focus_score * VIDEO_FOCUS_WEIGHT +
            stability_score * VIDEO_STABILITY_WEIGHT +
            (100 - stress_avg) * VIDEO_STRESS_WEIGHT
        )

    video_score = float(video_score)
    video_score_norm = video_score / 100.0 if video_score > 0 else 0.0

    if text_features:
        # Ses %30, metin %30, görüntü %40
        final_score_norm = (
            audio_score_norm * 0.3 +
            text_score_norm * 0.3 +
            video_score_norm * 0.4
        )
    else:
        # Metin yoksa ses %60, görüntü %40
        final_score_norm = audio_score_norm * 0.6 + video_score_norm * 0.4

    final_score = final_score_norm * 100.0

    questions_with_scores = _attach_per_question_scores(
        questions_detail,
        audio_score=audio_score,
        video_score=video_score,
    )

    result_json = {
        "sessionId": sessionId,
        "created_at": created_at,
        "preset": preset,
        "audio_avg": audio_avg,
        "audio_score": audio_score,
        "video_score": video_score,
        "final_score": final_score,
        "audio_chunk_count": audio_count,
        "video_frame_count": video_count,
        "question": question_text,
        "written_answer": written_answer,
        "detail": {
            "positive_avg": positive_avg,
            "stress_avg": stress_avg,
            "focus_score": focus_score,
            "stability_score": stability_score,
            "audio_stability_score": audio_stability_score,
            "text": text_features,
        },
        "questions": questions_with_scores,
        "recording": recording_info,
        "simulation": {
            "sessionId": sessionId,
            "created_at": created_at,
            "preset": preset,
            "overall": {
                "audio_score": audio_score,
                "video_score": video_score,
                "text_score": text_score,
                "final_score": final_score,
            },
            "questions": questions_with_scores,
        },
    }

    path = os.path.join(RESULTS_DIR, f"{sessionId}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(result_json, f, ensure_ascii=False, indent=4)

    # MongoDB'ye de kaydet
    db = get_db()
    if db is not None:
        try:
            db["sessionResults"].insert_one(result_json.copy())
        except Exception as e:
            print(f"[MongoDB] sessionResults insert error: {e}")

        # Interviews koleksiyonunu güncelle
        try:
            scores_payload = {
                "audio_avg": audio_avg,
                "audio_score": audio_score,
                "video_score": video_score,
                "final_score": final_score,
                "detail": {
                    "positive_avg": positive_avg,
                    "stress_avg": stress_avg,
                    "focus_score": focus_score,
                    "stability_score": stability_score,
                    "audio_stability_score": audio_stability_score,
                    "text": text_features,
                },
            }
            db["interviews"].update_one(
                {"sessionId": sessionId},
                {
                    "$set": {
                        "overall_scores": scores_payload,
                        "finished_at": created_at,
                        "status": "completed",
                        "recording": recording_info,
                    }
                },
                upsert=False,
            )
        except Exception as e:
            print(f"[MongoDB] interviews update error: {e}")

    clear_session(sessionId)

    return result_json
