import Replicate from 'replicate';
import { MotionTemplatePreset } from '@/types';

const replicateApiToken = process.env.REPLICATE_API_TOKEN || '';

export const replicate = new Replicate({
  auth: replicateApiToken,
});

// 제공되는 인기 숏폼 모션 템플릿 프리셋 4종
export const MOTION_TEMPLATE_PRESETS: MotionTemplatePreset[] = [
  {
    id: 'dance-challenge',
    title: '🔥 바이럴 챌린지 댄스 모션',
    description: '틱톡과 릴스에서 가장 유행하는 통통 튀는 15초 바이럴 안무 모션 뼈대',
    duration: '5초',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600',
    sampleVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    recommendedHookText: '이 댄스 챌린지 둥글이가 완벽 접수했둥! ✨',
  },
  {
    id: 'cute-greeting',
    title: '👶 둥글이 시그니처 앙증 인사',
    description: '손을 살랑살랑 흔들며 고개를 갸웃거리는 둥글이 전용 인사 리액션 모션',
    duration: '5초',
    thumbnailUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=600',
    sampleVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    recommendedHookText: '안녕! 오늘 내가 소개할 대박 핫플은 어디게? 💖',
  },
  {
    id: 'mukbang-reaction',
    title: '🍰 동공지진 리얼 감탄 먹방',
    description: '한 입 먹자마자 눈이 커지며 발을 동동 구르는 숏폼 리얼 맛집 리액션',
    duration: '5초',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
    sampleVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    recommendedHookText: '한 입 먹자마자 기절각! 여긴 진짜 찐이야~ 🥐',
  },
  {
    id: 'store-tour',
    title: '🚶‍♂️ 공간 워킹 & 손짓 안내',
    description: '매장 인테리어를 천천히 걸어가며 손짓으로 포인트를 짚어주는 인트로 모션',
    duration: '6초',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
    sampleVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    recommendedHookText: '사장님도 몰래 숨겨둔 우리 가게 비밀 스팟 공개! 🚪',
  },
];

/**
 * Replicate AnimateAnyone / LivePortrait 모션 스왑 모델 실행
 */
export async function executeMotionSwap({
  userImageUrl,
  motionVideoUrl,
}: {
  userImageUrl: string;
  motionVideoUrl: string;
}): Promise<{
  success: boolean;
  videoUrl?: string;
  isSimulated?: boolean;
  error?: string;
}> {
  // 1. REPLICATE_API_TOKEN 미등록 시 스마트 시뮬레이션 모드 작동
  if (!replicateApiToken || replicateApiToken.startsWith('r8_...')) {
    console.warn('[Replicate] REPLICATE_API_TOKEN이 설정되지 않아 모의 모션 스왑 파이프라인으로 안전하게 구동합니다.');
    
    // 사실적인 렌더링 지연 시뮬레이션 (1.5초)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      success: true,
      videoUrl: motionVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      isSimulated: true,
    };
  }

  try {
    console.log('[Replicate] AnimateAnyone 모션 스왑 예측 생성 시작:', { userImageUrl, motionVideoUrl });

    // Replicate의 AnimateAnyone 또는 포즈 전이 모델 실행
    // 공식 모델 식별자: lucataco/animate-anyone
    const output = await replicate.run(
      'lucataco/animate-anyone:225c404c05f77fe7159ffddfcf4ffc7ddf4d6d7c71d6f51950e303d8d0c07c2c' as any,
      {
        input: {
          image: userImageUrl,
          video: motionVideoUrl,
          steps: 25,
          guidance_scale: 3.5,
        },
      }
    );

    // 결과물 URL 파싱 (일반적으로 mp4 파일 URL 문자열 또는 배열 반환)
    let resultVideoUrl = '';
    if (typeof output === 'string') {
      resultVideoUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      resultVideoUrl = String(output[0]);
    } else if (output && typeof output === 'object' && 'output' in output) {
      resultVideoUrl = String((output as any).output);
    }

    if (!resultVideoUrl) {
      throw new Error('Replicate 모델로부터 유효한 비디오 URL을 받지 못했습니다.');
    }

    return {
      success: true,
      videoUrl: resultVideoUrl,
      isSimulated: false,
    };
  } catch (error: any) {
    console.error('[Replicate 모션 스왑 실행 실패]:', error);
    // API 한도 초과나 네트워크 오류 시 안전 폴백
    return {
      success: true,
      videoUrl: motionVideoUrl,
      isSimulated: true,
      error: `실제 모델 호출 실패로 프리뷰 비디오로 대체되었습니다: ${error.message}`,
    };
  }
}
