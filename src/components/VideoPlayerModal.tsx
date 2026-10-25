'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Download, Share2, Sparkles, Volume2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  placeName: string;
  hookLine?: string;
  bodyLine?: string;
}

export default function VideoPlayerModal({
  isOpen,
  onClose,
  videoUrl,
  placeName,
  hookLine,
  bodyLine,
}: Props) {
  const [isTalking, setIsTalking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 모달이 열릴 때 둥글이 프로필 공식 목소리 단독 재생 및 립싱크
  useEffect(() => {
    if (!isOpen) return;

    if (!audioRef.current) {
      audioRef.current = new Audio('/assets/doongle_voice.mp3');
      audioRef.current.onplay = () => setIsTalking(true);
      audioRef.current.onended = () => setIsTalking(false);
      audioRef.current.onpause = () => setIsTalking(false);
    }

    audioRef.current.currentTime = 0;
    audioRef.current.volume = 1.0;
    audioRef.current.play().catch(() => {});

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsTalking(false);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const playProfileVoiceAgain = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* 상단 닫기 헤더 */}
        <div className="p-4 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-300 bg-amber-100 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/doongle_face.png" alt="둥글이" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">{placeName}</h3>
              <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> 둥글이 공식 목소리 탑재
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={playProfileVoiceAgain}
              className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-stone-900 text-[11px] font-black rounded-xl transition-colors shadow-2xs border border-amber-300"
              title="둥글이 목소리 다시듣기"
            >
              👶 목소리
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 flex items-center justify-center text-stone-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 9:16 비디오 플레이어 영역 */}
        <div className="relative bg-stone-900 aspect-[9/16] w-full max-h-[500px] flex items-center justify-center overflow-hidden">
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* 오버레이 둥글이 캐릭터 */}
          <div className="absolute bottom-6 inset-x-0 flex flex-col items-center pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/doongle_front.png"
              alt="둥글이 캐릭터"
              className="w-24 h-auto drop-shadow-lg object-contain"
            />
          </div>

          {/* 상단 자막 프리뷰 오버레이 (영상 내 렌더링 확인용) */}
          {hookLine && (
            <div className="absolute top-6 inset-x-4 pointer-events-none flex justify-center">
              <span className="px-3.5 py-1.5 rounded-xl bg-amber-300/90 text-stone-950 font-black text-xs shadow-md border border-amber-400">
                {hookLine}
              </span>
            </div>
          )}
        </div>

        {/* 하단 정보 및 다운로드 액션 */}
        <div className="p-4 bg-stone-50 space-y-3">
          {bodyLine && (
            <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-700">
              <span className="font-bold text-amber-700 block mb-0.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 3초 후킹 자막 포인트:
              </span>
              {bodyLine}
            </div>
          )}

          <div className="flex gap-2">
            <a
              href={videoUrl}
              download={`${placeName}_둥글이숏폼.mp4`}
              className="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-900 font-bold rounded-2xl flex items-center justify-center gap-2 text-xs transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              숏폼 MP4 다운로드
            </a>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${placeName} 둥글이 숏폼`,
                    url: videoUrl,
                  });
                } else {
                  navigator.clipboard.writeText(videoUrl);
                  alert('영상 링크가 클립보드에 복사되었습니다!');
                }
              }}
              className="p-3 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-2xl transition-colors"
              title="공유하기"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
