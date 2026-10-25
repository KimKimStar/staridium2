'use client';

import React, { useState, useRef } from 'react';
import { Upload, Video, Sparkles, Film, ArrowRight, Loader2, Check, RefreshCw, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { MOTION_TEMPLATE_PRESETS } from '@/lib/replicate/motion-swap';
import { MotionSwapResult, MotionTemplatePresetId } from '@/types';

interface Props {
  onSuccess: (result: MotionSwapResult) => void;
}

export default function MotionSwapForm({ onSuccess }: Props) {
  // 1. 유저 이미지 상태
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [userImagePreview, setUserImagePreview] = useState<string>(
    'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=600' // 귀여운 캐릭터 기본 샘플
  );
  const [isImageDragging, setIsImageDragging] = useState(false);

  // 2. 모션 숏폼 영상 상태 (직접 업로드 / URL 입력 / 프리셋 선택)
  const [selectedPresetId, setSelectedPresetId] = useState<MotionTemplatePresetId>('dance-challenge');
  const [motionVideoFile, setMotionVideoFile] = useState<File | null>(null);
  const [motionVideoUrl, setMotionVideoUrl] = useState<string>('');
  const [isVideoDragging, setIsVideoDragging] = useState(false);

  // 3. 3초 훅 텍스트 상태
  const [hookText, setHookText] = useState('이 댄스 챌린지 둥글이가 완벽 접수했둥! ✨');

  // 진행 상태 관리
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  const fileInputImageRef = useRef<HTMLInputElement>(null);
  const fileInputVideoRef = useRef<HTMLInputElement>(null);

  // 이미지 드래그 앤 드롭 핸들러
  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsImageDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUserImageFile(file);
      setUserImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserImageFile(file);
      setUserImagePreview(URL.createObjectURL(file));
    }
  };

  // 비디오 드래그 앤 드롭 핸들러
  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsVideoDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setMotionVideoFile(file);
      setMotionVideoUrl(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMotionVideoFile(file);
      setMotionVideoUrl(URL.createObjectURL(file));
    }
  };

  // 프리셋 선택 핸들러
  const handleSelectPreset = (presetId: MotionTemplatePresetId) => {
    setSelectedPresetId(presetId);
    setMotionVideoFile(null);
    setMotionVideoUrl('');
    const preset = MOTION_TEMPLATE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setHookText(preset.recommendedHookText);
    }
  };

  // 폼 제출 & 렌더링 호출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const formData = new FormData();
    if (userImageFile) {
      formData.append('userImage', userImageFile);
    } else {
      formData.append('userImageUrl', userImagePreview);
    }

    if (motionVideoFile) {
      formData.append('motionVideo', motionVideoFile);
    } else if (motionVideoUrl) {
      formData.append('motionVideoUrl', motionVideoUrl);
    } else {
      formData.append('presetId', selectedPresetId);
    }

    formData.append('hookText', hookText);
    formData.append('userId', 'demo-user-123');

    try {
      setProcessingStep('1단계: 캐릭터 이미지의 포즈와 신체 랜드마크 분석 중...');

      setTimeout(() => {
        setProcessingStep('2단계: Replicate 모션 스왑 모델이 원본 영상의 뼈대와 타이밍을 합성 중...');
      }, 1500);

      setTimeout(() => {
        setProcessingStep('3단계: FFmpeg 엔진이 9:16 세로 규격 및 3초 훅 자막을 오버레이 인코딩 중...');
      }, 3500);

      const res = await fetch('/api/motion-swap', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '모션 스왑 렌더링에 실패했습니다.');
      }

      onSuccess(data);
    } catch (err: any) {
      alert(`모션 스왑 오류: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-8">
      {/* 1. 유저 이미지 드래그앤드롭 영역 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">1</span>
            합성할 사진 또는 캐릭터 이미지 (Drag & Drop)
          </label>
          <span className="text-xs text-stone-500">전신 또는 상반신 권장</span>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsImageDragging(true); }}
          onDragLeave={() => setIsImageDragging(false)}
          onDrop={handleImageDrop}
          onClick={() => fileInputImageRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[190px] ${
            isImageDragging
              ? 'border-amber-500 bg-amber-50/80 scale-[1.01]'
              : 'border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-stone-50'
          }`}
        >
          {userImagePreview ? (
            <div className="flex flex-col sm:flex-row items-center gap-5 w-full max-w-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={userImagePreview}
                alt="캐릭터 미리보기"
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border-2 border-amber-300 shadow-sm"
              />
              <div className="text-left space-y-1">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-block">
                  ✓ 이미지 로드 완료
                </span>
                <p className="text-xs font-bold text-stone-800">
                  {userImageFile ? userImageFile.name : '둥글이 캐릭터 샘플 사용 중'}
                </p>
                <p className="text-[11px] text-stone-500">클릭하거나 다른 사진을 드래그해 교체할 수 있습니다.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-stone-500">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-stone-700">이곳에 캐릭터나 인물 사진을 끌어다 놓으세요</p>
              <p className="text-[11px] text-stone-400">JPG, PNG, WebP 지원 (최대 20MB)</p>
            </div>
          )}
          <input
            ref={fileInputImageRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      </div>

      {/* 2. 참고용 숏폼 모션 영상 (드래그앤드롭 or 템플릿 프리셋 4종 선택) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">2</span>
            따라할 모션 숏폼 영상 선택 또는 업로드
          </label>
          <span className="text-xs text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
            모션 뼈대 추적 엔진
          </span>
        </div>

        {/* 인기 모션 템플릿 프리셋 4종 카드 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MOTION_TEMPLATE_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id && !motionVideoFile && !motionVideoUrl;
            return (
              <button
                type="button"
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`relative rounded-2xl p-3 text-left border-2 transition-all flex flex-col justify-between overflow-hidden group ${
                  isSelected
                    ? 'border-amber-400 bg-amber-50/80 shadow-xs ring-2 ring-amber-200'
                    : 'border-stone-200 hover:border-amber-300 bg-white'
                }`}
              >
                {/* 썸네일 */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-2 bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preset.thumbnailUrl} alt={preset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.2 rounded font-mono">
                    {preset.duration}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-stone-900 leading-snug line-clamp-1">{preset.title}</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">{preset.description}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center text-[10px] font-bold shadow-xs">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 직접 비디오 파일 Drag & Drop 또는 URL 입력 토글 */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsVideoDragging(true); }}
          onDragLeave={() => setIsVideoDragging(false)}
          onDrop={handleVideoDrop}
          onClick={() => fileInputVideoRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
            isVideoDragging
              ? 'border-emerald-500 bg-emerald-50/70'
              : 'border-stone-200 hover:border-amber-300 bg-stone-50/50'
          }`}
        >
          {motionVideoFile ? (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
              <Film className="w-4 h-4 text-emerald-600" />
              <span>직접 업로드된 영상: {motionVideoFile.name} (클릭 시 교체)</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs text-stone-600">
              <Video className="w-4 h-4 text-amber-600" />
              <span>또는 나만의 챌린지 숏폼 비디오(MP4)를 이곳에 끌어다 놓으세요</span>
            </div>
          )}
          <input
            ref={fileInputVideoRef}
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="hidden"
          />
        </div>
      </div>

      {/* 3. 3초 훅 텍스트 입력 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">3</span>
            영상 상단에 얹을 3초 후킹 대사 (FFmpeg 오버레이)
          </label>
          <span className="text-[11px] text-stone-500">시청자 이탈 방어용 자막</span>
        </div>

        <div className="relative">
          <input
            type="text"
            required
            value={hookText}
            onChange={(e) => setHookText(e.target.value)}
            placeholder="예: 이 댄스 챌린지 둥글이가 완벽 접수했둥!"
            className="w-full px-4 py-3.5 pr-10 rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 text-stone-800 text-sm font-semibold outline-none transition-all placeholder:text-stone-400"
          />
          <button
            type="button"
            onClick={() => {
              const samples = [
                '이 댄스 챌린지 둥글이가 완벽 접수했둥! ✨',
                '한 입 먹자마자 기절각! 여긴 진짜 찐이야~ 🥐',
                '안녕! 오늘 내가 소개할 대박 핫플은 어디게? 💖',
                '사장님도 몰래 숨겨둔 우리 가게 비밀 스팟 공개! 🚪',
                '1초 만에 시선 강탈! 둥글이 표정 주목~ 👶',
              ];
              const random = samples[Math.floor(Math.random() * samples.length)];
              setHookText(random);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-amber-600 transition-colors"
            title="다른 훅 문구 추천받기"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 진행 상태 알림 */}
      {isProcessing && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 text-amber-600 animate-spin flex-shrink-0" />
          <div className="text-xs font-semibold text-amber-900">
            <p>{processingStep || 'Replicate 모션 스왑 및 FFmpeg 렌더링 파이프라인 가동 중...'}</p>
            <p className="text-[11px] text-amber-700/80 font-normal mt-0.5">
              원본 비디오의 모션 뼈대와 타이밍을 추적하여 캐릭터에 모션을 전이하고 자막을 합성합니다.
            </p>
          </div>
        </div>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 font-black text-stone-950 text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            AI 모션 스왑 숏폼 렌더링 중...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-amber-900" />
            AI 모션 스왑 & 3초 훅 숏폼 렌더링 시작하기
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
