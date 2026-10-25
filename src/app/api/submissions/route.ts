import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Submission } from '@/types';

// 초기 데모용 승인 데이터 (DB 연결 전에도 바로 테스트할 수 있도록 제공)
const DEMO_SUBMISSIONS: Submission[] = [
  {
    id: 'demo-sub-1',
    user_id: 'user-01',
    place_name: '연남동 크림라떼 성지 브루잉랩',
    review_text: '바닐라 빈을 직접 끓여 넣어서 크림이 진짜 부드럽고 묵직해요. 사진 찍기도 너무 좋고 재방문 의사 1000%!',
    place_image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1080',
    receipt_image_url: 'https://images.unsplash.com/photo-1554415707-9e4466b88588?w=800',
    consent_ai_usage: true,
    verification_status: 'APPROVED',
    reward_paid: true,
    reward_amount: 1000,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    verification_data: {
      isValid: true,
      receiptData: {
        isValidReceipt: true,
        storeName: '브루잉랩 연남점',
        transactionDate: '2026-10-24',
        totalAmount: 14000,
        confidence: 0.98,
      },
      placePhotoAnalysis: {
        isOriginalPhoto: true,
        detectedSubjects: ['아인슈페너', '원목 테이블', '조명 인테리어'],
        visualQualityScore: 0.95,
        isCommercialAtmosphere: true,
      },
      matchedStoreName: true,
      earnedPoints: 1000,
    },
  },
  {
    id: 'demo-sub-2',
    user_id: 'user-02',
    place_name: '성수 버터베이커리 팩토리',
    review_text: '줄 서서 먹는 솔티드 버터바! 겉은 바삭하고 속은 쫀득한 버터 풍미가 입안 가득 퍼집니다. 커피랑 찰떡궁합!',
    place_image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1080',
    receipt_image_url: 'https://images.unsplash.com/photo-1554415707-9e4466b88588?w=800',
    consent_ai_usage: true,
    verification_status: 'APPROVED',
    reward_paid: true,
    reward_amount: 1000,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
    verification_data: {
      isValid: true,
      receiptData: {
        isValidReceipt: true,
        storeName: '성수 버터베이커리',
        transactionDate: '2026-10-23',
        totalAmount: 18500,
        confidence: 0.99,
      },
      placePhotoAnalysis: {
        isOriginalPhoto: true,
        detectedSubjects: ['버터바 디저트', '포장 패키지', '쇼케이스'],
        visualQualityScore: 0.97,
        isCommercialAtmosphere: true,
      },
      matchedStoreName: true,
      earnedPoints: 1000,
    },
  },
  {
    id: 'demo-sub-3',
    user_id: 'user-03',
    place_name: '망원 앤틱 앤 플라워 테라스',
    review_text: '테라스에 생화가 가득해서 유럽 정원에 온 것 같아요. 햇살 들어올 때 사진 찍으면 인생샷 바로 나옵니다!',
    place_image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080',
    receipt_image_url: 'https://images.unsplash.com/photo-1554415707-9e4466b88588?w=800',
    consent_ai_usage: true,
    verification_status: 'APPROVED',
    reward_paid: true,
    reward_amount: 1000,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date().toISOString(),
    verification_data: {
      isValid: true,
      receiptData: {
        isValidReceipt: true,
        storeName: '앤틱 앤 플라워 망원',
        transactionDate: '2026-10-22',
        totalAmount: 22000,
        confidence: 0.96,
      },
      placePhotoAnalysis: {
        isOriginalPhoto: true,
        detectedSubjects: ['정원 테라스', '꽃병', '원목 의자'],
        visualQualityScore: 0.93,
        isCommercialAtmosphere: true,
      },
      matchedStoreName: true,
      earnedPoints: 1000,
    },
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'APPROVED';

    const { data: dbData, error } = await supabaseAdmin
      .from('submissions')
      .select('*, render:renders(*)')
      .eq('verification_status', status)
      .order('created_at', { ascending: false });

    if (error || !dbData || dbData.length === 0) {
      // Supabase 테이블이 아직 비어있거나 미연결 시 데모 데이터 제공
      return NextResponse.json({ submissions: DEMO_SUBMISSIONS });
    }

    return NextResponse.json({ submissions: dbData });
  } catch (error: any) {
    console.warn('[Submissions Fetch Warning] Serving demo fallback:', error);
    return NextResponse.json({ submissions: DEMO_SUBMISSIONS });
  }
}
