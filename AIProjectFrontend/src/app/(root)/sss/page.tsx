import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function AccordionDemo() {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>InterSim Nasıl Çalışır</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            InterSim'de bir mülakat başlattığınızda kameradan yüzünüz soru için cevabınız gerekli durumlarda kod için metin alanı 
            veriler toplanıp modelimizde işlenir belirli kriter ve değerlendirmelere göre bir skor üretilir bu skor 3 farklı metrikten ve
            sorunun zorluğu sorunun biçimi gibi kurallara göre değişir.Ardından toplam skorunuza göre bir geribildirim sağlanır.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Gerçek bir mülakat gibi mi oluyor?</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            Evet! Yapay zekâ size hem teknik hem de davranışsal (HR) sorular sorar. Cevaplarınıza göre ek sorular yönelterek gerçek bir insan kaynakları görüşmesini taklit eder.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Sistemi kullanmak için kamera veya mikrofon gerekli mi?</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
            Hayır, isterseniz sadece metin tabanlı da mülakat yapabilirsiniz. Ancak kamera ve mikrofon kullanımı daha gerçekçi sonuçlar verir.
          </p>        
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger>Bu uygulama gerçek mülakatlarda işe yarar mı?</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
          Test süreci çalışmaları devam etmektedir.
          </p>        
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-5">
        <AccordionTrigger>Ücretli mi, ücretsiz mi?</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p>
           Temel simülasyon ücretsizdir. Daha gelişmiş analiz ve özel sektör mülakatları için gerekli çalışmalardan sonra netleşecektir.
          </p>        
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
