export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
  points: number;
  created_at: string;
}

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ReceiptData {
  isValidReceipt: boolean;
  score: number;               // 0 ~ 100점 영수증 진위 스코어
  businessNumber?: string;     // 사업자등록번호 (10자리)
  hasBusinessNumber: boolean;  // 사업자번호 유효 검출 여부 (25점)
  approvalNumber?: string;     // 신용카드/현금영수증 승인번호 (8자리)
  hasApprovalNumber: boolean;  // 승인번호 유효 검출 여부 (25점)
  vatCalculationMatched: boolean; // 부가세(10%) 역산 일치 여부 (15점)
  isRecentDate: boolean;       // 최근 60일 이내 결제 여부 (20점)
  isPosFormat: boolean;        // 감열지/POS 단말기 출력 양식 여부 (15점)
  storeName?: string;
  transactionDate?: string;
  totalAmount?: number;
  confidence: number;          // 0.0 ~ 1.0
  fingerprint?: string;        // 사업자+일시+승인번호+금액 기반 고유 지문 해시
  isDuplicate?: boolean;       // 중복 제출 여부
  notes?: string;
}

export interface PlacePhotoAnalysis {
  isOriginalPhoto: boolean; // 모니터 촬영, 캡처본, 불펌 워터마크 여부 확인
  detectedSubjects: string[];
  visualQualityScore: number; // 0.0 ~ 1.0
  isCommercialAtmosphere: boolean;
  notes?: string;
}

export interface VerificationResult {
  isValid: boolean;
  receiptData: ReceiptData;
  placePhotoAnalysis: PlacePhotoAnalysis;
  matchedStoreName: boolean;
  rejectionReason?: string;
  earnedPoints?: number;
}

export interface Submission {
  id: string;
  user_id: string;
  place_name: string;
  one_line_review?: string; // 둥글이 숏폼 및 모션스왑 리액션 1줄 대본
  review_text: string;      // 생생한 상세 솔직 후기
  place_image_url: string;
  receipt_image_url: string;
  consent_ai_usage: boolean;
  verification_status: VerificationStatus;
  verification_data?: VerificationResult;
  rejection_reason?: string;
  reward_paid: boolean;
  reward_amount: number;
  created_at: string;
  updated_at: string;
  render?: RenderItem | null;
}

export interface RenderItem {
  id: string;
  submission_id: string;
  created_by?: string;
  hook_script: string;
  video_url?: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error_message?: string;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  features: string[];
  recommended?: boolean;
}

// ==========================================
// AI 모션 스왑 및 템플릿 자동화 엔진 인터페이스
// ==========================================
export type MotionTemplatePresetId = 'dance-challenge' | 'cute-greeting' | 'mukbang-reaction' | 'store-tour';

export interface MotionTemplatePreset {
  id: MotionTemplatePresetId;
  title: string;
  description: string;
  duration: string;
  thumbnailUrl: string;
  sampleVideoUrl: string;
  recommendedHookText: string;
}

export interface MotionSwapRequest {
  userImageUrl: string;                // 합성할 유저/캐릭터 전신/상반신 이미지
  motionVideoUrl?: string;             // 참고용 모션 숏폼 영상 URL
  presetId?: MotionTemplatePresetId;   // 프리셋 템플릿 ID
  hookText: string;                    // 상단/하단 3초 후킹 텍스트
  userId?: string;
}

export interface MotionSwapResult {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  originalMotionUrl: string;
  swappedVideoUrl: string;             // 모션 스왑된 영상
  finalVideoUrl: string;               // 3초 훅 자막 FFmpeg 오버레이 최종본
  hookText: string;
  durationSeconds: number;
  createdAt: string;
  error?: string;
}
