"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

export function useAudioStreamer() {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const start = async (sessionId: string) => {
    console.log("[audio] start called", sessionId);
    sessionIdRef.current = sessionId;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      console.log("[audio] getUserMedia ok");

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      // Recording chunk
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Chunk'ları tam bir WebM dosyası yap
        const completeBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        const form = new FormData();
        form.append("audio", completeBlob, "audio.webm");
        form.append("sessionId", sessionIdRef.current!);

        console.log("[audio] sending chunk", {
          size: completeBlob.size,
          sessionId: sessionIdRef.current,
        });

        try {
          const res = await fetch("http://localhost:8000/stream/audio", {
            method: "POST",
            body: form,
          });
          console.log("[audio] response", res.status);
        } catch (e) {
          console.error("[audio] fetch error", e);
        }

        // 15 sn sonra tekrar kaydı başlat
        if (isRecording) {
          recorder.start();
          scheduleStop();
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      scheduleStop();
      setIsRecording(true);
    } catch (e) {
      console.error("[audio] getUserMedia error", e);
      toast.error("Mikrofon başlatılamadı. Tarayıcı mikrofon izinlerini ve cihazınızı kontrol edin.");
    }
  };

  const scheduleStop = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      recorderRef.current?.stop();
    }, 15000);
  };

  const stop = () => {
    setIsRecording(false);
    clearTimeout(timerRef.current);

    if (recorderRef.current) {
      if (recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }

      recorderRef.current.stream
        .getTracks()
        .forEach((t) => t.stop());
    }
  };

  return { isRecording, start, stop };
}
