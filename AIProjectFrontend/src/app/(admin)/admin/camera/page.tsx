"use client";

import { useEffect, useRef } from "react";

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function enableCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Kameraya erişilemedi:", err);
      }
    }

    enableCamera();
  }, []);

  return (
      <video ref={videoRef} autoPlay playsInline className="flex-1 bg-gray-200 flex items-center justify-center rounded-md" />
  );
}
