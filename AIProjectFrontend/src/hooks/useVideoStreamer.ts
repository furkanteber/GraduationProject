"use client";

import { useEffect, useRef, useState } from "react";

export function useVideoStreamer(sessionId: string | null) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setStreaming] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = async () => {
    if (!sessionId) {
      console.error("VideoStreamer: sessionId yok!");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240 },
      audio: false,
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }

    // Her saniye 1 frame gönder
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0, 320, 240);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.6)
      );

      if (!blob) return;

      const form = new FormData();
      form.append("sessionId", sessionId);
      form.append("frame", new File([blob], "frame.jpg", { type: "image/jpeg" }));

      try {
        await fetch("http://127.0.0.1:8000/stream/video", {
          method: "POST",
          body: form,
        });
      } catch (err) {
        console.error("Video gönderimi hatası:", err);
      }
    }, 1000);

    setStreaming(true);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStreaming(false);

    const tracks = (videoRef.current?.srcObject as MediaStream)?.getTracks();
    tracks?.forEach((t) => t.stop());
  };

  return { videoRef, isStreaming, start, stop };
}
