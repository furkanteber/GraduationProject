"use client";

import React, { useState } from "react";
import { createSessionId } from "../lib/session";
import { useAudioStreamer } from "@/hooks/useAudioStreamer";
import { useVideoStreamer } from "@/hooks/useVideoStreamer";
import { finalizeSession } from "../lib/finalize";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mic, Camera, Square } from "lucide-react";

export default function AudioVideoRecorder() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  const { start: startAudio, stop: stopAudio } = useAudioStreamer();
  const { videoRef, start: startVideo, stop: stopVideo } = useVideoStreamer();

  const startAll = () => {
    const id = createSessionId();
    setSessionId(id);

    // Başlangıç için küçük delay
    setTimeout(() => {
      startAudio(id);
      startVideo(id);
      setIsRecording(true);
    }, 80);
  };

  const stopAll = async () => {
    setIsRecording(false);

    stopAudio();
    stopVideo();

    // Son chunk’ın backend’e ulaşması için
    await new Promise((res) => setTimeout(res, 300));

    if (!sessionId) return;

    const data = await finalizeSession(sessionId);
    setResult(data);
  };

  return (
    <Card className="w-full max-w-xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle>Mülakat Cevabı Kaydı</CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-4 mt-4">
        <video
          ref={videoRef}
          className="w-full h-auto rounded-md border"
          autoPlay
          muted
        />

        {!isRecording && (
          <Button onClick={startAll} className="flex items-center gap-2">
            <Mic size={18} />
            <Camera size={18} />
            Kaydı Başlat
          </Button>
        )}

        {isRecording && (
          <Button
            variant="destructive"
            onClick={stopAll}
            className="flex items-center gap-2"
          >
            <Square size={18} />
            Kaydı Bitir
          </Button>
        )}

        <Badge variant="outline">
          {isRecording ? "Kayıt Devam Ediyor..." : "Hazır"}
        </Badge>

        {result && (
          <div className="p-3 rounded-md border bg-muted">
            <p>
              Final Ses Skoru:{" "}
              <b>{Number(result.audio_avg ?? 0).toFixed(4)}</b>
            </p>

            <p>
              Final Video Skoru:{" "}
              <b>{Number(result.video_score ?? 0).toFixed(2)}</b>
            </p>

            <p>
              Genel Skor:{" "}
              <b>{Number(result.final_score ?? 0).toFixed(2)}</b>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
