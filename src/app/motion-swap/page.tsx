'use client';

import React, { useState } from 'react';
import MotionSwapForm from '@/components/MotionSwapForm';
import MotionSwapViewer from '@/components/MotionSwapViewer';
import { MotionSwapResult } from '@/types';
import { Sparkles, Film, Wand2 } from 'lucide-react';

export default function MotionSwapPage() {
  const [result, setResult] = useState<MotionSwapResult | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 타이틀 헤더 */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-xs">
          <Wand2 className="w-3.5 h-3.5 text-amber-700" />
          <span>Replicate AnimateAnyone + FFmpeg 모션 전이 엔진</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
          AI 모션 스왑 & 숏폼 자동화 스튜디오
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
          유저가 올린 사진/캐릭터 이미지를 원본 숏폼 영상의 모션 뼈대와 타이밍에 맞춰 춤추게 하고, 
          시선을 사로잡는 <strong>3초 훅 자막</strong>을 자동으로 입혀 완성도 높은 9:16 쇼츠를 제작합니다.
        </p>
      </div>

      {/* 결과물 뷰어 또는 업로드 폼 */}
      {result ? (
        <MotionSwapViewer result={result} onReset={() => setResult(null)} />
      ) : (
        <MotionSwapForm onSuccess={(res) => setResult(res)} />
      )}
    </div>
  );
}
