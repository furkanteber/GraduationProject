"use client";

import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AudioVideoRecorder from "@/components/audio-video-recorder";

const INTERVIEW_PRESETS = [
  {
    id: "genel-yazilim",
    title: "Genel Yazılım Mülakatı",
    description: "HTTP, REST, veri yapıları ve temiz kod soruları.",
  },
  {
    id: "frontend",
    title: "Frontend Mülakatı",
    description: "React, JavaScript ve performans odaklı sorular.",
  },
  {
    id: "backend",
    title: "Backend Mülakatı",
    description: "API tasarımı, veritabanı ve ölçeklenebilirlik soruları.",
  },
  {
    id: "analitik",
    title: "Analitik Düşünme Mülakatı",
    description: "Soyut düşünme ve problem çözme bakış açısı odaklı sorular.",
  },
  {
    id: "python",
    title: "Python Mülakatı",
    description: "Python, OOP, veri yapıları ve hata ayıklama soruları.",
  },
  {
    id: "flutter",
    title: "Flutter Mülakatı",
    description: "Widget ağacı, state management ve performans soruları.",
  },
  {
    id: "react",
    title: "React Mülakatı",
    description: "React component yapısı, hooks ve performans soruları.",
  },
  {
    id: "csharp",
    title: "C# Mülakatı",
    description: "C#, .NET, OOP ve asenkron programlama soruları.",
  },
  {
    id: "web",
    title: "Web Geliştirme Mülakatı",
    description: "HTTP, tarayıcı, HTML/CSS/JS ve tam yığın web geliştirme soruları.",
  },
];

export default function Dashboard() {
  const router = useRouter();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Ana Sayfa</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {INTERVIEW_PRESETS.map((preset) => (
          <Card key={preset.id} className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>{preset.title}</CardTitle>
              <CardDescription>{preset.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => router.push(`/admin/interview?preset=${preset.id}`)}
              >
                Bu mülakatı başlat
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}