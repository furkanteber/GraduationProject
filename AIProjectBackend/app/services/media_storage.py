"""
Mülakat sırasında gelen ses ve video verilerini geçici olarak saklar,
mülakat bittiğinde dosya olarak kaydeder.
"""

import os
import shutil
from pathlib import Path
from typing import Optional
from datetime import datetime

# Kayıt klasörü
RECORDINGS_DIR = Path(__file__).parent.parent.parent / "recordings"
TEMP_DIR = RECORDINGS_DIR / "temp"


def _ensure_dirs():
    """Gerekli klasörleri oluştur."""
    RECORDINGS_DIR.mkdir(exist_ok=True)
    TEMP_DIR.mkdir(exist_ok=True)


def _get_session_temp_dir(session_id: str) -> Path:
    """Session için geçici klasör yolu."""
    _ensure_dirs()
    session_dir = TEMP_DIR / session_id
    session_dir.mkdir(exist_ok=True)
    return session_dir


def save_audio_chunk(session_id: str, chunk_data: bytes, chunk_index: int, question_index: int = -1) -> str:
    """
    Ses chunk'ını geçici klasöre kaydet.
    question_index >= 0 ise soru bazlı klasöre kaydet.
    Returns: Kaydedilen dosya yolu
    """
    session_dir = _get_session_temp_dir(session_id)
    
    if question_index >= 0:
        audio_dir = session_dir / f"question_{question_index}" / "audio"
    else:
        audio_dir = session_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"chunk_{chunk_index:04d}.webm"
    filepath = audio_dir / filename
    
    with open(filepath, "wb") as f:
        f.write(chunk_data)
    
    return str(filepath)


def save_video_frame(session_id: str, frame_data: bytes, frame_index: int, question_index: int = -1) -> str:
    """
    Video frame'ini geçici klasöre kaydet.
    question_index >= 0 ise soru bazlı klasöre kaydet.
    Returns: Kaydedilen dosya yolu
    """
    session_dir = _get_session_temp_dir(session_id)
    
    if question_index >= 0:
        video_dir = session_dir / f"question_{question_index}" / "video"
    else:
        video_dir = session_dir / "video"
    video_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"frame_{frame_index:04d}.jpg"
    filepath = video_dir / filename
    
    with open(filepath, "wb") as f:
        f.write(frame_data)
    
    return str(filepath)


def get_chunk_count(session_id: str, media_type: str, question_index: int = -1) -> int:
    """Mevcut chunk/frame sayısını döndür."""
    if question_index >= 0:
        session_dir = TEMP_DIR / session_id / f"question_{question_index}" / media_type
    else:
        session_dir = TEMP_DIR / session_id / media_type
    if not session_dir.exists():
        return 0
    return len(list(session_dir.glob("*")))


def finalize_recording(session_id: str) -> dict:
    """
    Mülakat bittiğinde tüm parçaları birleştir ve kalıcı dosya olarak kaydet.
    Returns: {audio_path, video_path, frames_count, audio_chunks_count}
    """
    _ensure_dirs()
    session_temp = TEMP_DIR / session_id
    
    if not session_temp.exists():
        return {"error": "Session temp data not found"}
    
    # Tarih bazlı klasör oluştur
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    final_dir = RECORDINGS_DIR / date_str / session_id
    final_dir.mkdir(parents=True, exist_ok=True)
    
    result = {
        "session_id": session_id,
        "audio_path": None,
        "video_path": None,
        "audio_chunks_count": 0,
        "video_frames_count": 0,
    }
    
    # Ses dosyalarını birleştir
    audio_temp = session_temp / "audio"
    if audio_temp.exists():
        audio_files = sorted(audio_temp.glob("chunk_*.webm"))
        result["audio_chunks_count"] = len(audio_files)
        
        if audio_files:
            combined_audio_path = final_dir / "recording.webm"
            
            # FFmpeg ile chunk'ları birleştir
            try:
                _merge_audio_chunks_ffmpeg(audio_files, combined_audio_path)
                if combined_audio_path.exists():
                    result["audio_path"] = str(combined_audio_path)
            except Exception as e:
                print(f"[media_storage] FFmpeg ses birleştirme hatası: {e}")
                # Fallback: chunk'ları ayrı ayrı sakla
                chunks_dir = final_dir / "audio_chunks"
                chunks_dir.mkdir(exist_ok=True)
                for af in audio_files:
                    shutil.copy2(af, chunks_dir / af.name)
                result["audio_path"] = str(chunks_dir)
    
    # Video frame'lerini kaydet (veya video oluştur)
    video_temp = session_temp / "video"
    if video_temp.exists():
        video_files = sorted(video_temp.glob("frame_*.jpg"))
        result["video_frames_count"] = len(video_files)
        
        if video_files:
            # Frame'leri final klasöre taşı
            frames_dir = final_dir / "frames"
            frames_dir.mkdir(exist_ok=True)
            
            for frame_file in video_files:
                shutil.copy2(frame_file, frames_dir / frame_file.name)
            
            result["video_path"] = str(frames_dir)
            
            # FFmpeg varsa video oluşturmayı dene
            try:
                video_output = final_dir / "recording.mp4"
                _create_video_from_frames(frames_dir, video_output)
                if video_output.exists():
                    result["video_path"] = str(video_output)
            except Exception as e:
                print(f"[media_storage] Video oluşturma hatası: {e}")
    
    # Geçici dosyaları temizle
    try:
        shutil.rmtree(session_temp)
    except Exception as e:
        print(f"[media_storage] Temp temizleme hatası: {e}")
    
    return result


