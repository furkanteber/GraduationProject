"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const countChartConfig = {
  sessions: {
    label: "Oturum Sayısı",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const scoreChartConfig = {
  final_score: {
    label: "Genel Skor",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const audioVideoChartConfig = {
  audio_avg: {
    label: "Ses Skoru",
    color: "var(--primary)",
  },
  video_score: {
    label: "Video Skoru",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const lastSessionsTrendConfig = {
  final_score: {
    label: "Genel Skor",
    color: "var(--primary)",
  },
  audio_avg: {
    label: "Ses Skoru",
    color: "var(--chart-1)",
  },
  video_score: {
    label: "Video Skoru",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function Analyses() {
  const [items, setItems] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const sortedSessions = useMemo(() => {
    if (!items.length) return [] as SessionResult[];

    return [...items].sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      // Yeni tarih en üstte olsun (azalan sıralama)
      return db - da;
    });
  }, [items]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://127.0.0.1:8000/sessions/results?limit=200");
        if (!res.ok) {
          toast.error("Analiz verileri alınamadı.");
          return;
        }
        const data = await res.json();
        setItems(data || []);
      } catch (e) {
        console.error(e);
        toast.error("Sunucu hatası, analiz verileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  useEffect(() => {
    if (sortedSessions.length && !selectedSessionId) {
      setSelectedSessionId(sortedSessions[0].sessionId);
    }
  }, [sortedSessions, selectedSessionId]);

  const byDate = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        sessions: number;
        sum_final: number;
        sum_audio: number;
        sum_video: number;
      }
    >();

    for (const item of items) {
      const d = item.created_at ? new Date(item.created_at) : null;
      const key = d ? d.toISOString().slice(0, 10) : "Bilinmiyor";
      const current = map.get(key) || {
        date: key,
        sessions: 0,
        sum_final: 0,
        sum_audio: 0,
        sum_video: 0,
      };

      current.sessions += 1;
      if (typeof item.final_score === "number") {
        current.sum_final += item.final_score;
      }
      if (typeof item.audio_avg === "number") {
        current.sum_audio += item.audio_avg;
      }
      if (typeof item.video_score === "number") {
        current.sum_video += item.video_score;
      }

      map.set(key, current);
    }

    const result = Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((x) => ({
        date: x.date,
        sessions: x.sessions,
        avg_final: x.sessions ? x.sum_final / x.sessions : 0,
        avg_audio: x.sessions ? x.sum_audio / x.sessions : 0,
        avg_video: x.sessions ? x.sum_video / x.sessions : 0,
      }));

    return result;
  }, [items]);

  const distributionData = useMemo(() => {
    const buckets = [
      { label: "0-20", min: 0, max: 20, count: 0 },
      { label: "20-40", min: 20, max: 40, count: 0 },
      { label: "40-60", min: 40, max: 60, count: 0 },
      { label: "60-80", min: 60, max: 80, count: 0 },
      { label: "80-100", min: 80, max: 100, count: 0 },
    ];

    for (const item of items) {
      if (typeof item.final_score !== "number") continue;
      for (const b of buckets) {
        if (item.final_score >= b.min && item.final_score < b.max) {
          b.count += 1;
          break;
        }
      }
    }

    return buckets;
  }, [items]);

  const lastSessions = useMemo(() => {
    if (!items.length) return [];

    const sorted = [...items].sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return da - db;
    });

    const slice = sorted.slice(-10);

    return slice.map((item, index) => {
      const d = item.created_at ? new Date(item.created_at) : null;

      return {
        label: d
          ? d.toLocaleString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
          : item.sessionId || `Oturum ${index + 1}`,
        final_score:
          typeof item.final_score === "number" ? item.final_score : 0,
        audio_avg: typeof item.audio_avg === "number" ? item.audio_avg : 0,
        video_score:
          typeof item.video_score === "number" ? item.video_score : 0,
      };
    });
  }, [items]);

  const selectedSession = useMemo(() => {
    if (!items.length) return null;

    const found = selectedSessionId
      ? items.find((item) => item.sessionId === selectedSessionId)
      : null;

    return found || items[0];
  }, [items, selectedSessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        Analiz verileri yükleniyor...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        Henüz analiz edilecek bir oturum verisi bulunmuyor.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>Seçili oturum detayı</CardTitle>
          <Select
            value={selectedSessionId ?? undefined}
            onValueChange={(value) => setSelectedSessionId(value)}
          >
            <SelectTrigger className="w-full md:w-72">
              <SelectValue placeholder="Oturum seçin" />
            </SelectTrigger>
            <SelectContent>
              {sortedSessions.map((item) => {
                const createdLabel = item.created_at
                  ? new Date(item.created_at).toLocaleString("tr-TR")
                  : "Tarih yok";

                return (
                  <SelectItem key={item.sessionId} value={item.sessionId}>
                    {item.sessionId.slice(0, 8)}... {createdLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {!selectedSession ? (
            <p className="text-xs text-muted-foreground">
              Oturum verisi bulunamadı.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Oturum ID: <b className="font-mono">{selectedSession.sessionId}</b>
              </p>
              <p className="text-xs text-muted-foreground">
                Oluşturulma:{" "}
                <b>
                  {selectedSession.created_at
                    ? new Date(selectedSession.created_at).toLocaleString("tr-TR")
                    : "-"}
                </b>
              </p>
              <p>
                Ses skoru:{" "}
                <b>{Number(selectedSession.audio_avg ?? 0).toFixed(3)}</b>
                Video skoru:{" "}
                <b>{Number(selectedSession.video_score ?? 0).toFixed(2)}</b>
                Genel skor:{" "}
                <b>{Number(selectedSession.final_score ?? 0).toFixed(2)}</b>
              </p>
              <p className="text-xs text-muted-foreground">
                Ses chunk sayısı: <b>{selectedSession.audio_chunk_count ?? 0}</b>
                Video frame sayısı: <b>{selectedSession.video_frame_count ?? 0}</b>
              </p>
              <p>
                Soru:{" "}
                <span className="font-medium">
                  {selectedSession.question || ""}
                </span>
              </p>
              <p>
                Yazılı cevap:{" "}
                <span className="text-muted-foreground">
                  {selectedSession.written_answer
                    ? selectedSession.written_answer.slice(0, 200) +
                    (selectedSession.written_answer.length > 200 ? "..." : "")
                    : ""}
                </span>
              </p>
              {selectedSession.detail && (
                <pre className="mt-2 text-[11px] whitespace-pre-wrap break-words border rounded-md p-2 bg-muted">
                  {JSON.stringify(selectedSession.detail, null, 2)}
                </pre>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Günlük oturum sayısı</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={countChartConfig}
              className="aspect-auto h-[260px] w-full"
            >
              <BarChart data={byDate}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis allowDecimals={false} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="sessions"
                  fill="var(--color-sessions)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Günlük ortalama genel skor</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={scoreChartConfig}
              className="aspect-auto h-[260px] w-full"
            >
              <AreaChart data={byDate}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="avg_final"
                  type="monotone"
                  fill="var(--color-final_score)"
                  stroke="var(--color-final_score)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ses / Video ortalama skorları (günlük)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={audioVideoChartConfig}
              className="aspect-auto h-[260px] w-full"
            >
              <AreaChart data={byDate}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="avg_audio"
                  type="monotone"
                  fill="var(--color-audio_avg)"
                  stroke="var(--color-audio_avg)"
                />
                <Area
                  dataKey="avg_video"
                  type="monotone"
                  fill="var(--color-video_score)"
                  stroke="var(--color-video_score)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Genel skor dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={scoreChartConfig}
              className="aspect-auto h-[260px] w-full"
            >
              <BarChart data={distributionData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis allowDecimals={false} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-final_score)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Son 10 oturum - ses / video / genel skor</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={lastSessionsTrendConfig}
              className="aspect-auto h-[260px] w-full"
            >
              <BarChart data={lastSessions}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="audio_avg"
                  fill="var(--color-audio_avg)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="video_score"
                  fill="var(--color-video_score)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="final_score"
                  fill="var(--color-final_score)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}