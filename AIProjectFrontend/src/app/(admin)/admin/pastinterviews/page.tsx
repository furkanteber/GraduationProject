"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type InterviewRecord = {
  sessionId: string;
  preset?: string;
  userEmail?: string;
  profile?: any;
  started_at?: string;
  finished_at?: string;
  status?: "in_progress" | "completed";
  questions?: any[];
  overall_scores?: {
    audio_avg?: number;
    audio_score?: number;
    video_score?: number;
    final_score?: number;
    detail?: any;
  };
};

type SessionResult = {
  sessionId: string;
  preset?: string;
  audio_avg?: number;
  audio_score?: number;
  video_score?: number;
  final_score?: number;
  created_at?: string;
  audio_chunk_count?: number;
  video_frame_count?: number;
  question?: string;
  written_answer?: string;
  detail?: any;
  questions?: any[];
};

export default function PastInterviews() {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "in_progress" | "completed">("all");

  const fetchData = async () => {
    try {
      setLoading(true);

      // Mülakatları çek (başlatılan tüm mülakatlar)
      const interviewsRes = await fetch("http://127.0.0.1:8000/interviews?limit=100");
      if (interviewsRes.ok) {
        const interviewsData = await interviewsRes.json();
        setInterviews(interviewsData);
      }

      // Detaylı sonuçları da çek
      const resultsRes = await fetch("http://127.0.0.1:8000/sessions/results?limit=50");
      if (resultsRes.ok) {
        const resultsData = await resultsRes.json();
        setResults(resultsData);
      }
    } catch (e) {
      console.error(e);
      toast.error("Sunucu hatası, mülakat verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Bu mülakatı silmek istediğinize emin misiniz?")) return;
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/interviews/${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Mülakat silindi");
        setInterviews((prev) => prev.filter((i) => i.sessionId !== sessionId));
      } else {
        toast.error("Silme işlemi başarısız");
      }
    } catch (e) {
      console.error(e);
      toast.error("Sunucu hatası");
    }
  };

  const filteredInterviews = useMemo(() => {
    if (activeTab === "all") return interviews;
    return interviews.filter((i) => i.status === activeTab);
  }, [interviews, activeTab]);

  const inProgressCount = interviews.filter((i) => i.status === "in_progress").length;
  const completedCount = interviews.filter((i) => i.status === "completed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        Mülakatlar yükleniyor...
      </div>
    );
  }

  if (!interviews.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        Henüz kaydedilmiş bir mülakat bulunmuyor.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Tab Bar */}
      <div className="flex gap-2 border-b pb-3">
        <Button
          variant={activeTab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("all")}
        >
          Tümü ({interviews.length})
        </Button>
        <Button
          variant={activeTab === "in_progress" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("in_progress")}
        >
          Devam Eden ({inProgressCount})
        </Button>
        <Button
          variant={activeTab === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("completed")}
        >
          Tamamlanan ({completedCount})
        </Button>
      </div>

      {/* Interview Cards */}
      {filteredInterviews.map((interview) => {
        const isOpen = expanded === interview.sessionId;
        const result = results.find((r) => r.sessionId === interview.sessionId);
        const scores = interview.overall_scores;

        return (
          <Card key={interview.sessionId} className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    Mülakat: <span className="font-mono text-sm">{interview.sessionId.slice(0, 8)}...</span>
                  </CardTitle>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      interview.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {interview.status === "completed" ? "Tamamlandı" : "Devam Ediyor"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {interview.userEmail && <>Kullanıcı: <b>{interview.userEmail}</b> · </>}
                  Preset: <b>{interview.preset || "-"}</b>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Başlangıç: <b>{interview.started_at ? new Date(interview.started_at).toLocaleString("tr-TR") : "-"}</b>
                  {interview.finished_at && (
                    <> · Bitiş: <b>{new Date(interview.finished_at).toLocaleString("tr-TR")}</b></>
                  )}
                </p>
                {scores && (
                  <p className="text-sm mt-1">
                    Ses: <b>{(scores.audio_score ?? 0).toFixed(0)}%</b> · 
                    Video: <b>{(scores.video_score ?? 0).toFixed(0)}%</b> · 
                    Genel: <b>{(scores.final_score ?? 0).toFixed(0)}%</b>
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(interview.sessionId)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setExpanded(isOpen ? null : interview.sessionId)}
                >
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              </div>
            </CardHeader>
            {isOpen && (
              <CardContent className="space-y-3 text-sm">
                {/* Profil Bilgisi */}
                {interview.profile && Object.keys(interview.profile).length > 0 && (
                  <div className="bg-gray-50 border rounded-lg p-3">
                    <p className="text-xs font-semibold mb-1">Aday Profili</p>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {interview.profile.name && <p>Ad: <b>{interview.profile.name}</b></p>}
                      {interview.profile.experience && <p>Deneyim: <b>{interview.profile.experience}</b></p>}
                      {interview.profile.education && <p>Eğitim: <b>{interview.profile.education}</b></p>}
                    </div>
                  </div>
                )}

                {/* Sorular */}
                {interview.questions && interview.questions.length > 0 && (
                  <div className="bg-white border rounded-lg p-3">
                    <p className="text-sm font-semibold mb-2">Sorulan Sorular ({interview.questions.length})</p>
                    <div className="space-y-2">
                      {interview.questions.map((q: any, idx: number) => (
                        <div key={idx} className="border rounded-md p-2 bg-gray-50">
                          <p className="text-xs font-medium">Soru {idx + 1}: {q.question || q.topic || "-"}</p>
                          {q.answer && (
                            <p className="text-xs text-gray-600 mt-1">
                              Cevap: {String(q.answer).slice(0, 200)}{String(q.answer).length > 200 ? "..." : ""}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detaylı Sonuç (varsa) */}
                {result && result.detail && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold mb-1">Detaylı Analiz</p>
                    <div className="text-xs text-gray-700 grid grid-cols-2 gap-2">
                      {result.detail.focus_score !== undefined && (
                        <p>Odaklanma: <b>{result.detail.focus_score.toFixed(0)}%</b></p>
                      )}
                      {result.detail.stability_score !== undefined && (
                        <p>Stabilite: <b>{result.detail.stability_score.toFixed(0)}%</b></p>
                      )}
                      {result.detail.positive_avg !== undefined && (
                        <p>Pozitiflik: <b>{result.detail.positive_avg.toFixed(0)}%</b></p>
                      )}
                      {result.detail.stress_avg !== undefined && (
                        <p>Stres: <b>{result.detail.stress_avg.toFixed(0)}%</b></p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
