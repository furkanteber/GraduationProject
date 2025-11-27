"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ArrowUpIcon } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";
import { toast } from "sonner";
import AudioVideoRecorder from "@/components/audio-video-recorder";
import { Button } from "@/components/ui/button";

const QUESTION_DURATION_SECONDS = 120;

type QuestionData = {
  topic: string;
  question: string;
  answer: string;
  metadata?: Record<string, any>;
};

export default function Interview() {
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<QuestionData[]>([]); // 👈 API'den gelecek sorular
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);
  const [isInterviewFinished, setIsInterviewFinished] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<any | null>(null);

  const startInterviewOnBackend = async (newSessionId: string) => {
    try {
      let userEmail: string | null = null;
      let profile: any = undefined;

      if (typeof window !== "undefined") {
        userEmail = window.localStorage.getItem("userEmail");
        const rawProfile = window.localStorage.getItem("interviewUserProfile");
        if (rawProfile) {
          try {
            profile = JSON.parse(rawProfile);
          } catch (e) {
            console.error("Profil verisi parse edilemedi", e);
          }
        }
      }

      await fetch("http://127.0.0.1:8000/interviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: newSessionId,
          preset: currentPreset,
          userEmail,
          profile,
        }),
      });
    } catch (err) {
      console.error("Interview start failed", err);
    }
  };

  useEffect(() => {
    const fetchQuestion = async () => {
      let preset = searchParams.get("preset");

      if (!preset && typeof window !== "undefined") {
        const savedPreset = window.localStorage.getItem("defaultInterviewPreset");
        if (savedPreset) {
          preset = savedPreset;
        }
      }

      if (preset) {
        setCurrentPreset(preset);
      }

      let fallbackQuestions: QuestionData[] | null = null;

      if (preset) {
        const presetMap: Record<string, QuestionData[]> = {
          "genel-yazilim": [
            {
              topic: "Genel Yazılım Mülakatı",
              question:
                "Kariyerin boyunca çalıştığın projelerden birinde en zorlandığın teknik problemi ve bunu nasıl çözdüğünü anlat.",
              answer:
                "Adayın problem analiz süreci, alternatif çözümler ve trade-off değerlendirmeleri hakkında konuşması beklenir.",
            },
            {
              topic: "Genel Yazılım Mülakatı",
              question:
                "HTTP, REST ve idempotent metotlar açısından iyi tasarlanmış bir API'nin özellikleri neler olmalıdır?",
              answer:
                "Adayın HTTP metotları, stateless yapı, hata kodları ve versiyonlama gibi konulara değinmesi beklenir.",
            },
            {
              topic: "Genel Yazılım Mülakatı",
              question:
                "Temiz kod yazma prensiplerinden 2-3 tanesini seçip gerçek bir örnek üzerinden açıklar mısın?",
              answer:
                "Adayın SOLID, KISS, DRY gibi prensipleri ve kendi deneyimlerinden örnekleri paylaşması beklenir.",
            },
          ],
          frontend: [
            {
              topic: "Frontend Mülakatı",
              question:
                "React ile büyük ölçekli bir uygulamada state yönetimini nasıl kurgularsın?",
              answer:
                "Adayın component hiyerarşisi, context, state management kütüphaneleri ve performans optimizasyonu üzerine konuşması beklenir.",
            },
            {
              topic: "Frontend Mülakatı",
              question:
                "Bir sayfanın ilk yüklenme süresini (Time to Interactive) iyileştirmek için neler yaparsın?",
              answer:
                "Adayın code-splitting, lazy loading, caching ve bundle optimizasyonu gibi konulara değinmesi beklenir.",
            },
            {
              topic: "Frontend Mülakatı",
              question:
                "CSS tarafında ölçeklenebilir ve yeniden kullanılabilir bir yapı kurmak için hangi yaklaşımı tercih edersin?",
              answer:
                "Adayın CSS-in-JS, utility-first, BEM veya benzeri yaklaşımları ve deneyimlerini anlatması beklenir.",
            },
          ],
          backend: [
            {
              topic: "Backend Mülakatı",
              question:
                "Yüksek trafikli bir REST API tasarlarken nelere dikkat edersin?",
              answer:
                "Adayın ölçeklenebilirlik, cache, database index'leri, monitoring ve hata yönetimi gibi konulara değinmesi beklenir.",
            },
            {
              topic: "Backend Mülakatı",
              question:
                "Bir servisi monolith'ten mikro servislere ayırma kararı alırken hangi kriterlere bakarsın?",
              answer:
                "Adayın bounded context, veri tutarlılığı, dağıtık transaction ve operasyonel karmaşıklık konularını tartması beklenir.",
            },
            {
              topic: "Backend Mülakatı",
              question:
                "Veritabanı tasarımında normalizasyon ve denormalizasyon kararlarını nasıl verirsin?",
              answer:
                "Adayın performans, okunabilirlik ve bakım maliyeti arasındaki dengeyi örneklerle açıklaması beklenir.",
            },
          ],
          analitik: [
            {
              topic: "Analitik Düşünme",
              question:
                "Sana verilen karmaşık bir problemi küçük parçalara ayırarak çözme sürecini adım adım nasıl kurgularsın? Somut bir örnek üzerinden açıklar mısın?",
              answer:
                "Adayın problemi tanımlama, varsayımları netleştirme, alt problemlere bölme, önceliklendirme ve deneme/ölçme adımlarını sistematik olarak anlatması beklenir.",
            },
            {
              topic: "Soyut Düşünme",
              question:
                "Daha önce karşılaşmadığın bir problemle karşılaştığında, geçmiş tecrübelerini ve soyut kavramları kullanarak nasıl bir çözüm yolu üretirsin?",
              answer:
                "Adayın benzer örüntüleri (pattern), prensipleri ve zihinsel modelleri kullanarak yeni probleme yaklaşımını açıklaması beklenir.",
            },
            {
              topic: "Probleme Bakış Açısı",
              question:
                "Bir ekiple birlikte çalışırken, aynı probleme farklı bakış açıları getirmek için nasıl bir ortam oluşturur ve bu fikirleri nasıl değerlendirirsin?",
              answer:
                "Adayın farklı bakış açılarını teşvik etme, tartışma kültürü, varsayımları sorgulama ve karar alma süreçlerini anlatması beklenir.",
            },
          ],
          csharp: [
            {
              topic: "C# Mülakatı",
              question:
                "C# dilinde interface ve abstract class arasındaki temel farklar nelerdir ve hangi durumlarda hangisini tercih edersin?",
              answer:
                "Adayın çoklu kalıtım, sözleşme tanımlama, varsayılan implementasyonlar ve genişletilebilirlik açısından interface vs abstract class farklarını açıklaması beklenir.",
            },
            {
              topic: "C# Mülakatı",
              question:
                ".NET'te async/await anahtar kelimeleri nasıl çalışır? Bir I/O-bound işlemi yönetirken nelere dikkat edersin?",
              answer:
                "Adayın Task tabanlı asenkron model, deadlock riskleri, ConfigureAwait ve exception yönetimi gibi konulara değinmesi beklenir.",
            },
            {
              topic: "C# Mülakatı",
              question:
                "Entity Framework veya benzeri bir ORM kullanırken performans ve veri tutarlılığı açısından hangi tuzaklara dikkat edersin?",
              answer:
                "Adayın N+1 query problemi, lazy vs eager loading, transaction yönetimi ve migration stratejileri gibi konuları anlatması beklenir.",
            },
          ],
          web: [
            {
              topic: "Web Geliştirme Mülakatı",
              question:
                "Bir web uygulamasında istemci (client) ve sunucu (server) tarafı arasındaki temel sorumlulukları nasıl ayırırsın? Örnek bir mimari üzerinden açıklar mısın?",
              answer:
                "Adayın presentation vs API katmanlarını, auth/authorization, validation ve iş kurallarının nerede konumlanacağını açıklaması beklenir.",
            },
            {
              topic: "Web Geliştirme Mülakatı",
              question:
                "HTTP'de cache mekanizmalarını (ETag, Last-Modified, Cache-Control) kullanarak bir sayfanın performansını nasıl iyileştirirsin?",
              answer:
                "Adayın tarayıcı cache, CDN, invalidation stratejileri ve doğru header kullanımını anlatması beklenir.",
            },
            {
              topic: "Web Geliştirme Mülakatı",
              question:
                "Modern bir web uygulamasında güvenlik açısından dikkat ettiğin başlıca konular nelerdir? (XSS, CSRF, SQL Injection vb.)",
              answer:
                "Adayın input validation, output encoding, token/tabanlı auth, CSRF koruması ve hazırlıklı sorgular gibi konuları örneklerle açıklaması beklenir.",
            },
          ],
          python: [
            {
              topic: "Python Mülakatı",
              question:
                "Python'da list ve tuple arasındaki temel farklar nelerdir ve hangi senaryolarda hangisini tercih edersin?",
              answer:
                "Adayın değiştirilebilirlik (mutability), performans ve veri bütünlüğü açısından list vs tuple farklarını anlatması ve örnek kullanım senaryoları vermesi beklenir.",
            },
            {
              topic: "Python Mülakatı",
              question:
                "Context manager nedir, 'with' ifadesi nasıl çalışır ve kendi context manager'ını nasıl yazarsın?",
              answer:
                "Adayın __enter__ / __exit__ metodlarını, kaynak yönetimini (dosya, bağlantı vb.) ve try/finally ile ilişkisini açıklaması beklenir.",
            },
            {
              topic: "Python Mülakatı",
              question:
                "Python'da list comprehension ve generator expression arasındaki farkları performans ve bellek kullanımı açısından açıklayabilir misin?",
              answer:
                "Adayın eager vs lazy değerlendirme farkını, bellek kullanımını ve hangi durumda hangisinin tercih edilmesi gerektiğini anlatması beklenir.",
            },
          ],
          flutter: [
            {
              topic: "Flutter Mülakatı",
              question:
                "Flutter'da widget ağacı (widget tree) nedir ve build metodu ne zaman tekrar çalışır?",
              answer:
                "Adayın immutable widget yapısını, element tree / render tree kavramlarını ve rebuild tetikleyen durumları açıklaması beklenir.",
            },
            {
              topic: "Flutter Mülakatı",
              question:
                "StatefulWidget ile StatelessWidget arasındaki fark nedir ve state yönetimi için hangi durumlarda harici paketler (Provider, Riverpod vb.) kullanırsın?",
              answer:
                "Adayın yerel state ile global/app-level state ayrımını, yeniden kullanılabilirlik ve test edilebilirlik açısından tercihlerini anlatması beklenir.",
            },
            {
              topic: "Flutter Mülakatı",
              question:
                "Flutter uygulamasında performansı artırmak için hangi optimizasyon tekniklerini kullanırsın?",
              answer:
                "Adayın const widget kullanımı, unnecessary rebuild'lerin azaltılması, listelerde key kullanımı ve lazy render tekniklerinden bahsetmesi beklenir.",
            },
          ],
          react: [
            {
              topic: "React Mülakatı",
              question:
                "React'te component lifecycle'ı (özellikle function component + hooks) nasıl yönetirsin? useEffect'i hangi durumlarda ve nasıl kullanırsın?",
              answer:
                "Adayın dependency array, cleanup fonksiyonları, effect türleri ve yanlış kullanım örnekleri (sonsuz render döngüleri vb.) hakkında konuşması beklenir.",
            },
            {
              topic: "React Mülakatı",
              question:
                "React uygulamasında performansı iyileştirmek için hangi teknikleri kullanırsın? useMemo, useCallback ve React.memo'yu nasıl konumlandırırsın?",
              answer:
                "Adayın render optimizasyonu, yeniden oluşturulan fonksiyonlar ve referans eşitliği konularına değinmesi beklenir.",
            },
            {
              topic: "React Mülakatı",
              question:
                "Global state yönetimi için hangi yaklaşımları (Context API, Redux, Zustand vb.) tercih edersin ve neden?",
              answer:
                "Adayın uygulama ölçeği, karmaşıklık, boilerplate miktarı ve geliştirici deneyimi açısından farklı state management çözümlerini kıyaslaması beklenir.",
            },
          ],
        };

        if (presetMap[preset]) {
          fallbackQuestions = presetMap[preset];
        }
      }

      // Geliştirme sırasında backend'e bağlı kalmadan sayfanın
      // çalıştığını görebilmek için mock bir soru setleyelim.
      const mock: QuestionData[] = [
        {
          topic: "Genel Yazılım",
          question:
            "HTTP ile REST API tasarlarken idempotent olan metotlar hangileridir ve neden?",
          answer:
            "GET, PUT, DELETE ve genellikle HEAD ve OPTIONS istekleri idempotent kabul edilir; çünkü aynı isteğin birden fazla kez gönderilmesi, sistemin durumunu ilk isteğin ötesinde değiştirmez.",
        },
      ];
      if (!fallbackQuestions) {
        fallbackQuestions = mock;
      }

      if (fallbackQuestions) {
        setQuestions(fallbackQuestions);
        setCurrentIndex(0);
        setError(null);
      }

      // Aşağıdaki kodu backend entegrasyonunu tekrar aktif etmek
      // istediğinde kullanabilirsin.
      try {
        const requestBody: any = {
          fast_mode: false,
        };

        if (!preset || preset === "genel-yazilim") {
          requestBody.topic = "Genel Yazılım";
        } else if (preset === "frontend") {
          requestBody.topic = "Frontend";
        } else if (preset === "backend") {
          requestBody.topic = "Backend";
        } else if (preset === "python") {
          requestBody.topic = "Python";
        } else if (preset === "flutter") {
          requestBody.topic = "Flutter";
        } else if (preset === "react") {
          requestBody.topic = "React";
        } else if (preset === "analitik") {
          requestBody.topic = "Analitik Düşünme";
        } else if (preset === "csharp") {
          requestBody.topic = "C#";
        } else if (preset === "web") {
          requestBody.topic = "Web Geliştirme";
        } else {
          requestBody.topic = "Genel Yazılım";
        }

        const res = await fetch("http://127.0.0.1:8000/questions/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          toast.error("Soru servisi hata döndü!");
          if (fallbackQuestions) {
            setQuestions(fallbackQuestions);
            setCurrentIndex(0);
            setError(null);
          } else {
            setError("Soru servisi hata döndü.");
          }
          return;
        }

        const data = await res.json();
        console.log("/questions/generate response", data);

        // Farklı response şekillerine karşı dayanıklı ol
        let first: any = undefined;

        if (data && Array.isArray(data.items) && data.items.length > 0) {
          first = data.items[0];
        } else if (Array.isArray(data) && data.length > 0) {
          first = data[0];
        } else if (data && typeof data === "object") {
          first = data;
        }

        if (first && first.question) {
          setQuestions((prev) => [...prev, first as QuestionData]);
          setError(null);
        } else {
          toast.error("Sunucudan geçerli bir soru alınamadı!");
          if (fallbackQuestions) {
            setQuestions(fallbackQuestions);
            setCurrentIndex(0);
            setError(null);
          } else {
            setError("Sunucudan geçerli bir soru alınamadı.");
          }
        }
      } catch (error) {
        console.error("API hatası:", error);
        toast.error("API bağlantı hatası!");
        if (fallbackQuestions) {
          setQuestions(fallbackQuestions);
          setCurrentIndex(0);
          setError(null);
        } else {
          setError("API bağlantı hatası.");
        }
      }
    };
    fetchQuestion();
  }, [searchParams]);

  const currentQuestion = questions[currentIndex] ?? null;
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex >= totalQuestions - 1;

  useEffect(() => {
    if (!currentQuestion || isInterviewFinished || !isRecording) {
      return;
    }

    setElapsedSeconds(0);

    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev === null) {
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [currentIndex, currentQuestion?.question, isInterviewFinished, isRecording]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        {error}
      </div>
    );
  }

  if (isInterviewFinished && finalResult) {
    const audioScoreRaw = Number(
      finalResult.audio_score ??
      (typeof finalResult.audio_avg === "number" ? finalResult.audio_avg * 100 : 0),
    );
    const audioScorePct = Math.min(audioScoreRaw, 100);
    const videoScoreRaw = Number(finalResult.video_score ?? 0);
    const videoScorePct = Math.min(videoScoreRaw, 100);

    let textScorePct = null as number | null;
    const textDetail = finalResult.detail?.text;
    if (textDetail) {
      const numTokens = Number(textDetail.num_tokens ?? 0);
      const tfidfMean = Number(textDetail.tfidf_mean ?? 0);
      const lengthScore = Math.min((numTokens / 100) * 100, 100);
      const tfidfScore = Math.min(tfidfMean * 100, 100);
      textScorePct = 0.5 * lengthScore + 0.5 * tfidfScore;
    }

    const questionsDetail: any[] = Array.isArray(finalResult.questions)
      ? finalResult.questions
      : [];

    return (
      <div className="flex flex-col gap-6 p-6 h-[calc(100vh-var(--header-height))] bg-gray-50">
        <h2 className="text-2xl font-semibold">Mülakat Analizi</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-500">Ses Skoru</span>
            <span className="text-2xl font-semibold text-gray-900">
              {audioScorePct.toFixed(0)}%
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-500">Video Skoru</span>
            <span className="text-2xl font-semibold text-gray-900">
              {videoScorePct.toFixed(0)}%
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-500">Metin Skoru</span>
            <span className="text-2xl font-semibold text-gray-900">
              {textScorePct !== null ? textScorePct.toFixed(0) + "%" : "-"}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Yapay Zeka Geri Bildirimi (Test Verisi)</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Bu metin şu anda test amaçlı olarak sabit yazılmıştır. Gerçek senaryoda buraya adayın
            ses, mimik ve verdiği cevapların içeriğine göre üretilmiş detaylı bir yapay zeka geri
            bildirimi gelecektir.
          </p>
        </div>

        {questionsDetail.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Soru Bazlı Detaylar</h3>
            <div className="space-y-3">
              {questionsDetail
                .slice()
                .sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0))
                .map((q: any, idx: number) => {
                  const durationRaw = Number(
                    q.duration_seconds ?? q.metadata?.durationSeconds ?? 0,
                  );
                  const minutes = Math.floor(durationRaw / 60);
                  const seconds = durationRaw % 60;
                  const questionScoreRaw = Number(
                    q.score ?? q.metadata?.questionScore ?? NaN,
                  );
                  const hasQuestionScore = !Number.isNaN(questionScoreRaw);

                  return (
                    <div
                      key={idx}
                      className="border rounded-lg p-3 flex flex-col gap-1 bg-gray-50"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800">
                          Soru {(q.index ?? idx) + 1}
                          {q.topic ? ` - ${q.topic}` : ""}
                        </span>
                        <span className="font-mono text-xs text-gray-500">
                          Süre: {String(minutes).padStart(2, "0")}:
                          {String(seconds).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {q.question}
                      </p>
                      {q.answer && (
                        <p className="text-xs text-gray-700">
                          Cevap: {String(q.answer).slice(0, 160)}
                          {String(q.answer).length > 160 ? "..." : ""}
                        </p>
                      )}
                      {hasQuestionScore && (
                        <p className="text-xs text-gray-700">
                          Tahmini Soru Skoru: {questionScoreRaw.toFixed(1)} / 100
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="flex flex-1 gap-4 p-4 h-[calc(100vh-var(--header-height))] bg-gray-50">
      {/* Sol Panel: Soru */}
      <div className="w-2/3 bg-white p-6 rounded-xl shadow-sm overflow-auto">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="text-xl font-semibold">Konu: {currentQuestion.topic}</h2>
          {totalQuestions > 0 && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                Soru {currentIndex + 1} / {totalQuestions}
              </span>
              {elapsedSeconds !== null && (
                <span className="font-mono text-xs">
                  Süre:{" "}
                  {String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:
                  {String(elapsedSeconds % 60).padStart(2, "0")}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="bg-gray-100 p-4 rounded-lg space-y-3">
          {isRecording ? (
            <p className="text-gray-800">{currentQuestion.question}</p>
          ) : (
            <p className="text-gray-600 text-sm">
              Soru kayda başladıktan sonra görünecektir. Lütfen kaydı başlatın.
            </p>
          )}

          {!isInterviewFinished && (
            <div className="flex justify-end pt-2">
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!isRecording}
                onClick={async () => {
                  if (!currentQuestion) return;
                  try {
                    let profile: any = undefined;
                    if (typeof window !== "undefined") {
                      const raw = window.localStorage.getItem("interviewUserProfile");
                      if (raw) {
                        try {
                          profile = JSON.parse(raw);
                        } catch (e) {
                          console.error("Profil verisi parse edilemedi", e);
                        }
                      }
                    }

                    const res = await fetch("http://127.0.0.1:8000/answers", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        sessionId: sessionId || undefined,
                        question: currentQuestion.question,
                        answer: textAnswer,
                        topic: currentQuestion.topic,
                        metadata: {
                          ...currentQuestion.metadata,
                          questionIndex: currentIndex,
                          totalQuestions,
                          profile,
                          durationSeconds: elapsedSeconds,
                          expectedAnswer: currentQuestion.answer,
                        },
                      }),
                    });

                    if (!res.ok) {
                      toast.error("Cevap kaydedilemedi.");
                      return;
                    }

                    toast.success("Cevabınız kaydedildi.");

                    // Mevcut sorunun ses/video kayıtlarını analiz et
                    try {
                      await fetch(`http://127.0.0.1:8000/interviews/${sessionId}/question/analyze`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          questionIndex: currentIndex,
                          questionText: currentQuestion.question,
                          expectedAnswer: currentQuestion.answer,
                          userAnswer: textAnswer,
                          durationSeconds: elapsedSeconds,
                        }),
                      });
                      console.log("[interview] Soru analizi tamamlandı:", currentIndex);
                    } catch (analyzeErr) {
                      console.error("[interview] Soru analizi hatası:", analyzeErr);
                    }

                    setTextAnswer("");
                    const isLastQuestion = currentIndex >= questions.length - 1;

                    if (isLastQuestion) {
                      setIsInterviewFinished(true);
                    } else {
                      setCurrentIndex((idx) =>
                        idx < questions.length - 1 ? idx + 1 : idx,
                      );
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error("Sunucu hatası, cevap kaydedilemedi.");
                  }
                }}
              >
                {isLastQuestion ? "Mülakatı Bitir" : "Yeni soruya geç"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sağ Panel: Kamera + Zaman + Cevap */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <AudioVideoRecorder
            onSessionIdReady={(id) => {
              setSessionId(id);
              startInterviewOnBackend(id);
            }}
            autoStartDelayMs={3000}
            secondsLeft={elapsedSeconds}
            canStopRecording={isInterviewFinished}
            onRecordingChange={(recording) => setIsRecording(recording)}
            shouldStopRecording={isInterviewFinished}
            onResult={(res) => setFinalResult(res)}
            questionIndex={currentIndex}
          />
        </div>

        <div className="flex-1">
          <InputGroup>
            <InputGroupTextarea
              placeholder="Cevabınızı buraya yazınız..."
              className="h-full min-h-[120px] rounded-xl"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={!isRecording}
            />
          </InputGroup>
        </div>
      </div>
    </div>
  );
}
