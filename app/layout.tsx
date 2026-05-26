import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";
import { getCurrentAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "AI Try-On MVP",
  description: "Web/H5 AI 服装试衣 MVP 平台"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  return (
    <html lang="zh-CN">
      <body>
        <header className="sticky top-0 z-30 border-b border-black/10 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="text-base font-semibold tracking-wide">
              Atelier AI
            </Link>
            <AuthNav isLoggedIn={Boolean(admin)} />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
