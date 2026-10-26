import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyReceiptAndPlaceImage } from '@/lib/gemini/verify-receipt-place';
import { registerReceiptFingerprint } from '@/lib/receipt-store';

export const runtime = 'nodejs';
export const maxDuration = 60;

// 리워드 지급 단가
const PHOTO_UNIT_REWARD = 2; // 사진 1장당 2원
const VIDEO_UNIT_REWARD = 3; // 영상 1개당 3원

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const placeName = formData.get('placeName') as string;
    const reviewText = formData.get('reviewText') as string;
    const consentAiUsage = formData.get('consentAiUsage') === 'true';
    const userId = (formData.get('userId') as string) || 'demo-user-123';

    const receiptImage = formData.get('receiptImage') as File | null;
    const photos = formData.getAll('photos') as File[];
    const videos = formData.getAll('videos') as File[];

    // 1. 필수 검증
    if (!placeName || !reviewText || !receiptImage) {
      return NextResponse.json(
        { error: '장소명, 솔직 후기, 결제 영수증은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    if (photos.length === 0 && videos.length === 0) {
      return NextResponse.json(
        { error: '사진(장당 2원) 또는 동영상(개당 3원)을 최소 1개 이상 업로드해 주세요.' },
        { status: 400 }
      );
    }

    if (!consentAiUsage) {
      return NextResponse.json(
        { error: '콘텐츠 2차 활용 및 AI 가상 체험 동의에 체크해야 제출이 가능합니다.' },
        { status: 400 }
      );
    }

    // 2. 리워드 금액 계산 (사진 장당 2원, 영상 개당 3원)
    const photoCount = photos.length;
    const videoCount = videos.length;
    const totalCalculatedReward = (photoCount * PHOTO_UNIT_REWARD) + (videoCount * VIDEO_UNIT_REWARD);

    // 3. 대표 이미지 선정 (AI 검증용: 첫 번째 사진 또는 기본 썸네일)
    let placeBase64 = '';
    let placeMimeType = 'image/jpeg';

    if (photoCount > 0) {
      const firstPhoto = photos[0];
      const buffer = Buffer.from(await firstPhoto.arrayBuffer());
      placeBase64 = buffer.toString('base64');
      placeMimeType = firstPhoto.type || 'image/jpeg';
    } else {
      // 사진이 없고 영상만 있을 경우 기본 캡처/샘플 전달
      placeBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }

    const receiptBuffer = Buffer.from(await receiptImage.arrayBuffer());
    const receiptBase64 = receiptBuffer.toString('base64');

    // 4. Gemini Vision API 2중 검증 실행
    const verification = await verifyReceiptAndPlaceImage({
      placeName,
      receiptBase64,
      receiptMimeType: receiptImage.type,
      placeBase64,
      placeMimeType,
    });

    const isApproved = verification.isValid;
    const rewardToPay = isApproved ? totalCalculatedReward : 0;

    // 5. Supabase submissions 테이블 기록
    const timestamp = Date.now();
    let submissionRecordId = `sub_${timestamp}`;

    try {
      const { data: insertedSub } = await supabaseAdmin
        .from('submissions')
        .insert({
          user_id: userId.startsWith('demo-') ? null : userId,
          place_name: placeName,
          review_text: reviewText,
          place_image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1080',
          receipt_image_url: 'https://images.unsplash.com/photo-1554415707-9e4466b88588?w=800',
          consent_ai_usage: consentAiUsage,
          verification_status: isApproved ? 'APPROVED' : 'REJECTED',
          verification_data: {
            ...verification,
            photoCount,
            videoCount,
            rewardCalculation: {
              photoReward: photoCount * PHOTO_UNIT_REWARD,
              videoReward: videoCount * VIDEO_UNIT_REWARD,
              totalReward: rewardToPay,
            },
          },
          rejection_reason: isApproved ? null : verification.rejectionReason,
          reward_paid: isApproved,
          reward_amount: rewardToPay,
        })
        .select()
        .single();

      if (insertedSub) {
        submissionRecordId = insertedSub.id;
      }

      // 6. 승인 시 유저 포인트 적립 (+N원)
      if (isApproved && !userId.startsWith('demo-')) {
        const { data: userProfile } = await supabaseAdmin
          .from('profiles')
          .select('points')
          .eq('id', userId)
          .single();

        const currentPoints = userProfile?.points || 0;
        await supabaseAdmin
          .from('profiles')
          .update({ points: currentPoints + rewardToPay })
          .eq('id', userId);

        await supabaseAdmin.from('point_transactions').insert({
          user_id: userId,
          submission_id: submissionRecordId,
          amount: rewardToPay,
          description: `장소 인증: ${placeName} (사진 ${photoCount}장×2원 + 영상 ${videoCount}개×3원 = ${rewardToPay}원)`,
        });
      }
    } catch (dbError) {
      console.warn('[Supabase DB Warning]:', dbError);
    }

    if (isApproved) {
      // 2번: 승인된 영수증 지문(Fingerprint) DB에 등록하여 재탕 방지
      if (verification.receiptData.fingerprint) {
        registerReceiptFingerprint({
          fingerprint: verification.receiptData.fingerprint,
          storeName: verification.receiptData.storeName || placeName,
          businessNumber: verification.receiptData.businessNumber || '124-86-59281',
          approvalNumber: verification.receiptData.approvalNumber || '73910482',
          transactionDate: verification.receiptData.transactionDate || new Date().toISOString(),
          totalAmount: verification.receiptData.totalAmount || 18500,
        });
      }

      return NextResponse.json({
        success: true,
        submissionId: submissionRecordId,
        verification,
        photoCount,
        videoCount,
        rewardAmount: rewardToPay,
        message: `축하합니다! 2중 검증이 통과되어 사진 ${photoCount}장(각 2원)과 영상 ${videoCount}개(각 3원)로 총 ${rewardToPay}원이 즉시 지급되었습니다!`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          submissionId: submissionRecordId,
          verification,
          error: verification.rejectionReason || '영수증 또는 사진 원본 인증에 실패하였습니다.',
        },
        { status: 422 }
      );
    }
  } catch (error: any) {
    console.error('[Upload & Verify API Error]:', error);
    return NextResponse.json(
      { error: error?.message || '서버 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
