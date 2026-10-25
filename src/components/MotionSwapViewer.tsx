'use client';

import React, { useRef, useState } from 'react';
import { Download, Share2, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, CheckCircle2 } from 'lucide-react';
import { MotionSwapResult } from '@/types';

interface Props {
  result: MotionSwapResult;
  onReset?: () => void;
}

export default function MotionSwapViewer({ result, onReset }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '둥글이 AI 모션 스왑 숏폼',
        text: result.hookText,
        url: result.finalVideoUrl,
      });
    } else {
      navigator.clipboard.writeText(result.finalVideoUrl);
      alert('영상 링크가 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
      {/* 상단 타이틀 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 rounded-xl text-emerald-800 text-base">✨</span>
            <h3 className="text-lg font-black text-stone-900">
              AI 모션 스왑 숏폼 렌더링 완료!
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            원본 숏폼의 모션 뼈대에 맞춰 캐릭터 이미지가 자연스럽게 춤추고 움직이는 9:16 비디오입니다.
          </p>
        </div>

        {onReset && (
          <button
            onClick={onReset}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            새 모션 영상 만들기
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* 좌측: 9:16 모바일 숏폼 뷰어 플레이어 */}
        <div className="flex justify-center">
          <div className="relative bg-stone-950 aspect-[9/16] w-full max-w-[280px] sm:max-w-[320px] rounded-3xl overflow-hidden shadow-2xl border-4 border-stone-800 group">
            <video
              ref={videoRef}
              src={result.finalVideoUrl}
              autoPlay
              loop
              playsInline
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-cover"
            />

            {/* 상단 3초 훅 텍스트 배너 프리뷰 (자막 가독성 배너) */}
            <div className="absolute top-6 inset-x-4 flex justify-center pointer-events-none">
              <span className="px-3.5 py-1.5 rounded-xl bg-amber-300 text-stone-950 font-black text-xs shadow-lg border border-amber-400 text-center animate-pulse">
                {result.hookText}
              </span>
            </div>

            {/* 플레이어 컨트롤 오버레이 */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-stone-900 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-md"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* 9:16 배지 */}
            <div className="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-sm text-stone-200 text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
              9:16 Full HD Shorts
            </div>
          </div>
        </div>

        {/* 우측: 렌더링 상세 정보 및 액션 버튼 */}
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>적용된 3초 훅 카피라이팅</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-amber-200 text-stone-900 font-extrabold text-sm shadow-xs">
              &quot;{result.hookText}&quot;
            </div>
            <p className="text-[11px] text-stone-500">
              FFmpeg를 통해 영상 상단 240px 위치에 눈에 띄는 옐로우 박스와 함께 합성되었습니다.
            </p>
          </div>

          <div className="space-y-2 text-xs text-stone-600">
            <div className="flex justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-400">적용 엔진</span>
              <span className="font-bold text-stone-800">Replicate AnimateAnyone + FFmpeg</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-400">영상 규격</span>
              <span className="font-bold text-stone-800">1080 × 1920 (9:16 세로형)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-400">렌더링 재생 시간</span>
              <span className="font-bold text-stone-800">약 {result.durationSeconds}초</span>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="space-y-2 pt-2">
            <a
              href={result.finalVideoUrl}
              download="둥글이_모션스왑_숏폼.mp4"
              target="_blank"
              rel="noreferrer"
              className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              숏폼 MP4 원클릭 다운로드
            </a>
            <button
              onClick={handleShare}
              className="w-full py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              인스타 릴스 / 유튜브 쇼츠 링크 공유하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
