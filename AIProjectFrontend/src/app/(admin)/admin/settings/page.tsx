"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INTERVIEW_PRESETS = [
  { id: "genel-yazilim", label: "Genel Yazılım Mülakatı" },
  { id: "frontend", label: "Frontend Mülakatı" },
  { id: "backend", label: "Backend Mülakatı" },
];

export default function Settings() {
  const [defaultPreset, setDefaultPreset] = useState<string>("");
  const [interests, setInterests] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedPreset = window.localStorage.getItem("defaultInterviewPreset");
    if (savedPreset) {
      setDefaultPreset(savedPreset);
    }

    const savedProfileRaw = window.localStorage.getItem("interviewUserProfile");
    if (savedProfileRaw) {
      try {
        const parsed = JSON.parse(savedProfileRaw);
        setInterests(parsed.interests || "");
        setSkills(parsed.skills || "");
        setExperience(parsed.experience || "");
        setEducation(parsed.education || "");
        setTargetRole(parsed.targetRole || "");
        setCompanyType(parsed.companyType || "");
        setCustomFields(
          Array.isArray(parsed.customFields)
            ? parsed.customFields
            : [],
        );
      } catch (e) {
        console.error("Profil verisi okunamadı", e);
      }
    }
    setHasLoadedProfile(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedProfile) return;
    if (typeof window === "undefined") return;

    if (defaultPreset) {
      window.localStorage.setItem("defaultInterviewPreset", defaultPreset);
    }

    const existingRaw = window.localStorage.getItem("interviewUserProfile");
    let existing: any = {};
    if (existingRaw) {
      try {
        existing = JSON.parse(existingRaw);
      } catch (e) {
        console.error("Profil verisi okunamadı", e);
      }
    }

    window.localStorage.setItem(
      "interviewUserProfile",
      JSON.stringify({
        ...existing,
        interests,
        skills,
        experience,
        education,
        targetRole,
        companyType,
        customFields,
      }),
    );
  }, [
    hasLoadedProfile,
    defaultPreset,
    interests,
    skills,
    experience,
    education,
    targetRole,
    companyType,
    customFields,
  ]);

  const handleSave = () => {
    if (typeof window === "undefined") return;
    if (!defaultPreset) {
      toast.error("Lütfen varsayılan bir mülakat tipi seçin.");
      return;
    }

    const hasCustomField = customFields.some(
      (f) => f.key.trim() !== "" || f.value.trim() !== "",
    );

    const isProfileEmpty =
      !targetRole.trim() &&
      !companyType &&
      !interests.trim() &&
      !skills.trim() &&
      !experience.trim() &&
      !education.trim() &&
      !hasCustomField;

    if (isProfileEmpty) {
      toast.error("Lütfen en az bir profil alanını doldurun.");
      return;
    }

    window.localStorage.setItem("defaultInterviewPreset", defaultPreset);
    window.localStorage.setItem(
      "interviewUserProfile",
      JSON.stringify({
        interests,
        skills,
        experience,
        education,
        targetRole,
        companyType,
        customFields,
      }),
    );

    toast.success("Mülakat ayarları ve profil bilgileri kaydedildi.");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Mülakat Ayarları</h1>
        <p className="text-sm text-muted-foreground">
          Buradan varsayılan mülakat tipini ve aday profili bilgilerini belirleyebilirsin.
          Bu bilgiler soru üretimini kişiselleştirmek için kullanılacaktır.
        </p>
      </div>

      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Profili & Mülakat</CardTitle>
            <CardDescription>
              İlgi alanları, beceriler ve geçmiş deneyim gibi bilgiler soru üretiminde
              kullanılacaktır.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-preset">Varsayılan mülakat tipi</Label>
              <Select
                value={defaultPreset || undefined}
                onValueChange={(value) => setDefaultPreset(value)}
              >
                <SelectTrigger id="default-preset">
                  <SelectValue placeholder="Bir mülakat tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-role">Hedef pozisyon</Label>
              <Input
                id="target-role"
                placeholder="Örn. Frontend Developer, Backend Developer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-type">Şirket türü</Label>
              <Select
                value={companyType || undefined}
                onValueChange={(value) => setCompanyType(value)}
              >
                <SelectTrigger id="company-type">
                  <SelectValue placeholder="Örn. Startup, Kurumsal, KOBİ..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="kobi">KOBİ</SelectItem>
                  <SelectItem value="kurumsal">Kurumsal</SelectItem>
                  <SelectItem value="ajans">Ajans / Danışmanlık</SelectItem>
                  <SelectItem value="diger">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">İlgi alanları</Label>
              <Textarea
                id="interests"
                placeholder="Örn. web geliştirme, yapay zeka, mobil uygulamalar..."
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Ek alanlar</Label>
              <p className="text-xs text-muted-foreground">
                Buraya istediğin ekstra başlık ve değerleri ekleyebilirsin (ör. çalışma şekli,
                maaş beklentisi vb.).
              </p>
              <div className="space-y-2">
                {customFields.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Alan adı"
                      value={field.key}
                      onChange={(e) =>
                        setCustomFields((prev) => {
                          const next = [...prev];
                          next[index] = { ...next[index], key: e.target.value };
                          return next;
                        })
                      }
                    />
                    <Input
                      placeholder="Değer"
                      value={field.value}
                      onChange={(e) =>
                        setCustomFields((prev) => {
                          const next = [...prev];
                          next[index] = { ...next[index], value: e.target.value };
                          return next;
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCustomFields((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                    >
                      X
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCustomFields((prev) => [...prev, { key: "", value: "" }])
                  }
                >
                  + Alan ekle
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Yetenekler / beceriler</Label>
              <Textarea
                id="skills"
                placeholder="Örn. React, Node.js, SQL, problem çözme, ekip çalışması..."
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Deneyim</Label>
              <Textarea
                id="experience"
                placeholder="Örn. 3 yıl frontend deneyimi, stajlar, önemli projeler..."
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Eğitim bilgileri</Label>
              <Textarea
                id="education"
                placeholder="Örn. Üniversite, bölüm, sertifikalar..."
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                rows={3}
              />
            </div>

            <div className="pt-2">
              <Button onClick={handleSave} className="w-full">
                Tüm ayarları kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}