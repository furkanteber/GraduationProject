import Link from "next/link";

export default function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 w-full z-50
                 bg-white/20 backdrop-blur-md
                 flex justify-between items-center py-4 px-10
                border-b border-white/30"
    >
      <Link href="/" className="flex items-center gap-2">
        <img
          className="h-12 w-12"
          src="/images/tebersoftlogo.png"
          alt="Logo"
        />
      </Link>

      <div className="flex items-center gap-8 text-gray-800 font-medium">
        <ul className="hidden md:flex items-center gap-8">
          <li><Link href="/">Ana Sayfa</Link></li>
          <li><Link href="/hakkimizda">Hakkımızda</Link></li>
          <li><Link href="/iletisim">İletişim</Link></li>
          <li><Link href="/giris-yap">Giriş Yap</Link></li>
        </ul>

        <Link
          href="/hemen-basla"
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
        >
          Hemen Başla
        </Link>
      </div>
    </nav>
  );
}
