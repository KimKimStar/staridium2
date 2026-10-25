'use client';

import React, { useState, useEffect } from 'react';
import { Video, Sparkles, Play, CheckCircle, ExternalLink, Loader2, Receipt, AlertCircle, RefreshCw } from 'lucide-react';
import { Submission } from '@/types';
import VideoPlayerModal from './VideoPlayerModal';

export default function AdminGallery() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [renderingId, setRenderingId] = useState<string | null>(null);
  const [renderingStage, setRenderingStage] = useState<string>('');

  // 비디오 모달 상태
  const [modalVideo, setModalVideo] = useState<{
    isOpen: boolean;
    url: string;
    placeName: string;
    hookLine?: string;
    bodyLine?: string;
  }>({
    isOpen: false,
    url: '',
    placeName: '',
  });

  // 영수증 모달 상태
  const [receiptModalUrl, setReceiptModalUrl] = useState<string | null>(null);

  // 데이터 로드
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/submissions?status=APPROVED');
      const data = await res.json();
      if (data.submissions) {
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error('제출 목록 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // [둥글이 숏폼 렌더링하기] 버튼 클릭 핸들러
  const handleRenderShort = async (item: Submission) => {
    setRenderingId(item.id);
    setRenderingStage('Gemini AI가 후기에서 3초 후킹 카피를 추출 중...');

    try {
      setTimeout(() => {
        setRenderingStage('FFmpeg 줌인 동적배경 + 둥글이 크로마키 합성 중...');
      }, 1800);

      const res = await fetch('/api/render-short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: item.id,
          placeName: item.place_name,
          reviewText: item.review_text,
          placeImageUrl: item.place_image_url,
          userId: item.user_id || 'admin-demo',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'PRO_REQUIRED') {
          alert('Pro 구독(월 9,900원) 회원만 숏폼 무제한 렌더링이 가능합니다. 구독 페이지로 이동합니다!');
          window.location.href = '/pricing';
          return;
        }
        throw new Error(data.error || '렌더링 실패');
      }

      // 상태 업데이트: 성공적으로 비디오 생성됨
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === item.id
            ? {
                ...sub,
                render: {
                  id: `render-${Date.now()}`,
                  submission_id: item.id,
                  hook_script: `${data.hookData.hookLine} | ${data.hookData.bodyLine}`,
                  video_url: data.videoUrl,
                  status: 'COMPLETED',
                  duration_seconds: 5,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              }
            : sub
        )
      );

      // 즉시 팝업 오픈
      setModalVideo({
        isOpen: true,
        url: data.videoUrl,
        placeName: item.place_name,
        hookLine: data.hookData.hookLine,
        bodyLine: data.hookData.bodyLine,
      });
    } catch (err: any) {
      alert(`숏폼 렌더링 오류: ${err.message}`);
    } finally {
      setRenderingId(null);
      setRenderingStage('');
    }
  };

  return (
    <div className="space-y-6">
      {/* 관리자 툴바 헤더 */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 rounded-xl text-amber-800 text-lg">🎬</span>
            <h2 className="text-lg font-black text-stone-900">
              인증 승인된 장소 갤러리
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Gemini 2중 인증(영수증+원본사진)을 통과한 유저 소스를 둥글이 AI 숏폼으로 즉시 렌더링하세요.
          </p>
        </div>

        <button
          onClick={fetchSubmissions}
          disabled={loading}
          className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-2xl flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 갤러리 그리드 */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-stone-500 font-medium">인증 승인 소스를 불러오는 중입니다...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="py-16 bg-white rounded-3xl border border-stone-200 text-center space-y-3">
          <p className="text-stone-400 text-3xl">☕</p>
          <p className="text-sm font-bold text-stone-700">현재 인증 승인된 장소 데이터가 없습니다.</p>
          <p className="text-xs text-stone-500">먼저 유저 업로드 페이지에서 장소 사진과 영수증을 인증해 보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((item) => {
            const isCurrentlyRendering = renderingId === item.id;
            const hasRendered = Boolean(item.render?.video_url);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                {/* 상단 장소 사진 (Ken Burns 줌인 대상 소스) */}
                <div className="relative aspect-video w-full bg-stone-100 overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.place_image_url}
                    alt={item.place_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Gemini 2중 인증 완료
                  </div>

                  {/* 영수증 보기 미니 버튼 */}
                  <button
                    onClick={() => setReceiptModalUrl(item.receipt_image_url)}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white text-stone-800 p-1.5 rounded-full shadow-sm text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    title="영수증 원본 보기"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-600" />
                  </button>
                </div>

                {/* 카드 본문 */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-base leading-snug">
                      {item.place_name}
                    </h3>
                    {item.one_line_review && (
                      <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl text-xs font-bold text-amber-950 mt-2">
                        <span className="text-[10px] text-amber-700 block font-semibold mb-0.5">🎤 둥글이 1줄 반응 대본 (공식 목소리):</span>
                        &quot;{item.one_line_review}&quot;
                      </div>
                    )}
                    <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed bg-stone-50 p-2.5 rounded-2xl border border-stone-100">
                      <strong className="text-stone-700 block text-[11px] mb-0.5">📝 생생 솔직 후기:</strong>
                      &quot;{item.review_text}&quot;
                    </p>

                    {/* Gemini 분석 메타 태그 */}
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        📸 스마트폰 직접촬영 판독
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                        💰 리워드 1,000P 지급됨
                      </span>
                    </div>
                  </div>

                  {/* 하단 액션 버튼 */}
                  <div className="pt-2 border-t border-stone-100">
                    {hasRendered ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setModalVideo({
                              isOpen: true,
                              url: item.render!.video_url!,
                              placeName: item.place_name,
                              hookLine: item.render?.hook_script?.split('|')[0]?.trim(),
                              bodyLine: item.render?.hook_script?.split('|')[1]?.trim(),
                            })
                          }
                          className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          완성된 둥글이 숏폼 보기
                        </button>
                        <button
                          onClick={() => handleRenderShort(item)}
                          disabled={isCurrentlyRendering}
                          className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs transition-colors"
                          title="새 대본으로 다시 렌더링"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRenderShort(item)}
                        disabled={isCurrentlyRendering}
                        className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-900 font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all disabled:opacity-50"
                      >
                        {isCurrentlyRendering ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="truncate">{renderingStage || '렌더링 중...'}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-800" />
                            [둥글이 숏폼 렌더링하기]
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 숏폼 비디오 재생 모달 */}
      <VideoPlayerModal
        isOpen={modalVideo.isOpen}
        onClose={() => setModalVideo((prev) => ({ ...prev, isOpen: false }))}
        videoUrl={modalVideo.url}
        placeName={modalVideo.placeName}
        hookLine={modalVideo.hookLine}
        bodyLine={modalVideo.bodyLine}
      />

      {/* 영수증 원본 모달 */}
      {receiptModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-stone-900">결제 영수증 원본</h3>
              <button
                onClick={() => setReceiptModalUrl(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                닫기
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={receiptModalUrl} alt="영수증 원본" className="w-full max-h-96 object-contain rounded-2xl bg-stone-50 border border-stone-200" />
            <p className="text-[11px] text-stone-500 text-center">Gemini AI가 상호명과 날짜를 성공적으로 판독한 영수증입니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
