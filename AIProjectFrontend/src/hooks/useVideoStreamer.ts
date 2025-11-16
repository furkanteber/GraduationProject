"use client";

import { useRef, useState } from "react";

export function useVideoStreamer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef<any>(null);
  const sessionIdRef = useRef<string | null>(null);

  const start = async (sessionId: string) => {
    sessionIdRef.current = sessionId;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    // Her 1 saniyede bir frame gönder
    intervalRef.current = setInterval(() => {
      captureFrame();
    }, 1000);

    setIsStreaming(true);
  };

  const captureFrame = async () => {
    if (!videoRef.current || !sessionIdRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.8)
    );

    if (!blob) return;

    const formData = new FormData();
    formData.append("image", blob, "frame.jpg");
    formData.append("sessionId", sessionIdRef.current);

    await fetch("http://localhost:8000/stream/video", {
      method: "POST",
      body: formData,
    });
  };

  const stop = () => {
    setIsStreaming(false);
    clearInterval(intervalRef.current);

    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
    }
  };

  return { videoRef, isStreaming, start, stop };
}
