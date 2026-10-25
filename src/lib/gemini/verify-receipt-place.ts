import { GoogleGenerativeAI } from '@google/generative-ai';
import { VerificationResult } from '@/types';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function verifyReceiptAndPlaceImage(params: {
  placeName: string;
  receiptBase64: string;
  receiptMimeType: string;
  placeBase64: string;
  placeMimeType: string;
}): Promise<VerificationResult> {
  const { placeName, receiptBase64, receiptMimeType, placeBase64, placeMimeType } = params;

  // GEMINI_API_KEY가 등록되어 있지 않은 경우의 스마트 시뮬레이션 Fallback
  if (!apiKey || apiKey === 'AIzaSy...') {
    console.warn('[Gemini] GEMINI_API_KEY is not set. Running in verified simulated mode.');
    return {
      isValid: true,
      receiptData: {
        isValidReceipt: true,
        storeName: placeName,
        transactionDate: new Date().toISOString().slice(0, 10),
        isDateRecent: true,
        totalAmount: 18500,
        confidence: 0.96,
        notes: '[시뮬레이션] 정상 결제 영수증으로 판독되었습니다.',
      },
      placePhotoAnalysis: {
        isOriginalPhoto: true,
        detectedSubjects: ['카페 내부', '디저트', '테이블 인테리어'],
        visualQualityScore: 0.94,
        isCommercialAtmosphere: true,
        notes: '[시뮬레이션] 스마트폰 카메라로 직접 촬영된 고해상도 원본 사진입니다.',
      },
      matchedStoreName: true,
      earnedPoints: 1000,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `
당신은 '1인 AI 방송국'의 엄격한 유저 리워드 및 저작권 심사관 AI입니다.
유저가 제출한 1번 이미지(결제 영수증)와 2번 이미지(장소 방문 사진)를 면밀히 교차 분석하여 2중 검증을 수행하세요.

[유저가 입력한 방문 장소명]
"${placeName}"

[검증 항목 1: 영수증 분석]
1. 실제 매장/식당/카페 등의 결제 영수증(신용카드 전표, 모바일 결제 내역서, 간이영수증 등)인지 확인.
2. 영수증에 인쇄된 상호명이 유저가 입력한 장소명("${placeName}")과 일치하거나 유사한지 판별.
3. 거래 일시가 최근(가급적 최근 30~60일 이내)인지 확인.
4. 영수증 위조/중복 합성/단순 백지 영수증 여부 판별.

[검증 항목 2: 장소 사진 분석 (불펌 및 캡처 판별)]
1. 인터넷 블로그/인스타그램 불펌, 화면 캡처(상단바, 하단 소프트키, 브라우저 탭, 인스타 UI 흔적 등), 모니터 재촬영 격자무늬(모아레 현상), 타인의 워터마크가 있는지 검사.
2. 유저가 스마트폰/카메라로 해당 공간을 '직접 찍은 현장 원본 사진'인지 판별.
3. AI 숏폼 영상 배경으로 활용할 수 있는 적합한 품질(선명도, 분위기)인지 확인.

[최종 승인 판정 기준]
- isValid는 (영수증 유효성: 참) AND (상호명 매칭: 참 또는 유사) AND (장소 사진 원본 직접 촬영: 참)일 때만 true입니다.
- 불펌 의심, 캡처본, 가짜 영수증, 상호명 불일치 시 isValid는 false이고 명확한 rejectionReason을 한국어로 작성해야 합니다.

[출력 형식]
반드시 다음 JSON 형식만 순수 문자열(Markdown 코드블록 없이 JSON만)로 출력하세요:
{
  "isValid": true | false,
  "receiptData": {
    "isValidReceipt": true | false,
    "storeName": "판독된 상호명",
    "transactionDate": "YYYY-MM-DD",
    "isDateRecent": true | false,
    "totalAmount": 12000,
    "confidence": 0.95,
    "notes": "영수증 분석 메모"
  },
  "placePhotoAnalysis": {
    "isOriginalPhoto": true | false,
    "detectedSubjects": ["테이블", "커피", "인테리어"],
    "visualQualityScore": 0.9,
    "isCommercialAtmosphere": true | false,
    "notes": "직접 촬영 여부 및 사진 퀄리티 판별 메모"
  },
  "matchedStoreName": true | false,
  "rejectionReason": "거절 시 구체적인 사유 (승인 시 빈 문자열)",
  "earnedPoints": 1000
}
    `.trim();

    const imageParts = [
      {
        inlineData: {
          data: receiptBase64,
          mimeType: receiptMimeType,
        },
      },
      {
        inlineData: {
          data: placeBase64,
          mimeType: placeMimeType,
        },
      },
    ];

    const result = await model.generateContent([systemPrompt, ...imageParts]);
    const responseText = result.response.text().trim();

    // 혹시 모를 마크다운 코드블록 제거
    const cleanJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed: VerificationResult = JSON.parse(cleanJson);
    return parsed;
  } catch (error) {
    console.error('[Gemini 2중 검증 에러]:', error);
    // 에러 발생 시 안전한 거절 처리 및 상세 기록
    return {
      isValid: false,
      receiptData: {
        isValidReceipt: false,
        confidence: 0,
        notes: 'AI 검증 처리 중 오류가 발생했습니다.',
      },
      placePhotoAnalysis: {
        isOriginalPhoto: false,
        detectedSubjects: [],
        visualQualityScore: 0,
        isCommercialAtmosphere: false,
        notes: '이미지 분석에 실패했습니다.',
      },
      matchedStoreName: false,
      rejectionReason: '이미지 분석 도중 일시적인 네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      earnedPoints: 0,
    };
  }
}
