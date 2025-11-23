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

export default function InterviewSettingsPage() {
    const [defaultPreset, setDefaultPreset] = useState<string>("");
    const [interests, setInterests] = useState("");
    const [skills, setSkills] = useState("");
    const [experience, setExperience] = useState("");
    const [education, setEducation] = useState("");
    const [targetRole, setTargetRole] = useState("");
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
            } catch (e) {
                console.error("Profil verisi okunamadı", e);
            }
        }
        setHasLoadedProfile(true);
    }, []);

    useEffect(() => {
        if (!hasLoadedProfile) return;
        if (typeof window === "undefined") return;

        window.localStorage.setItem("defaultInterviewPreset", defaultPreset);

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
    ]);

    const handleSave = () => {
        if (typeof window === "undefined") return;
        if (!defaultPreset) {
            toast.error("Lütfen varsayılan bir mülakat tipi seçin.");
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

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Mülakat Ayarları</CardTitle>
                        <CardDescription>
                            Varsayılan mülakat tipini seçin. Bu ayar, gelecekte mülakat akışında
                            kullanılmak üzere saklanır.
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Kullanıcı Profili</CardTitle>
                        <CardDescription>
                            İlgi alanları, beceriler ve geçmiş deneyim gibi bilgiler soru üretiminde
                            kullanılacaktır.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
