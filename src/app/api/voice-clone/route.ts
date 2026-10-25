import { NextRequest, NextResponse } from 'next/server';
import { generateDoongleClonedSpeech } from '@/lib/elevenlabs/voice-clone';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voiceSamplePath, apiKey } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '합성할 3초 훅 대사 텍스트(text)가 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await generateDoongleClonedSpeech({
      text,
      voiceSamplePath,
      apiKey,
    });

    if (!result.success || !result.audioBuffer) {
      return NextResponse.json(
        { error: result.error || '둥글이 목소리 오디오 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // MP3 바이너리 오디오 스트림으로 직접 응답
    return new NextResponse(result.audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': result.audioBuffer.length.toString(),
        'X-Voice-ID': result.voiceId || 'doongle-clone',
        'X-Is-Fallback': result.isMockFallback ? 'true' : 'false',
      },
    });
  } catch (error: any) {
    console.error('둥글이 보이스 클로닝 API 오류:', error);
    return NextResponse.json(
      { error: error.message || '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
