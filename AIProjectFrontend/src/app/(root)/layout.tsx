import Navbar from "@/components/ui-navbar";
import "../globals.css";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body
        className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 
                   text-gray-900 font-sans">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
