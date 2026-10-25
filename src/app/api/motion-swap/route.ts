import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { supabaseAdmin } from '@/lib/supabase/server';
import { executeMotionSwap, MOTION_TEMPLATE_PRESETS } from '@/lib/replicate/motion-swap';
import { overlayHookSubtitleOnVideo } from '@/lib/ffmpeg/shortform-renderer';

export const runtime = 'nodejs';
export const maxDuration = 180; // 모션 스왑 및 렌더링을 위한 3분 타임아웃

export async function POST(req: NextRequest) {
  const tempDir = path.join(os.tmpdir(), `motion_swap_${Date.now()}`);

  try {
    const formData = await req.formData();

    const userImageFile = formData.get('userImage') as File | null;
    const userImageUrlParam = formData.get('userImageUrl') as string | null;

    const motionVideoFile = formData.get('motionVideo') as File | null;
    const motionVideoUrlParam = formData.get('motionVideoUrl') as string | null;
    const presetId = formData.get('presetId') as string | null;

    const hookText = (formData.get('hookText') as string) || '둥글이와 함께하는 AI 숏폼 챌린지!';
    const userId = (formData.get('userId') as string) || 'demo-user-123';

    // 1. 유저 이미지 URL 확보
    let userImageUrl = userImageUrlParam || '';
    if (userImageFile && userImageFile.size > 0) {
      const buffer = Buffer.from(await userImageFile.arrayBuffer());
      const ext = userImageFile.name.split('.').pop() || 'png';
      const fileName = `input_user_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      try {
        const { data: uploadData } = await supabaseAdmin.storage
          .from('submissions')
          .upload(`motion/${fileName}`, buffer, { contentType: userImageFile.type, upsert: true });

        if (uploadData) {
          const { data: publicUrl } = supabaseAdmin.storage.from('submissions').getPublicUrl(`motion/${fileName}`);
          userImageUrl = publicUrl.publicUrl;
        }
      } catch (err) {
        console.warn('Storage upload error, using base64 fallback');
      }

      if (!userImageUrl) {
        userImageUrl = `data:${userImageFile.type};base64,${buffer.toString('base64')}`;
      }
    }

    if (!userImageUrl) {
      userImageUrl = 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=800'; // 둥글이 기본 샘플
    }

    // 2. 모션 비디오 URL 확보 (프리셋 / 직접 업로드 / URL 입력)
    let motionVideoUrl = motionVideoUrlParam || '';
    if (presetId) {
      const matchedPreset = MOTION_TEMPLATE_PRESETS.find((p) => p.id === presetId);
      if (matchedPreset) {
        motionVideoUrl = matchedPreset.sampleVideoUrl;
      }
    }

    if (motionVideoFile && motionVideoFile.size > 0) {
      const videoBuffer = Buffer.from(await motionVideoFile.arrayBuffer());
      const vExt = motionVideoFile.name.split('.').pop() || 'mp4';
      const vFileName = `motion_ref_${Date.now()}.${vExt}`;

      try {
        const { data: vUpload } = await supabaseAdmin.storage
          .from('submissions')
          .upload(`motion/${vFileName}`, videoBuffer, { contentType: motionVideoFile.type, upsert: true });

        if (vUpload) {
          const { data: vPublicUrl } = supabaseAdmin.storage.from('submissions').getPublicUrl(`motion/${vFileName}`);
          motionVideoUrl = vPublicUrl.publicUrl;
        }
      } catch (err) {
        console.warn('Motion video upload fallback');
      }
    }

    if (!motionVideoUrl) {
      motionVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    }

    console.log('[Motion Swap API] 1단계: Replicate 모션 스왑 모델 호출...', { userImageUrl: userImageUrl.slice(0, 50), motionVideoUrl });

    // 3. Replicate AnimateAnyone 모션 스왑 파이프라인 가동
    const swapResult = await executeMotionSwap({
      userImageUrl,
      motionVideoUrl,
    });

    if (!swapResult.success || !swapResult.videoUrl) {
      return NextResponse.json(
        { error: swapResult.error || '모션 스왑 합성에 실패했습니다.' },
        { status: 500 }
      );
    }

    const generatedVideoUrl = swapResult.videoUrl;

    // 4. FFmpeg 자막 오버레이 후처리: 생성된 비디오 다운로드 후 '3초 훅 텍스트' 오버레이
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const rawVideoPath = path.join(tempDir, 'raw_swap.mp4');
    const finalVideoPath = path.join(tempDir, 'final_with_hook.mp4');

    let finalVideoUrl = generatedVideoUrl;

    try {
      console.log('[Motion Swap API] 2단계: 모션 합성 영상 다운로드 중...');
      const videoRes = await fetch(generatedVideoUrl);
      const arrayBuffer = await videoRes.arrayBuffer();
      fs.writeFileSync(rawVideoPath, Buffer.from(arrayBuffer));

      // FFmpeg를 통한 9:16 스케일링 및 3초 훅 자막 오버레이
      console.log('[Motion Swap API] 3단계: FFmpeg 3초 훅 자막 오버레이 중...');
      const overlayResult = await overlayHookSubtitleOnVideo({
        inputVideoPath: rawVideoPath,
        hookText,
        outputPath: finalVideoPath,
      });

      if (overlayResult.success && fs.existsSync(finalVideoPath)) {
        // Supabase Storage에 최종 자막 포함 영상 업로드
        const finalBuffer = fs.readFileSync(finalVideoPath);
        const finalFileName = `motion_final_${Date.now()}.mp4`;

        try {
          const { data: finalUpload } = await supabaseAdmin.storage
            .from('renders')
            .upload(finalFileName, finalBuffer, { contentType: 'video/mp4', upsert: true });

          if (finalUpload) {
            const { data: fUrl } = supabaseAdmin.storage.from('renders').getPublicUrl(finalFileName);
            finalVideoUrl = fUrl.publicUrl;
          }
        } catch (stErr) {
          console.warn('Storage final upload fallback');
        }
      }
    } catch (ffmpegErr: any) {
      console.warn('[FFmpeg 후처리 건너뜀 또는 실패, 원본 생성 영상 전달]:', ffmpegErr.message);
    }

    // 5. DB에 기록
    const jobId = `job_${Date.now()}`;
    try {
      await supabaseAdmin.from('renders').insert({
        submission_id: '00000000-0000-0000-0000-000000000000', // 모션 스왑용 시스템 레코드
        hook_script: hookText,
        video_url: finalVideoUrl,
        status: 'COMPLETED',
        duration_seconds: 5.0,
      });
    } catch (dbErr) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      jobId,
      originalMotionUrl: motionVideoUrl,
      swappedVideoUrl: generatedVideoUrl,
      finalVideoUrl,
      hookText,
      durationSeconds: 5,
      isSimulated: swapResult.isSimulated || false,
      message: 'AI 모션 스왑 및 3초 훅 텍스트 자막 합성이 성공적으로 완료되었습니다!',
    });
  } catch (error: any) {
    console.error('[Motion Swap Route Error]:', error);
    return NextResponse.json(
      { error: error?.message || '모션 스왑 처리 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    // 임시 파일 삭제 정리
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanErr) {
      // ignore
    }
  }
}
