"use client";

import { useEffect, useRef, useState } from "react";

export function useAudioStreamer(sessionId: string | null) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const start = async () => {
    if (!sessionId) return console.error("Session ID yok!");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm",
    });

    mediaRecorderRef.current = recorder;
    setIsRecording(true);

    recorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        const form = new FormData();
        form.append("sessionId", sessionId);
        form.append("chunk", new File([e.data], "audio.webm", { type: "audio/webm" }));

        try {
          await fetch("http://127.0.0.1:8000/stream/audio", {
            method: "POST",
            body: form,
          });
        } catch (err) {
          console.error("Audio gönderimi hatası:", err);
        }
      }
    };

    recorder.start(1000); // her 1 saniyede chunk üret
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return { isRecording, start, stop };
}
