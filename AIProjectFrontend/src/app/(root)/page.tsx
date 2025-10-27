import { Button } from "@/components/ui/button";
import { Kaushan_Script } from "next/font/google";
import Link from "next/link";

const kaushan = Kaushan_Script({
  subsets: ["latin"],
  weight: "400",
});

export default function HomePage() {
  return (
    <section
      className="flex flex-col justify-center items-center text-center 
                pt-40 px-4"
    >
      <div className="bg-white/70 backdrop-blur-sm text-gray-700 px-6 py-2 rounded-md mb-6 shadow-sm">
        İşe alım sürecine hazır mısın? Yapay zekâ ile birebir mülakat deneyimi yaşa
      </div>

      <h1 className="text-3xl md:text-5xl font-bold text-gray-900 drop-shadow-sm">
        İşe Hazırlıkta Yeni Nesil Deneyim
      </h1>

      <h1
        className={`text-4xl md:text-6xl mt-4 mb-6 text-gray-900 ${kaushan.className}`}
      >
        Kendini Test Et!
      </h1>

      <p className="max-w-xl text-gray-700 mb-10 text-lg leading-relaxed">
        Mülakat öncesi kendini test et! Yapay zekâ destekli mülakat simülatörü,
        sana gerçekçi sorular sorar, cevaplarını analiz eder ve anında geri
        bildirim sunar.
      </p>

      <Link
          href="/hemen-basla"
          className="bg-black text-white px-6 py-3 rounded-lg text-lg font-semibold 
             hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
        >
          Hemen Başla →
        </Link>
    </section>
  );
}
