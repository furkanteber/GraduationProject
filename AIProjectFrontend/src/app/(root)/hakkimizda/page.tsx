export default function Hakkimizda() {
  return (
    <section
      className="flex flex-col lg:flex-row justify-center items-center 
                 text-center lg:text-left pt-35 px-6 lg:px-12 gap-10 max-w-6xl mx-auto"
    >
      <img
        src="/images/about_img.png"
        alt="Hakkımızda görseli"
        className="w-72 sm:w-96 lg:w-1/2 h-auto rounded-xl shadow-lg object-cover"
      />
      <div className="max-w-xl space-y-4">
        <h1 className="text-4xl font-bold">Hakkımızda</h1>
        <p className="text-lg text-gray-700 leading-relaxed">
          InterSim TeberSoft tarafından geliştirilen Yapay Zeka destekli bir mülakata hazırlanma
          simülasyonudur. Soru içerisindeki analizlerle birlikte sizlere gerçekçi bir mülakat deneyimi sunmayı amaçlamaktadır.
          Simülasyon sonundaki geribildirimlerle eksiklerinizi görmenizi sağlar.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed">
          TeberSoft Furkan ve Özkan Teber tarafından kurulmuştur. Genellikle mobil uygulama ve web geliştirme alanlarında 
          hizmetler sunmaktadır.
        </p>
      </div>
    </section>
  );
}
