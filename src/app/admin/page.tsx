import React from 'react';
import AdminGallery from '@/components/AdminGallery';
import { Sparkles, Video, CheckCircle2 } from 'lucide-react';

export default function AdminPage({
  searchParams,
}: {
  searchParams?: { subscription?: string };
}) {
  const isSubscriptionSuccess = searchParams?.subscription === 'success';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 구독 완료 알림 배너 */}
      {isSubscriptionSuccess && (
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold">월 9,900원 Pro 구독이 성공적으로 시작되었습니다!</span>
            <p className="text-stone-600">이제 둥글이 AI 숏폼을 무제한으로 자유롭게 렌더링하실 수 있습니다.</p>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-2">
            관리자 AI 숏폼 스튜디오
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
              FFmpeg 9:16 합성 엔진
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            인증 완료된 유저 장소 사진에 Ken Burns 줌인 + 둥글이 크로마키 + Gemini 3초 후킹 자막을 입혀 숏폼으로 제작합니다.
          </p>
        </div>
      </div>

      <AdminGallery />
    </div>
  );
}
