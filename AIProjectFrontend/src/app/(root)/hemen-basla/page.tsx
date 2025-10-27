"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Kaushan_Script } from "next/font/google";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";

const kaushan = Kaushan_Script({
  subsets: ["latin"],
  weight: "400",
});

export default function HemenBasla() {
  const totalSteps = 5;
  const formTitle = [
    "Seni Tanıyalım",
    "Hangi Pozisyon veya Sektör?",
    "Eğitim & Deneyim",
    "Yetkinlikler & İlgi Alanları",
    "Eklemek istediğiniz",
  ];

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    job: "",
    targetArea: "",
    targetPozision: "",
    companyType: "",
    educationLevel: "",
    section: "",
    experienceTime: "",
    department: "",
    skills: [] as string[],
    summary: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists
          ? prev.skills.filter((s) => s !== skill)
          : [...prev.skills, skill],
      };
    });
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("✅ Form başarıyla kaydedildi!");
        setFormData({
          name: "",
          email: "",
          job: "",
          targetArea: "",
          targetPozision: "",
          companyType: "",
          educationLevel: "",
          section: "",
          experienceTime: "",
          department: "",
          skills: [],
          summary: "",
        });
        setStep(1);
        redirect("/admin/interview");
      } else {
        alert("❌ Veri kaydedilirken hata oluştu!");
      }
    } catch (error) {
      console.error(error);
      alert("Sunucu hatası!");
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-3xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  name="name"
                  required
                  placeholder="Adınız Soyadınız"
                  value={formData.name}
                  onChange={handleChange}
                  className="border border-gray-400/40 bg-transparent rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-black/60"
                />
                <Input
                  type="email"
                  name="email"
                  required
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="border border-gray-400/40 bg-transparent rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-black/60"
                />
              </div>
              <Input
                type="text"
                name="job"
                required
                placeholder="Mesleğiniz"
                value={formData.job}
                onChange={handleChange}
                className="border border-gray-400/40 bg-transparent rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-black/60"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-3xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  name="targetArea"
                  placeholder="Yazılım Geliştirme"
                  value={formData.targetArea}
                  onChange={handleChange}
                  className="border border-gray-400/40 bg-transparent rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-black/60"
                />
                <Input
                  type="text"
                  name="targetPozision"
                  placeholder="Hedef Pozisyon"
                  value={formData.targetPozision}
                  onChange={handleChange}
                  className="border border-gray-400/40 bg-transparent rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-black/60"
                />
              </div>
              <Input
                type="text"
                name="companyType"
                placeholder="Şirket Türü"
                value={formData.companyType}
                onChange={handleChange}
                className="border border-gray-400/40 bg-transparent rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-black/60"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-3xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  name="educationLevel"
                  placeholder="Eğitim Seviyesi"
                  value={formData.educationLevel}
                  onChange={handleChange}
                  className="border border-gray-400/40 bg-transparent rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-black/60"
                />
                <Input
                  type="text"
                  name="section"
                  placeholder="Bölüm"
                  value={formData.section}
                  onChange={handleChange}
                  className="border border-gray-400/40 bg-transparent rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-black/60"
                />
              </div>
              <Input
                type="text"
                name="experienceTime"
                placeholder="Deneyim Süresi"
                value={formData.experienceTime}
                onChange={handleChange}
                className="border border-gray-400/40 bg-transparent rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-black/60"
              />
              <Input
                type="text"
                name="department"
                placeholder="Pozisyon"
                value={formData.department}
                onChange={handleChange}
                className="border border-gray-400/40 bg-transparent rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-black/60"
              />
            </div>
          </div>
        );

      case 4:
        const skillOptions = [
          "Python",
          "Flutter",
          "SAP & ABAP",
          "R",
          "Matlab",
          "C#",
          "React",
          "Git",
          "Angular",
          "PostgreSql",
          "Firebase",
          "Java",
          "Asp.Net",
          "Kotlin",
          "JavaScript",
          "C++",
          "Node.js",
          "Problem Çözme",
          "Takım Çalışması",
          "İletişim",
          "Veri Analizi",
        ];
        return (
          <div className="grid grid-cols-6 gap-6">
            {skillOptions.map((skill) => (
              <label
                key={skill}
                className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all ${
                  formData.skills.includes(skill)
                    ? "bg-green-500/10 border-green-500"
                    : "border-gray-400/40 hover:border-black/60"
                }`}
              >
                <Input
                  type="checkbox"
                  checked={formData.skills.includes(skill)}
                  onChange={() => handleSkillToggle(skill)}
                  className="w-4 h-4 accent-green-600"
                />
                <span className="text-gray-800">{skill}</span>
              </label>
            ))}
          </div>
        );

      case 5:
        return (
          <div className="flex items-center w-full">
            <textarea
              name="summary"
              placeholder="Eklemek istedikleriniz"
              value={formData.summary}
              onChange={handleChange}
              className="border border-gray-400/40 bg-transparent rounded-lg px-4 py-2 w-full h-28 focus:outline-none focus:ring-2 focus:ring-black/60 resize-none"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#faf9f6] to-[#e6e4db] px-4">
      <div className="relative flex justify-between items-center w-full max-w-2xl mb-10">
        <div className="absolute top-1/2 left-0 w-full h-[3px] bg-gray-300 -translate-y-1/2"></div>
        {[...Array(totalSteps)].map((_, i) => {
          const index = i + 1;
          const isActive = index === step;
          const isCompleted = index < step;
          return (
            <div
              key={index}
              className={`relative z-10 w-12 h-12 flex items-center justify-center rounded-full text-lg font-semibold border-2 transition-all duration-300 ${
                isCompleted
                  ? "bg-green-500 text-white border-green-500"
                  : isActive
                  ? "bg-white text-black border-black"
                  : "bg-black text-white border-black"
              }`}
            >
              {isCompleted ? <Check className="w-6 h-6" /> : index}
            </div>
          );
        })}
      </div>

      <h1 className={`${kaushan.className} text-3xl md:text-4xl text-black mb-8`}>
        {formTitle[step - 1]}
      </h1>

      <div className="flex flex-col gap-3 w-full max-w-4xl">{renderStepContent()}</div>

      <div className="flex justify-between w-full max-w-md mt-8">
        <button
          onClick={prevStep}
          disabled={step === 1}
          className={`px-6 py-2 rounded-lg transition-all ${
            step === 1
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gray-800 text-white hover:bg-black"
          }`}
        >
          Geri
        </button>

        <button
          onClick={step === totalSteps ? handleSubmit : nextStep}
          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-all"
        >
          {step === totalSteps ? "Tamamla" : "İleri"}
        </button>
      </div>
    </div>
  );
}
