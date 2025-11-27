import subprocess
import tempfile
import librosa
import numpy as np
import os
import logging
import torch
import whisper


_WHISPER_MODEL = None


def _get_whisper_model():
    global _WHISPER_MODEL
    if _WHISPER_MODEL is None:
        try:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            logging.info("Whisper modeli yükleniyor (%s)", device)
            _WHISPER_MODEL = whisper.load_model("medium", device=device)
        except Exception as e:
            logging.exception("Whisper modeli yüklenirken hata: %s", e)
            _WHISPER_MODEL = None
    return _WHISPER_MODEL 


def analyze_audio_chunk(chunk_bytes: bytes):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as f_in:
            f_in.write(chunk_bytes)
            f_in.flush()
            webm_path = f_in.name
        wav_path = webm_path.replace(".webm", ".wav")

        # 2) ffmpeg dönüştürme
        cmd = [
            "ffmpeg",
            "-loglevel",
            "error",  # gereksiz çıktı yok
            "-y",
            "-i",
            webm_path,
            "-ac",
            "1",
            "-ar",
            "16000",
            wav_path,
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            logging.error("FFMPEG hata: returncode=%s stderr=%s", result.returncode, result.stderr)
            return {"score": 0, "error": "ffmpeg conversion failed"}

        # 3) wav dosyası oluşmuş mu?
        if not os.path.exists(wav_path):
            logging.error("WAV dosyası oluşmadı: %s", wav_path)
            return {"score": 0, "error": "wav not created"}

        # 4) wav boş mu?
        if os.path.getsize(wav_path) < 100:
            logging.warning("WAV dosyası çok küçük görünüyor: %s", wav_path)
            return {"score": 0, "error": "wav too small"}

        # 5) librosa ile oku
        try:
            y, sr = librosa.load(wav_path, sr=None)
        except Exception as e:
            logging.exception("Librosa hata: %s", e)
            return {"score": 0, "error": "audio load failed"}

        if len(y) == 0:
            logging.warning("Ses verisi boş (y uzunluğu 0)")
            return {"score": 0, "error": "empty audio"}

        # RMS (mevcut skor mantığını koru)
        rms = float(np.mean(np.abs(y)))

        # MFCC ve temel spektral özellikler
        try:
            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            mfcc_mean = mfcc.mean(axis=1)  # her katsayı için ortalama

            spectral_centroid = float(librosa.feature.spectral_centroid(y=y, sr=sr).mean())
            spectral_rolloff = float(librosa.feature.spectral_rolloff(y=y, sr=sr).mean())
            zcr = float(librosa.feature.zero_crossing_rate(y).mean())
        except Exception as e:
            logging.exception("Akustik özellikler hesaplanırken hata: %s", e)
            mfcc_mean = None
            spectral_centroid = None
            spectral_rolloff = None
            zcr = None

        # Whisper ile transkript
        text = None
        try:
            model = _get_whisper_model()
            if model is not None:
                # Dil Türkçe ağırlıklı ise language="tr" verilebilir; autodetect de mümkün.
                result_whisper = model.transcribe(wav_path, language="tr", fp16=torch.cuda.is_available())
                text = result_whisper.get("text", "").strip()
            else:
                logging.warning("Whisper modeli yüklenemedi, transkript atlandı.")
        except Exception as e:
            logging.exception("Whisper transkript hatası: %s", e)
            text = None

        logging.info("AUDIO RMS: %f", rms)

        return {
            "score": rms,
            "text": text,
            "mfcc_mean": mfcc_mean.tolist() if mfcc_mean is not None else None,
            "spectral_centroid": spectral_centroid,
            "spectral_rolloff": spectral_rolloff,
            "zero_crossing_rate": zcr,
        }

    except Exception as e:
        logging.exception("Beklenmeyen audio analiz hatası: %s", e)
        return {"score": 0, "error": "unexpected audio error"}


def analyze_audio_file(file_path: str) -> dict:
    """
    Kayıtlı bir ses dosyasını analiz et.
    WebM veya WAV dosyası olabilir.
    """
    try:
        wav_path = file_path
        
        # WebM ise WAV'a çevir
        if file_path.endswith(".webm"):
            wav_path = file_path.replace(".webm", "_converted.wav")
            cmd = [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", file_path,
                "-ac", "1", "-ar", "16000",
                wav_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                logging.error("FFmpeg ses dönüştürme hatası: %s", result.stderr)
                return {"error": "ffmpeg_conversion_failed"}
        
        # Librosa ile yükle
        y, sr = librosa.load(wav_path, sr=16000)
        
        if len(y) == 0:
            return {"error": "empty_audio"}
        
        # RMS (ses seviyesi)
        rms = float(np.sqrt(np.mean(y ** 2)))
        
        # MFCC özellikleri
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)
        
        # Spektral özellikler
        spectral_centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
        spectral_rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr)))
        zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)))
        
        # Süre
        duration_seconds = len(y) / sr
        
        # Whisper ile transkript
        text = None
        try:
            model = _get_whisper_model()
            if model is not None:
                result_whisper = model.transcribe(wav_path, language="tr", fp16=torch.cuda.is_available())
                text = result_whisper.get("text", "").strip()
        except Exception as e:
            logging.exception("Whisper transkript hatası: %s", e)
        
        # Geçici WAV dosyasını temizle
        if file_path.endswith(".webm") and os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except:
                pass
        
        return {
            "rms": rms,
            "duration_seconds": duration_seconds,
            "transcript": text,
            "mfcc_mean": mfcc_mean.tolist() if mfcc_mean is not None else None,
            "spectral_centroid": spectral_centroid,
            "spectral_rolloff": spectral_rolloff,
            "zero_crossing_rate": zcr,
        }
        
    except Exception as e:
        logging.exception("Ses dosyası analiz hatası: %s", e)
        return {"error": str(e)}
