"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

export function useVideoStreamer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef<any>(null);
  const sessionIdRef = useRef<string | null>(null);

  const start = async (sessionId: string) => {
    console.log("[video] start called", sessionId);
    sessionIdRef.current = sessionId;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      console.log("[video] getUserMedia ok");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Her 1 saniyede bir frame gönder
      intervalRef.current = setInterval(() => {
        captureFrame();
      }, 1000);

      setIsStreaming(true);
    } catch (e) {
      console.error("[video] getUserMedia error", e);
      toast.error("Kamera başlatılamadı. Tarayıcı kamera izinlerini ve cihazınızı kontrol edin.");
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !sessionIdRef.current) return;

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      console.log("[video] frame skipped, video not ready");
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.8)
    );

    if (!blob) {
      console.log("[video] toBlob returned null");
      return;
    }

    const formData = new FormData();
    formData.append("image", blob, "frame.jpg");
    formData.append("sessionId", sessionIdRef.current);

    console.log("[video] sending frame", {
      size: blob.size,
      sessionId: sessionIdRef.current,
    });

    try {
      const res = await fetch("http://localhost:8000/stream/video", {
        method: "POST",
        body: formData,
      });
      console.log("[video] response", res.status);
    } catch (e) {
      console.error("[video] fetch error", e);
    }
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
