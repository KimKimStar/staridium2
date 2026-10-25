import React from 'react';
import Link from 'next/link';
import { Sparkles, Camera, Video, Crown, ArrowRight, ShieldCheck, Coins, PlayCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16">
      {/* 히어로 섹션 */}
      <div className="text-center space-y-5 pt-4 sm:pt-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-sm">
          <span className="text-sm">✨</span>
          <span>1인 창작자를 위한 올인원 AI 숏폼 방송국 솔루션</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          손님의 실제 방문 사진에 <br className="hidden sm:inline" />
          <span className="text-amber-600 bg-amber-100/60 px-3 py-0.5 rounded-2xl inline-block mt-1 sm:mt-0">
            아기 캐릭터 '둥글이'
          </span>
          가 찾아가는 AI 숏폼 SaaS
        </h1>

        <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          유저는 영수증 인증으로 <strong>1,000P 리워드</strong>를 받고, <br className="hidden sm:inline" />
          관리자는 이 소스로 <strong>Ken Burns 줌인 + 크로마키 합성 숏폼</strong>을 자동 렌더링합니다.
        </p>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Link
            href="/upload"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 font-black text-stone-900 text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Camera className="w-4 h-4 text-amber-900" />
            장소 소스 올리고 리워드 받기
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/motion-swap"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-stone-900 hover:bg-stone-800 font-bold text-white text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            ✨ AI 모션 스왑 스튜디오
          </Link>
          <Link
            href="/admin"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 font-bold text-stone-800 text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Video className="w-4 h-4 text-amber-600" />
            관리자 숏폼 갤러리
          </Link>
        </div>
      </div>

      {/* 3단계 핵심 파이프라인 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1단계 */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl font-black">
              1
            </div>
            <h3 className="text-base font-extrabold text-stone-900">
              Gemini Vision 2중 검증 & 리워드
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              영수증의 상호/날짜를 읽고 장소 사진이 불펌이나 캡처가 아닌 직접 찍은 원본인지 AI가 엄격하게 판독해 포인트를 즉시 지급합니다.
            </p>
          </div>
          <Link
            href="/upload"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 pt-2 border-t border-stone-100"
          >
            업로드 폼 열기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 2단계 */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black">
              2
            </div>
            <h3 className="text-base font-extrabold text-stone-900">
              FFmpeg Ken Burns + 크로마키 합성
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              정지 사진을 줌인 동적 비디오로 변환하고, 둥글이 그린스크린의 초록색을 투명 제거하여 9:16 인스타 릴스/쇼츠로 최종 렌더링합니다.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 pt-2 border-t border-stone-100"
          >
            스튜디오 갤러리 열기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3단계 */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center text-xl font-black">
              3
            </div>
            <h3 className="text-base font-extrabold text-stone-900">
              월 9,900원 Pro 정기구독 (Stripe)
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              매장 사장님들을 위한 Pro 패스. 무제한 숏폼 렌더링, Gemini 3초 후킹 대사 자동 생성, 상업적 SNS 마케팅 라이선스를 제공합니다.
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-xs font-bold text-orange-700 hover:text-orange-800 flex items-center gap-1 pt-2 border-t border-stone-100"
          >
            구독 플랜 확인 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 둥글이 캐릭터 소개 미니 배너 */}
      <div className="bg-amber-100/60 rounded-3xl p-6 sm:p-8 border border-amber-200/80 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-3xl bg-amber-200 border-2 border-amber-300 flex items-center justify-center text-5xl shadow-sm flex-shrink-0">
          👶
        </div>
        <div className="space-y-2 text-center sm:text-left flex-1">
          <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
            우리 방송국의 주인공
          </span>
          <h2 className="text-xl font-black text-stone-900">
            핫플을 탐험하는 통통하고 귀여운 아기 '둥글이'
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            "안녕 난 둥글이야! 여기 카페 버터바가 진짜 맛있둥~" <br />
            딱딱한 상업 광고 대신, 둥글이의 귀여운 리액션과 Gemini가 추출한 3초 후킹 멘트로 시청자의 이탈을 방어합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
