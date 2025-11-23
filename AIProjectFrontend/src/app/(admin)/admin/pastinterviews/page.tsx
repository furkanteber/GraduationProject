"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type SessionResult = {
  sessionId: string;
  audio_avg?: number;
  video_score?: number;
  final_score?: number;
  created_at?: string;
  audio_chunk_count?: number;
  video_frame_count?: number;
  question?: string;
  written_answer?: string;
  detail?: any;
};

export default function PastInterviews() {
  const [items, setItems] = useState<SessionResult[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://127.0.0.1:8000/sessions/results?limit=50");
        if (!res.ok) {
          toast.error("Geçmiş oturumlar alınamadı.");
          return;
        }
        const data = await res.json();
        setItems(data);
      } catch (e) { 
        console.error(e);
        toast.error("Sunucu hatası, geçmiş oturumlar yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        Geçmiş mülakatlar yükleniyor...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        Henüz kaydedilmiş bir mülakat sonucu bulunmuyor.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {items.map((item) => {
        const isOpen = expanded === item.sessionId;
        return (
          <Card key={item.sessionId} className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">
                  Oturum ID: <span className="font-mono">{item.sessionId}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Ses: <b>{Number(item.audio_avg ?? 0).toFixed(3)}</b> | Video:{" "}
                  <b>{Number(item.video_score ?? 0).toFixed(2)}</b> | Genel:{" "}
                  <b>{Number(item.final_score ?? 0).toFixed(2)}</b>
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setExpanded(isOpen ? null : item.sessionId)}
              >
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </CardHeader>
            {isOpen && (
              <CardContent className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  Oluşturulma: {" "}
                  <b>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "-"}
                  </b>
                </p>
                <p>
                  Soru: {" "}
                  <span className="font-medium">
                    {item.question || "—"}
                  </span>
                </p>
                <p>
                  Yazılı Cevap: {" "}
                  <span className="text-muted-foreground">
                    {item.written_answer
                      ? item.written_answer.slice(0, 160) +
                      (item.written_answer.length > 160 ? "..." : "")
                      : "—"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Ses chunk sayısı: <b>{item.audio_chunk_count ?? 0}</b> ·{" "}
                  Video frame sayısı: <b>{item.video_frame_count ?? 0}</b>
                </p>
                {item.detail && (
                  <pre className="mt-2 text-[11px] whitespace-pre-wrap break-words border rounded-md p-2 bg-muted">
                    {JSON.stringify(item.detail, null, 2)}
                  </pre>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}