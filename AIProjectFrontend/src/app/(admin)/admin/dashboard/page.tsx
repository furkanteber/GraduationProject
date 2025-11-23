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