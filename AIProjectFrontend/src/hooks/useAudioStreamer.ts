"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

export function useAudioStreamer() {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false); // closure için ref kullan
  const recorderRef = useRef<MediaRecorder | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const questionIndexRef = useRef<number>(0); // soru indexi
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const setQuestionIndex = (index: number) => {
    questionIndexRef.current = index;
  };

  const start = async (sessionId: string, questionIndex: number = 0) => {
    console.log("[audio] start called", sessionId, "question:", questionIndex);
    sessionIdRef.current = sessionId;
    questionIndexRef.current = questionIndex;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      console.log("[audio] getUserMedia ok");

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      //recording chunk
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        //chunkları tam bir WebM dosyası yap
        const completeBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        const form = new FormData();
        form.append("audio", completeBlob, "audio.webm");
        form.append("sessionId", sessionIdRef.current!);
        form.append("questionIndex", String(questionIndexRef.current));

        console.log("[audio] sending chunk", {
          size: completeBlob.size,
          sessionId: sessionIdRef.current,
          questionIndex: questionIndexRef.current,
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

        //15 sn sonra tekrar kaydı başlat
        if (isRecordingRef.current) {
          recorder.start();
          scheduleStop();
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      scheduleStop();
      isRecordingRef.current = true;
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
    isRecordingRef.current = false;
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

  return { isRecording, start, stop, setQuestionIndex };
}