def _merge_audio_chunks_ffmpeg(audio_files: list, output_path: Path):
    """FFmpeg concat demuxer ile WebM ses chunk'larını birleştir."""
    import subprocess
    import tempfile
    
    # Concat dosyası oluştur
    concat_file = output_path.parent / "concat_list.txt"
    try:
        with open(concat_file, "w", encoding="utf-8") as f:
            for audio_file in audio_files:
                # FFmpeg için dosya yolunu escape et
                escaped_path = str(audio_file).replace("\\", "/").replace("'", "'\\''")
                f.write(f"file '{escaped_path}'\n")
        
        # FFmpeg concat komutu
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_file),
            "-c", "copy",
            str(output_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, timeout=120)
        
        if result.returncode != 0:
            print(f"[media_storage] FFmpeg concat hatası: {result.stderr.decode()}")
            # Alternatif: Her chunk'ı decode edip yeniden encode et
            _merge_audio_with_reencode(audio_files, output_path)
    
    except FileNotFoundError:
        print("[media_storage] FFmpeg bulunamadı")
        raise
    finally:
        # Concat dosyasını temizle
        if concat_file.exists():
            concat_file.unlink()


def _merge_audio_with_reencode(audio_files: list, output_path: Path):
    """Chunk'ları yeniden encode ederek birleştir (daha yavaş ama daha güvenilir)."""
    import subprocess
    
    # Tüm chunk'ları input olarak al
    inputs = []
    for af in audio_files:
        inputs.extend(["-i", str(af)])
    
    # Filter complex ile birleştir
    filter_str = "".join([f"[{i}:a]" for i in range(len(audio_files))]) + f"concat=n={len(audio_files)}:v=0:a=1[outa]"
    
    cmd = [
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", filter_str,
        "-map", "[outa]",
        "-c:a", "libopus",
        str(output_path)
    ]
    
    subprocess.run(cmd, check=True, capture_output=True, timeout=180)


def _create_video_from_frames(frames_dir: Path, output_path: Path, fps: int = 2):
    """FFmpeg ile frame'lerden video oluştur."""
    import subprocess
    
    # FFmpeg komutunu çalıştır
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", str(frames_dir / "frame_%04d.jpg"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        str(output_path)
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True, timeout=60)
    except FileNotFoundError:
        print("[media_storage] FFmpeg bulunamadı, video oluşturulamadı")
        raise
    except subprocess.CalledProcessError as e:
        print(f"[media_storage] FFmpeg hatası: {e.stderr.decode()}")
        raise


def cleanup_old_temp_sessions(max_age_hours: int = 24):
    """Eski geçici session klasörlerini temizle."""
    if not TEMP_DIR.exists():
        return
    
    import time
    now = time.time()
    max_age_seconds = max_age_hours * 3600
    
    for session_dir in TEMP_DIR.iterdir():
        if session_dir.is_dir():
            # Klasör yaşını kontrol et
            age = now - session_dir.stat().st_mtime
            if age > max_age_seconds:
                try:
                    shutil.rmtree(session_dir)
                    print(f"[media_storage] Eski temp temizlendi: {session_dir.name}")
                except Exception as e:
                    print(f"[media_storage] Temp temizleme hatası: {e}")


