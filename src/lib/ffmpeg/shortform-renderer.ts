import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface RenderOptions {
  placeImagePath: string;      // 유저 업로드 장소 사진 파일 경로
  greenscreenVideoPath: string; // 둥글이 그린스크린 영상 파일 경로
  hookText: string;            // 상단 3초 후킹 대사
  bodyText: string;            // 하단 보조 후기 대사
  outputPath: string;          // 결과물 저장 경로 (1080x1920 MP4)
  durationSeconds?: number;    // 기본 5초
}

/**
 * Windows / Linux 시스템 폰트 경로 감지
 */
function getKoreanFontPath(): string {
  if (process.platform === 'win32') {
    const winFont = 'C:/Windows/Fonts/malgunbd.ttf';
    if (fs.existsSync(winFont)) {
      // FFmpeg drawtext 옵션용 콜론/슬래시 이스케이프
      return 'C\\\\:/Windows/Fonts/malgunbd.ttf';
    }
    const regularWinFont = 'C:/Windows/Fonts/malgun.ttf';
    if (fs.existsSync(regularWinFont)) {
      return 'C\\\\:/Windows/Fonts/malgun.ttf';
    }
  }
  return 'Arial';
}

/**
 * FFmpeg 실행 바이너리 확인 (PATH 또는 환경변수)
 */
function getFFmpegCommand(): string {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  return 'ffmpeg';
}

/**
 * 유저 사진 위에서 크로마키 제거된 둥글이가 '와! 맛있겠다!'라며 통통 뛰어다니는 숏폼 렌더링
 */
