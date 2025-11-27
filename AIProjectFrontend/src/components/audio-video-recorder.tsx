"use client";

import React, { useState, useEffect, useRef } from "react";
import { createSessionId } from "../lib/session";
import { useAudioStreamer } from "@/hooks/useAudioStreamer";
import { useVideoStreamer } from "@/hooks/useVideoStreamer";
import { finalizeSession } from "../lib/finalize";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mic, Camera, Square } from "lucide-react";

type Props = {
  onSessionIdReady?: (sessionId: string) => void;
  autoStartDelayMs?: number;
  secondsLeft?: number | null;
  canStopRecording?: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
  shouldStopRecording?: boolean;
  onResult?: (result: any) => void;
  questionIndex?: number;
};

export default function AudioVideoRecorder({
  onSessionIdReady,
  autoStartDelayMs,
  secondsLeft,
  canStopRecording,
  onRecordingChange,
  shouldStopRecording,
  onResult,
  questionIndex = 0,
}: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const hasShownAutoStartToast = useRef(false);

  const { start: startAudio, stop: stopAudio, setQuestionIndex: setAudioQuestionIndex } = useAudioStreamer();
  const { videoRef, start: startVideo, stop: stopVideo, setQuestionIndex: setVideoQuestionIndex } = useVideoStreamer();

  // questionIndex değiştiğinde hook'lara bildir
  useEffect(() => {
    setAudioQuestionIndex(questionIndex);
    setVideoQuestionIndex(questionIndex);
  }, [questionIndex]);

  const effectiveAutoStartDelay = autoStartDelayMs ?? 3000;

  const startAll = () => {
    const id = createSessionId();
    setSessionId(id);

    if (onSessionIdReady) {
      onSessionIdReady(id);
    }

    // Başlangıç için küçük delay
    setTimeout(() => {
      startAudio(id, questionIndex);
      startVideo(id, questionIndex);
      setIsRecording(true);
      if (onRecordingChange) {
        onRecordingChange(true);
      }
    }, 80);
  };

  const stopAll = async () => {
    setIsRecording(false);
    if (onRecordingChange) {
      onRecordingChange(false);
    }

    stopAudio();
    stopVideo();

    // Son chunk’ın backend’e ulaşması için
    await new Promise((res) => setTimeout(res, 300));

    if (!sessionId) return;

    try {
      const data = await finalizeSession(sessionId);
      setResult(data);
      if (onResult) {
        onResult(data);
      }
    } catch (err) {
      console.error("[finalize] error", err);
      toast.error("Final skor alınırken hata oluştu. Backend (127.0.0.1:8000) çalışıyor mu?");
    }
  };

  useEffect(() => {
    console.log("[AVR] useEffect autoStartDelayMs", effectiveAutoStartDelay);
    if (!effectiveAutoStartDelay || hasShownAutoStartToast.current) return;

    hasShownAutoStartToast.current = true;

    toast.info("Mülakat 3 saniye içinde başlayacak. Hazırlanın.");

    const timer = setTimeout(() => {
      console.log("[AVR] calling startAll()");
      startAll();
    }, effectiveAutoStartDelay);

    return () => clearTimeout(timer);
  }, [effectiveAutoStartDelay]);

  useEffect(() => {
    if (shouldStopRecording && isRecording) {
      stopAll();
    }
  }, [shouldStopRecording, isRecording]);

  return (
    <Card className="w-full max-w-xl mx-auto shadow-md">
      <CardContent className="space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Mülakat Kaydı</span>
        </div>
        <video
          ref={videoRef}
          className="w-full h-auto rounded-md border"
          autoPlay
          muted
        />

        {!isRecording && (
          <Button
            variant="default"
            onClick={startAll}
            className="flex items-center gap-2"
          >
            <Mic size={18} />
            Kaydı Başlat
          </Button>
        )}

        {isRecording && canStopRecording && (
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
          <div className="p-3 rounded-md border bg-muted space-y-1 text-sm">
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

            {result.detail && (
              <>
                <Separator className="my-1" />
                <p>
                  Pozitif Duygu Ortalaması:{" "}
                  <b>{Number(result.detail.positive_avg ?? 0).toFixed(2)}</b>
                </p>
                <p>
                  Stres Ortalaması:{" "}
                  <b>{Number(result.detail.stress_avg ?? 0).toFixed(2)}</b>
                </p>
                <p>
                  Odak Skoru:{" "}
                  <b>{Number(result.detail.focus_score ?? 0).toFixed(2)}</b>
                </p>
                <p>
                  Stabilite Skoru:{" "}
                  <b>{Number(result.detail.stability_score ?? 0).toFixed(2)}</b>
                </p>
                {result.detail.text && (
                  <>
                    <Separator className="my-1" />
                    <p>
                      Metin Uzunluğu (token):{" "}
                      <b>{Number(result.detail.text.num_tokens ?? 0)}</b>
                    </p>
                    {result.detail.text.combined_text && (
                      <p className="text-xs text-muted-foreground">
                        Metin Özeti: {String(result.detail.text.combined_text).slice(0, 120)}
                        {String(result.detail.text.combined_text).length > 120 ? "..." : ""}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
