"use client";
import { useEffect, useRef, useState } from "react";
import CameraPage from "../camera/page";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ArrowUpIcon, Clock, SkipForward, SkipBack } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Interview() {
  const [seconds, setSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(true);
  const [questionData, setQuestionData] = useState(null); // 👈 API'den gelecek soru
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRecording) {
        e.preventDefault();
        e.returnValue =
          "Kamera kaydı devam ediyor. Sayfadan ayrılmak istediğinize emin misiniz?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isRecording]);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/question");
        const data = await res.json();
        if (data?.question) {
          setQuestionData(data);
        } else {
          toast.error("Sunucudan geçerli bir soru alınamadı!");
        }
      } catch (error) {
        console.error("API hatası:", error);
        toast.error("API bağlantı hatası!");
      }
    };
    fetchQuestion();
  }, []);

  const handleFinish = () => {
    setIsRecording(false);
    toast.success("Mülakat tamamlandı!");
  };

  if (!questionData) {
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
        <h2 className="text-xl font-semibold mb-3">Konu: {questionData.topic}</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-gray-800">{questionData.question}</p>

          <p className="text-gray-800">{questionData.answer}</p>
        </div>
      </div>

      {/* Sağ Panel: Kamera + Zaman + Cevap */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="relative bg-black rounded-xl overflow-hidden h-64 flex items-center justify-center">
            <CameraPage />
          </div>

          <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Clock className="w-4 h-4 text-green-600" />
              <span>
                {Math.floor(seconds / 60)}:
                {String(seconds % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleFinish}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Bitir
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <InputGroup>
            <InputGroupTextarea
              placeholder="Cevabınızı buraya yazınız..."
              className="h-full min-h-[120px] rounded-xl"
            />
            <InputGroupAddon align="block-end">
              <InputGroupText className="ml-auto" />
              <Separator orientation="vertical" className="!h-4" />
              <InputGroupButton
                variant="default"
                className="rounded-full cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                size="icon-xs"
              >
                <ArrowUpIcon />
                <span className="sr-only">Gönder</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </div>
  );
}