def get_recording_path(session_id: str) -> Optional[dict]:
    """Kaydedilmiş mülakat dosyalarının yolunu döndür."""
    _ensure_dirs()
    
    # Tüm tarih klasörlerinde ara
    for date_dir in RECORDINGS_DIR.iterdir():
        if date_dir.is_dir() and date_dir.name != "temp":
            session_dir = date_dir / session_id
            if session_dir.exists():
                result = {"session_id": session_id, "path": str(session_dir)}
                
                audio_file = session_dir / "recording.webm"
                if audio_file.exists():
                    result["audio_path"] = str(audio_file)
                
                video_file = session_dir / "recording.mp4"
                if video_file.exists():
                    result["video_path"] = str(video_file)
                
                frames_dir = session_dir / "frames"
                if frames_dir.exists():
                    result["frames_path"] = str(frames_dir)
                    result["frames_count"] = len(list(frames_dir.glob("*.jpg")))
                
                return result
    
    return None


def finalize_question_recording(session_id: str, question_index: int) -> dict:
    """
    Belirli bir sorunun ses ve video kayıtlarını birleştir ve kaydet.
    Returns: {audio_path, video_path, audio_chunks_count, video_frames_count}
    """
    _ensure_dirs()
    session_temp = TEMP_DIR / session_id
    question_dir = session_temp / f"question_{question_index}"
    
    if not question_dir.exists():
        return {"error": f"Question {question_index} data not found"}
    
    # Tarih bazlı klasör oluştur
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    final_dir = RECORDINGS_DIR / date_str / session_id / f"question_{question_index}"
    final_dir.mkdir(parents=True, exist_ok=True)
    
    result = {
        "session_id": session_id,
        "question_index": question_index,
        "audio_path": None,
        "video_path": None,
        "audio_chunks_count": 0,
        "video_frames_count": 0,
    }
    
    # Ses dosyalarını birleştir
    audio_temp = question_dir / "audio"
    if audio_temp.exists():
        audio_files = sorted(audio_temp.glob("chunk_*.webm"))
        result["audio_chunks_count"] = len(audio_files)
        
        if audio_files:
            combined_audio_path = final_dir / "recording.webm"
            try:
                _merge_audio_chunks_ffmpeg(audio_files, combined_audio_path)
                if combined_audio_path.exists():
                    result["audio_path"] = str(combined_audio_path)
            except Exception as e:
                print(f"[media_storage] FFmpeg ses birleştirme hatası (Q{question_index}): {e}")
    
    # Video frame'lerini kaydet
    video_temp = question_dir / "video"
    if video_temp.exists():
        video_files = sorted(video_temp.glob("frame_*.jpg"))
        result["video_frames_count"] = len(video_files)
        
        if video_files:
            frames_dir = final_dir / "frames"
            frames_dir.mkdir(exist_ok=True)
            
            for frame_file in video_files:
                shutil.copy2(frame_file, frames_dir / frame_file.name)
            
            result["video_path"] = str(frames_dir)
            
            # FFmpeg varsa video oluştur
            try:
                video_output = final_dir / "recording.mp4"
                _create_video_from_frames(frames_dir, video_output, fps=2)
                if video_output.exists():
                    result["video_path"] = str(video_output)
            except Exception as e:
                print(f"[media_storage] Video oluşturma hatası (Q{question_index}): {e}")
    
    # Geçici soru klasörünü temizle
    try:
        shutil.rmtree(question_dir)
    except Exception as e:
        print(f"[media_storage] Temp temizleme hatası (Q{question_index}): {e}")
    
    return result


def get_question_media_paths(session_id: str, question_index: int) -> dict:
    """Belirli bir sorunun geçici ses ve video dosya yollarını döndür."""
    session_temp = TEMP_DIR / session_id / f"question_{question_index}"
    
    result = {
        "audio_files": [],
        "video_files": [],
    }
    
    audio_dir = session_temp / "audio"
    if audio_dir.exists():
        result["audio_files"] = sorted([str(f) for f in audio_dir.glob("chunk_*.webm")])
    
    video_dir = session_temp / "video"
    if video_dir.exists():
        result["video_files"] = sorted([str(f) for f in video_dir.glob("frame_*.jpg")])
    
    return result
