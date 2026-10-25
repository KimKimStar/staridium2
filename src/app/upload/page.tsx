import React from 'react';
import UploadForm from '@/components/UploadForm';

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
          방문 장소 인증 & 1,000P 받기
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          직접 방문한 매장의 사진과 영수증을 올려주시면 Gemini Vision이 즉시 검증합니다.
        </p>
      </div>

      <UploadForm />
    </div>
  );
}
