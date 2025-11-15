import librosa
import numpy as np
import soundfile as sf
import io

TARGET_SR = 16000

def analyze_audio_chunk(raw_bytes: bytes):

    # byte verisini numpy arraye çevir
    try:
        y, sr = sf.read(io.BytesIO(raw_bytes))
    except Exception:
        return {"energy": 0.0, "rms": 0.0, "score": 0.0}

    # stereo ise mono'ya indir
    if len(y.shape) > 1:
        y = y[:, 0]

    # sample rate dönüştür
    if sr != TARGET_SR:
        y = librosa.resample(y, orig_sr=sr, target_sr=TARGET_SR)

    # RMS Enerji
    rms = librosa.feature.rms(y=y).mean()

    # toplam enerji
    energy = float(np.sum(np.abs(y)))

    # basit örnek skor
    score = float(min(1.0, (energy + rms) / 2))

    return {
        "energy": energy,
        "rms": float(rms),
        "score": score
    }