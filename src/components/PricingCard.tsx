'use client';

import React, { useState } from 'react';
import { Check, Sparkles, Crown, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

export default function PricingCard() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_boss_01',
          userEmail: 'store_owner@example.com',
        }),
      });

      const data = await res.json();
      if (data.url) {
        // Stripe 공식 호스팅 결제창으로 이동
        window.location.href = data.url;
      } else {
        alert(data.error || '결제 세션 연결에 실패했습니다.');
      }
    } catch (err: any) {
      alert(`결제 처리 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const proFeatures = [
    '둥글이 AI 가상체험 숏폼 무제한 렌더링 (9:16 Full HD)',
    'Gemini 1.5 기반 맞춤형 3초 후킹 대본 & 자막 자동 생성',
    '인스타그램 릴스 & 유튜브 쇼츠용 MP4 즉시 다운로드',
    '유저 인증 장소 사진 무제한 소스 라이브러리 접근',
    '사장님 공식 SNS 마케팅 2차 가공 상업적 라이선스 제공',
    '신규 둥글이 제스처 & 시즌별 크로마키 테마 무료 업데이트',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* 타이틀 헤더 */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
          <Crown className="w-3.5 h-3.5 text-amber-600" />
          오프라인 매장 사장님 전용 플랜
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
          월 9,900원으로 운영하는 우리 가게 전용 1인 AI 방송국
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
          손님들이 직접 찍은 생생한 인증 사진과 영수증에 둥글이 캐릭터를 합성해, 릴스와 쇼츠에서 터지는 바이럴 영상을 1초 만에 만들어보세요!
        </p>
      </div>

      {/* 요금제 카드 비교 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* 무료 체험 플랜 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Free Starter</span>
              <h3 className="text-xl font-black text-stone-800 mt-1">일반 탐험가 (체험)</h3>
              <p className="text-xs text-stone-500 mt-1">방문 인증 리워드 수령 및 숏폼 1회 맛보기</p>
            </div>

            <div className="text-stone-900 flex items-baseline gap-1 py-2">
              <span className="text-3xl font-black">0</span>
              <span className="text-sm font-bold text-stone-500">원 / 평생 무료</span>
            </div>

            <ul className="space-y-2.5 text-xs text-stone-600 pt-2 border-t border-stone-100">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                장소 방문 사진 & 영수증 2중 인증 및 리워드 수령
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                인증 통과 시 건당 1,000P 즉시 적립
              </li>
              <li className="flex items-center gap-2 text-stone-400">
                <span className="w-4 h-4 text-stone-300 flex-shrink-0 text-center font-bold">✕</span>
                숏폼 렌더링 1회 시연 한정 (워터마크 포함)
              </li>
              <li className="flex items-center gap-2 text-stone-400">
                <span className="w-4 h-4 text-stone-300 flex-shrink-0 text-center font-bold">✕</span>
                상업적 SNS 광고 송출 불가
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <a
              href="/upload"
              className="w-full py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center transition-colors"
            >
              장소 인증하고 리워드 받기
            </a>
          </div>
        </div>

        {/* Pro 사장님 구독 플랜 (하이라이트) */}
        <div className="bg-amber-50/70 rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-warm flex flex-col justify-between relative overflow-hidden">
          {/* 추천 배지 */}
          <div className="absolute top-0 right-0 bg-amber-400 text-stone-950 font-black text-[11px] px-4 py-1.5 rounded-bl-2xl shadow-sm">
            BEST 사장님 PICK
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> All-In-One Pro Pass
              </span>
              <h3 className="text-xl font-black text-stone-900 mt-1">둥글이 방송국 Pro</h3>
              <p className="text-xs text-stone-600 mt-1">매출을 극대화하는 바이럴 숏폼 무제한 제작</p>
            </div>

            <div className="text-stone-900 flex items-baseline gap-1 py-2">
              <span className="text-4xl font-black text-stone-950">9,900</span>
              <span className="text-sm font-bold text-stone-600">원 / 월 (정기구독)</span>
            </div>

            <ul className="space-y-2.5 text-xs text-stone-700 pt-2 border-t border-amber-200/80">
              {proFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 text-[10px]">
                    ✓
                  </div>
                  <span className="font-medium text-stone-800">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-6">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Stripe 결제창 준비 중...
                </>
              ) : (
                <>
                  월 9,900원으로 Pro 무제한 렌더링 시작
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[11px] text-stone-500 text-center mt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Stripe 256비트 암호화 결제 · 언제든지 1초 만에 해지 가능
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