export async function renderDoongleRunningOnFoodShortForm(options: {
  placeImagePath: string;
  hookText?: string;
  bodyText?: string;
  outputPath: string;
  durationSeconds?: number;
}): Promise<{
  success: boolean;
  outputPath?: string;
  error?: string;
}> {
  const {
    placeImagePath,
    hookText = '와! 맛있겠다! 둥글이가 찾아온 찐맛집 ✨',
    bodyText = '겉바속촉 한 입에 감탄 폭발! 저장 필수 코스',
    outputPath,
    durationSeconds = 5,
  } = options;

  const fontPath = getKoreanFontPath();
  const ffmpegCmd = getFFmpegCommand();

  // 사용자가 제공한 크로마키 투명화된 둥글이 캐릭터 경로
  const doongleCharPath = path.join(process.cwd(), 'public', 'assets', 'doongle_front.png');
  const safeHookText = hookText.replace(/[:\\']/g, '\\$&');
  const safeBodyText = bodyText.replace(/[:\\']/g, '\\$&');

  // 필터 그래프:
  // 1. 유저 음식/장소 사진(input 0): 1080x1920 세로 줌인 (Ken Burns)
  // 2. 투명 둥글이 캐릭터(input 1): 폭 420px로 리사이징
  // 3. 통통 튀며 좌우로 뛰어다니는 모션 공식:
  //    x = (W-w)/2 + 260*sin(t*3.2)  (좌우 달리기 왕복)
  //    y = H-h-180 - abs(75*sin(t*6.4)) (통통 점프 바운스)
  // 4. 둥글이 머리 위 '와! 맛있겠다!' 말풍선 자막 오버레이
  // 5. 상단 3초 훅 배너 + 하단 후기 자막
  const filterGraph = [
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.002,1.25)':d=${durationSeconds * 30}:s=1080x1920:fps=30[bg]`,
    `[1:v]scale=460:-1[doongle]`,
    `[bg][doongle]overlay=x='(W-w)/2 + 250*sin(t*3.2)':y='H-h-180 - abs(70*sin(t*6.4))'[with_running_doongle]`,
    // 상단 3초 후킹 대사 자막 (파스텔 옐로우 배너)
    `[with_running_doongle]drawtext=fontfile='${fontPath}':text='${safeHookText}':fontcolor=0x292524:fontsize=52:box=1:boxcolor=0xFDE047@0.92:boxborderw=24:x=(w-text_w)/2:y=240[with_hook]`,
    // 하단 후기 자막 (차콜 반투명 박스)
    `[with_hook]drawtext=fontfile='${fontPath}':text='${safeBodyText}':fontcolor=white:fontsize=40:box=1:boxcolor=0x1C1917@0.8:boxborderw=18:x=(w-text_w)/2:y=h-200[final_video]`
  ].join(';');

  const args = [
    '-y',
    '-loop', '1',
    '-t', `${durationSeconds}`,
    '-i', placeImagePath,
    '-loop', '1',
    '-t', `${durationSeconds}`,
    '-i', doongleCharPath,
    '-filter_complex', filterGraph,
    '-map', '[final_video]',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputPath,
  ];

  return new Promise((resolve) => {
    console.log(`[FFmpeg 둥글이 뛰어다니는 숏폼 렌더링]: ${ffmpegCmd} ${args.join(' ')}`);
    const proc = spawn(ffmpegCmd, args);
    let stderr = '';

    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve({ success: true, outputPath });
      } else {
        resolve({ success: false, error: stderr.slice(-300) });
      }
    });
    proc.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * 둥글이 그린스크린 크로마키 + 사진 줌인 + 자막 9:16 쇼츠 합성 렌더러
 */
export async function renderDoongleShortForm(options: RenderOptions): Promise<{
  success: boolean;
  outputPath?: string;
  error?: string;
}> {
  const {
    placeImagePath,
    greenscreenVideoPath,
    hookText,
    bodyText,
    outputPath,
    durationSeconds = 5,
  } = options;

  const fontPath = getKoreanFontPath();
  const ffmpegCmd = getFFmpegCommand();

  // 자막 텍스트 특수문자 이스케이프
  const safeHookText = hookText.replace(/[:\\']/g, '\\$&');
  const safeBodyText = bodyText.replace(/[:\\']/g, '\\$&');

  // FFmpeg 복합 필터 그래프 구성:
  // 1. 유저 사진(input 0): 1080x1920 세로 비율 크롭 후 Ken Burns 서서히 줌인(1.0x -> 1.25x)
  // 2. 둥글이 비디오(input 1): 크로마키로 초록색(#00FF00) 투명화 후 적절한 크기로 리사이즈
  // 3. 사진 위에 둥글이 하단 중앙 오버레이
  // 4. 상단 후킹 자막(노란 포인트 박스) + 하단 상세 자막(어두운 반투명 박스) 렌더링
  const filterGraph = [
    // [0:v] 정지 사진을 5초 동안 줌인 효과 적용
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0018,1.25)':d=${durationSeconds * 30}:s=1080x1920:fps=30[bg]`,
    
    // [1:v] 그린스크린 비디오 크로마키 제거 및 캐릭터 스케일링
    `[1:v]colorkey=0x00FF00:0.32:0.12,scale=720:-1[char]`,
    
    // 합성 (캐릭터를 하단 살짝 띄운 위치에 배치)
    `[bg][char]overlay=(W-w)/2:H-h-160[composite]`,
    
    // 상단 3초 후킹 대사 자막 (노란 테두리 + 크림 박스)
    `[composite]drawtext=fontfile='${fontPath}':text='${safeHookText}':fontcolor=0x292524:fontsize=52:box=1:boxcolor=0xFDE047@0.9:boxborderw=24:x=(w-text_w)/2:y=240[with_hook]`,
    
    // 하단 감성 후기 자막 (반투명 차콜 박스 + 화이트 텍스트)
    `[with_hook]drawtext=fontfile='${fontPath}':text='${safeBodyText}':fontcolor=white:fontsize=42:box=1:boxcolor=0x1C1917@0.75:boxborderw=18:x=(w-text_w)/2:y=h-220[final_video]`
  ].join(';');

  const args = [
    '-y',                               // 덮어쓰기
    '-loop', '1',                       // 이미지 루프
    '-t', `${durationSeconds}`,         // 재생 시간
    '-i', placeImagePath,               // 입력 0: 유저 장소 사진
    '-stream_loop', '-1',               // 둥글이 영상 반복 루프
    '-t', `${durationSeconds}`,
    '-i', greenscreenVideoPath,         // 입력 1: 둥글이 그린스크린 영상
    '-filter_complex', filterGraph,
    '-map', '[final_video]',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputPath,
  ];

  return new Promise((resolve) => {
    console.log(`[FFmpeg 숏폼 렌더링 시작]: ${ffmpegCmd} ${args.join(' ')}`);

    const proc = spawn(ffmpegCmd, args);
    let stderr = '';

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`[FFmpeg 렌더링 성공]: ${outputPath}`);
        resolve({ success: true, outputPath });
      } else {
        console.error(`[FFmpeg 렌더링 실패 exit code ${code}]:`, stderr);
        // 시스템에 FFmpeg가 설치되어 있지 않거나 경로 에러 발생 시 개발 모드 안전 폴백 처리
        resolve({
          success: false,
          error: `FFmpeg 실행 중 오류가 발생했습니다. (Exit code: ${code}). FFmpeg 설치 여부를 확인해 주세요. 상세: ${stderr.slice(-300)}`,
        });
      }
    });

    proc.on('error', (err) => {
      console.error('[FFmpeg 프로세스 생성 에러]:', err);
      resolve({
        success: false,
        error: `FFmpeg 바이너리를 실행할 수 없습니다: ${err.message}. 시스템에 FFmpeg가 설치되어 있고 PATH에 추가되어 있는지 확인하세요.`,
      });
    });
  });
}

/**
 * AI 모션 스왑 영상 위에 '3초 훅 텍스트' 자막을 9:16 비율로 오버레이 편집
 */
export async function overlayHookSubtitleOnVideo(options: {
  inputVideoPath: string;
  hookText: string;
  outputPath: string;
}): Promise<{
  success: boolean;
  outputPath?: string;
  error?: string;
}> {
  const { inputVideoPath, hookText, outputPath } = options;
  const fontPath = getKoreanFontPath();
  const ffmpegCmd = getFFmpegCommand();
  const safeHookText = hookText.replace(/[:\\']/g, '\\$&');

  // 필터:
  // 1. 영상을 9:16 (1080x1920) 규격으로 맞춤 (비율 유지 확대 후 센터 크롭)
  // 2. 상단에 큼직한 파스텔 옐로우 포인트 박스와 함께 3초 훅 자막 오버레이 (drawtext)
  const filterGraph = [
    `scale=1080:1920:force_original_aspect_ratio=increase`,
    `crop=1080:1920`,
    `drawtext=fontfile='${fontPath}':text='${safeHookText}':fontcolor=0x292524:fontsize=54:box=1:boxcolor=0xFDE047@0.92:boxborderw=26:x=(w-text_w)/2:y=240`
  ].join(',');

  const args = [
    '-y',
    '-i', inputVideoPath,
    '-vf', filterGraph,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-movflags', '+faststart',
    outputPath,
  ];

  return new Promise((resolve) => {
    console.log(`[FFmpeg 3초 훅 자막 오버레이 시작]: ${ffmpegCmd} ${args.join(' ')}`);

    const proc = spawn(ffmpegCmd, args);
    let stderr = '';

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        console.log(`[FFmpeg 모션 스왑 자막 오버레이 완료]: ${outputPath}`);
        resolve({ success: true, outputPath });
      } else {
        console.warn(`[FFmpeg 자막 오버레이 실패 code ${code}]:`, stderr);
        // 시스템에 FFmpeg가 없거나 실패 시 원본 비디오를 그대로 활용할 수 있도록 안전 폴백
        resolve({
          success: false,
          error: `FFmpeg 자막 편집 중 오류가 발생했습니다: ${stderr.slice(-200)}`,
        });
      }
    });

    proc.on('error', (err) => {
      console.warn('[FFmpeg 프로세스 에러]:', err);
      resolve({
        success: false,
        error: `FFmpeg를 실행할 수 없습니다: ${err.message}`,
      });
    });
  });
}

