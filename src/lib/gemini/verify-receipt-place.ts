import { GoogleGenerativeAI } from '@google/generative-ai';
import { VerificationResult } from '@/types';
import { computeReceiptFingerprint, checkReceiptDuplicate, registerReceiptFingerprint } from '@/lib/receipt-store';

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

  // GEMINI_API_KEY가 미설정이거나 테스트 키인 경우의 스마트 시뮬레이션
  if (!apiKey || apiKey === 'AIzaSy...') {
    console.warn('[Gemini] GEMINI_API_KEY is not set. Running in verified 1+2 filter simulated mode.');
    
    // 시뮬레이션에서도 승인번호와 사업자번호를 정밀 생성하여 2번 중복 방지 지문 테스트 지원
    const sampleBizNo = '124-86-59281';
    const sampleAuthNo = '73910482';
    const sampleDate = new Date().toISOString().slice(0, 10);
    const sampleAmount = 18500;

    const fingerprint = computeReceiptFingerprint({
      businessNumber: sampleBizNo,
      approvalNumber: sampleAuthNo,
      transactionDate: sampleDate,
      totalAmount: sampleAmount,
      storeName: placeName,
    });

    const dupCheck = checkReceiptDuplicate(fingerprint);
    if (dupCheck.isDuplicate) {
      return {
        isValid: false,
        receiptData: {
          isValidReceipt: false,
          score: 0,
          businessNumber: sampleBizNo,
          hasBusinessNumber: true,
          approvalNumber: sampleAuthNo,
          hasApprovalNumber: true,
          vatCalculationMatched: true,
          isRecentDate: true,
          isPosFormat: true,
          storeName: placeName,
          transactionDate: sampleDate,
          totalAmount: sampleAmount,
          confidence: 0.98,
          fingerprint,
          isDuplicate: true,
          notes: '[중복 감지] 이미 다른 사용자에 의해 리워드가 지급된 영수증입니다.',
        },
        placePhotoAnalysis: {
          isOriginalPhoto: true,
          detectedSubjects: ['카페 내부', '디저트'],
          visualQualityScore: 0.94,
          isCommercialAtmosphere: true,
          notes: '사진은 정상이나 영수증이 중복되었습니다.',
        },
        matchedStoreName: true,
        rejectionReason: `이미 리워드가 지급된 중복 영수증입니다. (승인번호: ${sampleAuthNo}, 최초 등록일: ${dupCheck.existingRecord?.registeredAt.slice(0, 10)})`,
        earnedPoints: 0,
      };
    }

    return {
      isValid: true,
      receiptData: {
        isValidReceipt: true,
        score: 100, // 5대 결제 메타데이터 모두 통과 (25+25+20+15+15)
        businessNumber: sampleBizNo,
        hasBusinessNumber: true,
        approvalNumber: sampleAuthNo,
        hasApprovalNumber: true,
        vatCalculationMatched: true,
        isRecentDate: true,
        isPosFormat: true,
        storeName: placeName,
        transactionDate: sampleDate,
        totalAmount: sampleAmount,
        confidence: 0.98,
        fingerprint,
        isDuplicate: false,
        notes: '[1,2번 통과] 사업자번호 및 카드 승인번호(8자리) 검증 완료. 유일한 영수증 지문 확인.',
      },
      placePhotoAnalysis: {
        isOriginalPhoto: true,
        detectedSubjects: ['카페 내부', '디저트', '테이블 인테리어'],
        visualQualityScore: 0.95,
        isCommercialAtmosphere: true,
        notes: '스마트폰 카메라로 직접 촬영된 고해상도 현장 원본 사진입니다.',
      },
      matchedStoreName: true,
      earnedPoints: 1000,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `
당신은 '1인 AI 방송국'의 엄격한 유저 리워드 및 저작권 심사관 AI입니다.
유저가 제출한 1번 이미지(결제 영수증)와 2번 이미지(장소 방문 사진)를 면밀히 분석하여,
【1번: 진짜 영수증 vs 그냥 종이 구분 100점 점수제 검증】과 【2번: 영수증 중복/재탕 방지 지문 분석】을 엄격하게 수행하세요.

[유저가 입력한 방문 장소명]
"${placeName}"

[검증 항목 1: 영수증 100점 진위 판별 스코어링]
1. 사업자등록번호 유효성 (25점):
   - 10자리(XXX-XX-XXXXX) 사업자등록번호가 영수증에 인쇄되어 있는가? (유효하면 hasBusinessNumber: true, 25점)
   - 일반 메모지, A4 백지, 단순 음식 사진 등에는 사업자번호가 없으므로 0점 처리.
2. 카드 승인번호 / 현금영수증 승인번호 유효성 (25점):
   - 금융 결제 승인번호(8자리 또는 영수증 고유 승인No)가 확인되는가? (유효하면 hasApprovalNumber: true, 25점)
   - 일반 종이, 낙서, 메뉴판 등에는 절대 승인번호가 없으므로 0점 처리.
3. 거래 일시 (20점):
   - 최근 결제 날짜(시/분/초 포함)가 인쇄되어 있는가? (최근 60일 이내이면 isRecentDate: true, 20점)
4. 공급가액 + 부가세(VAT 10%) = 총 결제금액 검산 (15점):
   - 금액 계산이 수학적으로 일치하는가? (일치하면 vatCalculationMatched: true, 15점)
5. 감열지/POS 영수증 포맷 (15점):
   - 감열식 롤페이퍼 톱니 절단선, 헤더/품목테이블/결제정보 3단 구조를 갖추었는가? (갖추었으면 isPosFormat: true, 15점)

[엄격한 탈락 및 가짜 종이 차단 기준]
- score는 위 5개 항목의 합산 점수(0~100점)입니다.
- score가 70점 미만이거나, '사업자등록번호' 또는 '승인번호' 중 하나라도 누락된 경우 isValidReceipt는 무조건 false이며,
  rejectionReason에 "신용카드 승인번호 또는 사업자등록번호가 확인되지 않는 일반 종이(또는 무효한 영수증)입니다."를 명확히 작성하세요.

[검증 항목 2: 장소 사진 분석 (불펌 및 캡처 판별)]
1. 인터넷 블로그/인스타그램 불펌, 화면 캡처(상단바, 하단 소프트키, 브라우저 탭, 인스타 UI 흔적 등), 모니터 재촬영 격자무늬(모아레 현상), 타인의 워터마크가 있는지 검사.
2. 유저가 스마트폰/카메라로 해당 공간을 '직접 찍은 현장 원본 사진'인지 판별.

[최종 승인 판정]
- isValid는 (score >= 70) AND (hasApprovalNumber: true) AND (hasBusinessNumber: true) AND (상호명 매칭: true) AND (장소 사진 원본: true)일 때만 true입니다.

[출력 형식]
반드시 다음 JSON 형식만 순수 문자열(Markdown 코드블록 없이 JSON만)로 출력하세요:
{
  "isValid": true | false,
  "receiptData": {
    "isValidReceipt": true | false,
    "score": 100,
    "businessNumber": "123-45-67890",
    "hasBusinessNumber": true | false,
    "approvalNumber": "12345678",
    "hasApprovalNumber": true | false,
    "vatCalculationMatched": true | false,
    "isRecentDate": true | false,
    "isPosFormat": true | false,
    "storeName": "판독된 상호명",
    "transactionDate": "YYYY-MM-DD",
    "totalAmount": 15000,
    "confidence": 0.95,
    "notes": "100점 스코어링 세부 판정 근거"
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

    // 2번: 영수증 고유 지문(Fingerprint) 산출 & 중복 검사
    const fingerprint = computeReceiptFingerprint({
      businessNumber: parsed.receiptData.businessNumber,
      approvalNumber: parsed.receiptData.approvalNumber,
      transactionDate: parsed.receiptData.transactionDate,
      totalAmount: parsed.receiptData.totalAmount,
      storeName: parsed.receiptData.storeName || placeName,
    });
    parsed.receiptData.fingerprint = fingerprint;

    const dupCheck = checkReceiptDuplicate(fingerprint);
    if (dupCheck.isDuplicate) {
      parsed.isValid = false;
      parsed.receiptData.isDuplicate = true;
      parsed.receiptData.isValidReceipt = false;
      parsed.rejectionReason = `이미 리워드가 지급된 중복 영수증입니다. (승인번호: ${parsed.receiptData.approvalNumber || '인증완료'}, 최초 등록일: ${dupCheck.existingRecord?.registeredAt.slice(0, 10)})`;
      parsed.earnedPoints = 0;
    }

    return parsed;
  } catch (error) {
    console.error('[Gemini 2중 검증 에러]:', error);
    return {
      isValid: false,
      receiptData: {
        isValidReceipt: false,
        score: 0,
        hasBusinessNumber: false,
        hasApprovalNumber: false,
        vatCalculationMatched: false,
        isRecentDate: false,
        isPosFormat: false,
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
