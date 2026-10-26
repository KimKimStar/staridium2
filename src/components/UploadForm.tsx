'use client';

import React, { useState } from 'react';
import { Camera, Video as VideoIcon, Receipt, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Loader2, Plus, Film } from 'lucide-react';
import { VerificationResult } from '@/types';

export default function UploadForm() {
  const [placeName, setPlaceName] = useState('');
  const [oneLineReview, setOneLineReview] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // 분리된 사진 및 영상 상태
  const [placePhotos, setPlacePhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [placeVideos, setPlaceVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

  const [consentAiUsage, setConsentAiUsage] = useState(false);

  // 진행 상태 관리
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState<string>('');
  const [result, setResult] = useState<{
    success: boolean;
    rewardAmount?: number;
    photoCount?: number;
    videoCount?: number;
    message?: string;
    error?: string;
    verification?: VerificationResult;
  } | null>(null);

  // 단가 설정: 사진 1장당 2원, 영상 1개당 3원
  const PHOTO_UNIT_PRICE = 2;
  const VIDEO_UNIT_PRICE = 3;

  const totalPhotos = placePhotos.length;
  const totalVideos = placeVideos.length;
  const expectedReward = (totalPhotos * PHOTO_UNIT_PRICE) + (totalVideos * VIDEO_UNIT_PRICE);

  // 영수증 사진 핸들러
  const handleReceiptImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptImage(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  // 사진 다중 선택 핸들러 (장당 2원)
  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setPlacePhotos((prev) => [...prev, ...files]);
      const newPreviews = files.map((f) => URL.createObjectURL(f));
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  // 동영상 다중 선택 핸들러 (개당 3원)
  const handleVideoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setPlaceVideos((prev) => [...prev, ...files]);
      const newPreviews = files.map((f) => URL.createObjectURL(f));
      setVideoPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  // 폼 제출 & Gemini 2중 검증
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oneLineReview.trim()) {
      alert('둥글이가 숏폼과 모션스왑에서 말할 1줄 리뷰 대본을 입력해 주세요!');
      return;
    }

    if (!reviewText.trim()) {
      alert('생생한 솔직 후기를 작성해 주세요!');
      return;
    }

    if (!receiptImage) {
      alert('결제 영수증 이미지를 등록해 주세요!');
      return;
    }

    if (totalPhotos === 0 && totalVideos === 0) {
      alert('사진(장당 2원) 또는 동영상(개당 3원)을 최소 1개 이상 올려주세요!');
      return;
    }

    if (!consentAiUsage) {
      alert('⚠️ [필수 동의]\n콘텐츠 2차 활용 및 AI 가상 체험 동의 항목을 사람이 직접 클릭하여 동의해 주셔야 인증 제출이 가능합니다.');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    setVerificationStep('Gemini Vision이 영수증의 상호명과 결제 일자를 판독 중입니다...');

    const formData = new FormData();
    formData.append('placeName', placeName);
    formData.append('oneLineReview', oneLineReview);
    formData.append('reviewText', reviewText);
    formData.append('consentAiUsage', consentAiUsage ? 'true' : 'false');
    formData.append('receiptImage', receiptImage);
    formData.append('userId', 'demo-user-123');

    // 사진 및 동영상 첨부
    placePhotos.forEach((photo) => formData.append('photos', photo));
    placeVideos.forEach((video) => formData.append('videos', video));

    try {
      setTimeout(() => {
        setVerificationStep(`사진 ${totalPhotos}장과 영상 ${totalVideos}개의 원본 촬영 여부를 교차 검증 중입니다...`);
      }, 1500);

      const res = await fetch('/api/upload-and-verify', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult({
          success: true,
          rewardAmount: data.rewardAmount || expectedReward,
          photoCount: totalPhotos,
          videoCount: totalVideos,
          message: data.message,
          verification: data.verification,
        });

        // 둥글이 감사 인사 음성 발화 (둥글이 아기 목소리 톤)
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance('헤헤! 방문 인증 완료되었둥~! 소중한 후기 남겨주셔서 정말정말 감사합니둥! 둥글이가 리워드 듬뿍 드렸둥~ 고마워둥!');
            utter.rate = 1.15;
            utter.pitch = 1.55;
            window.speechSynthesis.speak(utter);
          } catch (e) {
            console.warn('Speech synthesis error:', e);
          }
        }
      } else {
        setResult({
          success: false,
          error: data.error || '인증 심사에 통과하지 못했습니다.',
          verification: data.verification,
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || '네트워크 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
      setVerificationStep('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 상단 안내 배너 */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-3xl p-5 sm:p-6 flex items-start gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-2xl flex-shrink-0">
          🎁
        </div>
        <div>
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 flex-wrap">
            <span>방문 소스 등록하고 리워드 받기!</span>
            <span className="text-xs bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full font-black border border-amber-300">
              📸 사진 장당 2원 + 🎬 영상 개당 3원
            </span>
          </h2>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            사장님께는 AI 숏폼 홍보를, 유저에게는 쏠쏠한 현금성 리워드를! 영수증과 사진/영상을 올리면 Gemini AI가 검증 후 수량에 맞춰 즉시 지급합니다.
          </p>
        </div>
      </div>

      {/* 업로드 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        {/* 1. 장소명 */}
        <div>
          <label className="block text-sm font-bold text-stone-800 mb-1.5">
            1. 방문한 장소명 <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            required
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="예: 연남동 브루잉랩, 성수 버터베이커리"
            className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 text-stone-800 text-sm outline-none transition-all placeholder:text-stone-400 font-medium"
          />
        </div>

        {/* 2. 1줄 리뷰 (둥글이 리액션 대본) */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-black text-amber-950 flex items-center gap-1.5">
              <span>🎤</span> 2. 둥글이 1줄 리뷰 (숏폼 & 모션스왑 리액션 대본) <span className="text-amber-600">*</span>
            </label>
            <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300">
              둥글이 목소리 대본
            </span>
          </div>
          <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
            ★ 필수: 숏폼과 모션스왑을 만들 때 둥글이가 <strong>귀여운 아기 목소리로 직접 말할 핵심 대본</strong>입니다!
          </p>
          <input
            type="text"
            required
            value={oneLineReview}
            onChange={(e) => setOneLineReview(e.target.value)}
            placeholder="예: 와! 여기 크림라떼 한 입 먹고 기절할 뻔했둥! 버터바 겉바속촉 미쳤다~ ✨"
            className="w-full px-4 py-3 rounded-2xl bg-white border border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-stone-900 text-sm font-bold outline-none transition-all placeholder:text-stone-400 shadow-2xs"
          />
        </div>

        {/* 3. 생생한 솔직 후기 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-bold text-stone-800">
              3. 생생한 솔직 후기 (상세 리뷰) <span className="text-amber-500">*</span>
            </label>
            <span className="text-xs text-stone-400 font-normal">숏폼 하단 설명 자막 연동</span>
          </div>
          <textarea
            required
            rows={3}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="예: 크림라떼의 바닐라 풍미가 미쳤어요! 통창 뷰도 예뻐서 사진 찍기 최고였습니다."
            className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 text-stone-800 text-sm outline-none transition-all placeholder:text-stone-400"
          />
        </div>

        {/* 3. 결제 영수증 업로드 칸 (단독) */}
        <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-stone-800">
              3. 결제 영수증 첨부 <span className="text-amber-500">*</span>
            </label>
            <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">
              Gemini 필수 검증
            </span>
          </div>
          <div className="relative border-2 border-dashed border-stone-200 hover:border-amber-400 bg-white rounded-2xl p-4 text-center min-h-[140px] flex flex-col items-center justify-center overflow-hidden transition-all">
            {receiptPreview ? (
              <div className="relative w-full max-w-xs h-28 rounded-xl overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={receiptPreview} alt="영수증 미리보기" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                  영수증 변경하기
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Receipt className="w-8 h-8 text-amber-600 mb-1" />
                <span className="text-xs font-bold text-stone-700">신용카드/전자 영수증 첨부</span>
                <span className="text-[11px] text-stone-400 mt-0.5">상호명과 날짜가 보이게 찍어주세요</span>
              </div>
            )}
            <input type="file" accept="image/*" required onChange={handleReceiptImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        {/* 4 & 5. 사진 업로드 칸과 동영상 업로드 칸 분리 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* [사진 업로드 칸] (장당 2원) */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border-2 border-amber-200/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-600" />
                  장소 사진 등록
                </label>
                <span className="text-xs font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                  장당 +2원
                </span>
              </div>
              <p className="text-[11px] text-stone-500">스마트폰으로 직접 촬영한 사진을 올려주세요.</p>
            </div>

            {/* 사진 프리뷰 썸네일 그리드 */}
            <div className="space-y-2">
              <div className="relative border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white rounded-xl p-3 text-center min-h-[120px] flex flex-col items-center justify-center overflow-hidden transition-all">
                {photoPreviews.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5 w-full">
                    {photoPreviews.map((url, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={idx} src={url} alt={`사진 ${idx+1}`} className="w-full h-16 object-cover rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-stone-500">
                    <Plus className="w-6 h-6 text-amber-600 mb-1" />
                    <span className="text-xs font-bold text-stone-700">사진 파일 추가</span>
                    <span className="text-[10px] text-stone-400">여러 장 다중 선택 가능</span>
                  </div>
                )}
                <input type="file" accept="image/*" multiple onChange={handlePhotoAdd} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
              <span className="text-stone-600">등록된 사진: <strong>{totalPhotos}</strong>장</span>
              <span className="font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg">
                +{totalPhotos * PHOTO_UNIT_PRICE}원 적립 예정
              </span>
            </div>
          </div>

          {/* [동영상 업로드 칸] (개당 3원) */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border-2 border-emerald-200/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-emerald-600" />
                  장소 동영상 등록
                </label>
                <span className="text-xs font-black text-emerald-900 bg-emerald-200 px-2 py-0.5 rounded-full">
                  영상당 +3원
                </span>
              </div>
              <p className="text-[11px] text-stone-500">생생한 분위기의 숏클립 영상을 올려주세요.</p>
            </div>

            {/* 동영상 프리뷰 컨테이너 */}
            <div className="space-y-2">
              <div className="relative border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white rounded-xl p-3 text-center min-h-[120px] flex flex-col items-center justify-center overflow-hidden transition-all">
                {videoPreviews.length > 0 ? (
                  <video src={videoPreviews[0]} controls playsInline className="w-full h-24 object-cover rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center text-stone-500">
                    <VideoIcon className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-stone-700">동영상 파일 추가</span>
                    <span className="text-[10px] text-stone-400">MP4, MOV 영상 첨부</span>
                  </div>
                )}
                <input type="file" accept="video/*" multiple onChange={handleVideoAdd} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-xs">
              <span className="text-stone-600">등록된 영상: <strong>{totalVideos}</strong>개</span>
              <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg">
                +{totalVideos * VIDEO_UNIT_PRICE}원 적립 예정
              </span>
            </div>
          </div>

        </div>

        {/* 실시간 합산 정산 배너 */}
        <div className="p-4 rounded-2xl bg-amber-100/70 border-2 border-amber-300 flex items-center justify-between text-stone-900 shadow-sm">
          <div>
            <div className="text-xs font-bold text-stone-600">이번 업로드 예상 리워드:</div>
            <div className="text-[11px] text-stone-500">
              사진 {totalPhotos}장 (×2원) + 동영상 {totalVideos}개 (×3원)
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900">
            총 <span className="underline decoration-amber-400 decoration-4">{expectedReward}</span>원
          </div>
        </div>

        {/* 동의 체크박스 (기본 미체크: 사용자가 직접 클릭해야 함) */}
        <div className="pt-1">
          <label className={`flex items-start gap-3 p-3.5 border-2 rounded-2xl cursor-pointer transition-all select-none ${
            consentAiUsage
              ? 'bg-amber-50/80 border-amber-400 shadow-2xs'
              : 'bg-white border-stone-200 hover:border-amber-400 hover:bg-amber-50/40'
          }`}>
            <input
              type="checkbox"
              required
              checked={consentAiUsage}
              onChange={(e) => setConsentAiUsage(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 cursor-pointer"
            />
            <div className="text-xs text-stone-700 leading-snug">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <span className="text-amber-600 font-extrabold">[필수 동의]</span>
                콘텐츠 2차 활용 및 AI 가상 체험 동의
              </span>
              <p className="text-stone-500 mt-0.5">
                제공해주신 사진/영상이 재가공되어 쓰일 수 있음에 동의합니다.
              </p>
            </div>
          </label>
        </div>

        {/* 진행 상태 알림 */}
        {isSubmitting && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 text-amber-600 animate-spin flex-shrink-0" />
            <div className="text-xs font-semibold text-amber-900">
              <p>{verificationStep || 'Gemini Vision AI 2중 검증 시스템 가동 중...'}</p>
              <p className="text-[11px] text-amber-700/80 font-normal mt-0.5">
                영수증 유효성 판독과 사진/영상의 직접 촬영 원본 진위 여부를 분석하고 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* 검증 결과 피드백 */}
        {result && (
          <div
            className={`p-5 rounded-2xl border text-xs ${
              result.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
              {result.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Gemini 2중 인증 완료! 리워드 (+{result.rewardAmount}원) 지급 성공
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  인증 반려 안내
                </>
              )}
            </div>

            <p className="leading-relaxed">
              {result.success ? result.message : result.error}
            </p>

            {result.verification?.receiptData && (
              <div className="mt-3 pt-3 border-t border-stone-200/60 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between font-bold">
                  <span>🛡️ 1번 필터 스코어: {result.verification.receiptData.score}점 / 100점</span>
                  {result.verification.receiptData.fingerprint && (
                    <span className="font-mono text-[10px] text-stone-500">지문: {result.verification.receiptData.fingerprint}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-700">
                  <span>{result.verification.receiptData.hasApprovalNumber ? `✓ 승인번호: ${result.verification.receiptData.approvalNumber || '인증'}` : '✕ 승인번호 미검출 (0점)'}</span>
                  <span>{result.verification.receiptData.hasBusinessNumber ? `✓ 사업자번호: ${result.verification.receiptData.businessNumber || '인증'}` : '✕ 사업자번호 미검출 (0점)'}</span>
                </div>
              </div>
            )}

            {result.success && (
              <>
                {/* 둥글이 감사 인사 말풍선 */}
                <div className="mt-3 p-3 bg-gradient-to-r from-amber-100 via-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 flex items-center gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 bg-amber-200 flex-shrink-0 shadow-sm animate-bounce flex items-center justify-center text-lg">
                    👶
                  </div>
                  <div className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5 font-black text-amber-950">
                      <span>👶 둥글이의 감사 인사:</span>
                      <span className="text-[9px] bg-amber-400 text-stone-900 px-1.5 py-0.5 rounded-full font-bold">음성 발화</span>
                    </div>
                    <p className="text-[12px] font-black text-amber-900 leading-snug">
                      &ldquo;헤헤! 방문 인증 완료되었둥~! 소중한 후기 남겨주셔서 정말정말 감사합니둥! 둥글이가 리워드 듬뿍 드렸둥~ 고마워둥! 💖✨&rdquo;
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-emerald-200/60 flex flex-wrap gap-2 text-[11px]">
                  <span className="bg-white/80 px-2 py-1 rounded-lg">📸 사진 {result.photoCount}장: 각 2원 지급</span>
                  <span className="bg-white/80 px-2 py-1 rounded-lg">🎬 영상 {result.videoCount}개: 각 3원 지급</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 font-bold text-stone-900 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gemini AI 검증 및 리워드 정산 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-800" />
              2중 인증 제출하고 {expectedReward}원 받기
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
