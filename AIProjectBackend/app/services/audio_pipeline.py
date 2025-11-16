import subprocess
import tempfile
import librosa
import numpy as np
import os

def analyze_audio_chunk(chunk_bytes: bytes):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as f_in:
        f_in.write(chunk_bytes)
        f_in.flush()
        webm_path = f_in.name

    wav_path = webm_path.replace(".webm", ".wav")

    # 2) ffmpeg dönüştürme
    cmd = [
        "ffmpeg",
        "-loglevel", "error",   # gereksiz çıktı yok
        "-y",
        "-i", webm_path,
        "-ac", "1",
        "-ar", "16000",
        wav_path
    ]

    ffmpeg_output = subprocess.getoutput(" ".join(cmd))
    print("FFMPEG OUTPUT:", ffmpeg_output)

    # 3) wav dosyası oluşmuş mu?
    if not os.path.exists(wav_path):
        print("WAV oluşmadı!!!")
        return {"score": 0}

    # 4) wav boş mu?
    if os.path.getsize(wav_path) < 100:
        print("WAV boş görünüyor.")
        return {"score": 0}

    # 5) librosa ile oku
    try:
        y, sr = librosa.load(wav_path, sr=None)
    except Exception as e:
        print("Librosa hata:", e)
        return {"score": 0}

    if len(y) == 0:
        print("Ses verisi boş (y=0)")
        return {"score": 0}

    rms = float(np.mean(np.abs(y)))

    print("AUDIO RMS:", rms)
    return {"score": rms}
