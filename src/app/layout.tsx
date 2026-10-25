import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: '둥글이 스튜디오 - 1인 AI 숏폼 방송국 & 방문 리워드 SaaS',
  description: '유저의 장소 사진과 영수증을 2중 검증해 리워드를 지급하고, 아기 캐릭터 둥글이가 등장하는 바이럴 숏폼 영상을 자동 렌더링하는 1인 AI 방송국 SaaS',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-[#FAF8F5]">
        <Navbar />
        <main className="flex-1 py-8 px-4 sm:px-6">{children}</main>
        <footer className="py-8 border-t border-[#EFE8DC] bg-[#FFFDF9]/60 text-center text-xs text-stone-500">
          <p className="font-semibold text-stone-700">둥글이 스튜디오 (Doongle AI Studio) · 1인 AI 방송국 SaaS</p>
          <p className="mt-1">Next.js App Router · Gemini Vision 2중 검증 · FFmpeg Ken Burns & 크로마키 · Stripe</p>
        </footer>
      </body>
    </html>
  );
}
