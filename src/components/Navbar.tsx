'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Coins, Video, UploadCloud, Crown, Wand2, X, Play, RotateCcw } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [points, setPoints] = useState<number>(3000);
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // 포인트 불러오기
    fetch('/api/user/points?userId=demo-user-123')
      .then((res) => res.json())
      .then((data) => {
        if (data.points !== undefined) setPoints(data.points);
      })
      .catch(() => {});
  }, [pathname]);

  const openMiniPlayer = () => {
    setIsMiniPlayerOpen(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const closeMiniPlayer = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsMiniPlayerOpen(false);
  };

  const replayVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const navItems = [
    { label: '장소 올리고 리워드 받기', href: '/upload', icon: UploadCloud },
    { label: '관리자 AI 숏폼 스튜디오', href: '/admin', icon: Video },
    { label: '✨ AI 모션 스왑', href: '/motion-swap', icon: Wand2 },
    { label: '사장님 Pro 구독', href: '/pricing', icon: Crown },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EFE8DC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* 로고 (둥글이 마크 확대 + 클릭 시 미니 영상 재생) */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={openMiniPlayer}
              className="relative group focus:outline-none"
              title="둥글이 마크를 누르면 귀여운 소개 영상이 재생됩니다!"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-100 border-2 border-amber-400 flex items-center justify-center shadow-md group-hover:scale-108 active:scale-95 group-hover:shadow-amber-300/80 group-hover:shadow-lg transition-all duration-200 overflow-hidden p-1 cursor-pointer ring-4 ring-amber-200/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/doongle_face.png" alt="둥글이 얼굴" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white group-hover:scale-115 transition-transform animate-bounce">
                ▶
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:flex items-center gap-1 px-2.5 py-1 bg-stone-900/95 text-amber-200 text-[10px] font-extrabold rounded-xl shadow-xl whitespace-nowrap pointer-events-none z-50">
                <span>🎬</span> 둥글이 영상 보기 (클릭!)
              </div>
            </button>

            <Link href="/" className="flex flex-col group">
              <span className="text-base sm:text-lg font-black tracking-tight text-stone-800 flex items-center gap-1.5 group-hover:text-amber-800 transition-colors">
                둥글이 스튜디오
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-900 rounded-full border border-amber-300/60 shadow-2xs">
                  1인 AI 방송국
                </span>
              </span>
              <span className="text-[11px] text-stone-500 font-medium">
                방문 인증 리워드 & AI 가상체험 숏폼 SaaS
              </span>
            </Link>
          </div>

          {/* 데스크톱 메뉴 */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-amber-100 text-amber-900 shadow-sm border border-amber-200'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-stone-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 유저 리워드 포인트 배지 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 border border-amber-200 rounded-full shadow-sm">
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs font-semibold text-stone-700">
                <span className="text-amber-600 font-bold">{points.toLocaleString()}</span> P
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 미니 동영상 플레이어 팝업 모달 */}
      {isMiniPlayerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all"
          onClick={closeMiniPlayer}
        >
          <div
            className="relative bg-white rounded-3xl max-w-[340px] w-full overflow-hidden shadow-2xl border-2 border-amber-300 ring-4 ring-amber-100 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="p-3.5 bg-gradient-to-r from-amber-100 via-amber-50 to-stone-50 border-b border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-300 border border-amber-400 overflow-hidden flex-shrink-0 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/doongle_face.png" alt="둥글이" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-stone-900 flex items-center gap-1">
                    <span>👶 둥글이 공식 영상</span>
                    <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">Kling AI</span>
                  </h4>
                  <p className="text-[10px] text-amber-800 font-bold">귀여운 목소리로 인사하는 둥글이 ✨</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeMiniPlayer}
                className="w-7 h-7 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center text-xs font-bold transition-colors"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 비디오 뷰포트 (작은 화면) */}
            <div className="relative bg-stone-950 aspect-[9/16] max-h-[460px] w-full overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                src="/assets/doongle_video.mp4"
                playsInline
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>

            {/* 푸터 컨트롤 */}
            <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={replayVideo}
                className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 처음부터 다시보기
              </button>
              <button
                type="button"
                onClick={closeMiniPlayer}
                className="px-3.5 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-[11px] transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
