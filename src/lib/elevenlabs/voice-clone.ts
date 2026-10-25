import fs from 'fs';
import path from 'path';

export interface DoongleVoiceCloneOptions {
  text: string;                  // Gemini가 생성한 3초 훅 대사 또는 유저 1줄 리뷰
  voiceSamplePath?: string;      // 둥글이 아기 목소리 오디오 샘플 경로 (기본: assets/doongle_voice.mp3)
  apiKey?: string;
  stability?: number;            // 0.0 ~ 1.0 (아기 목소리 특유의 감정 기복과 생동감 표현을 위해 0.35 권장)
  similarityBoost?: number;      // 0.0 ~ 1.0 (샘플 목소리와의 유사도 0.85 권장)
  saveToDisk?: boolean;          // 생성된 둥글이 음성을 로컬 파일로 저장할지 여부
}

export interface VoiceCloneResult {
  success: boolean;
  audioBuffer?: Buffer;
  audioUrl?: string;
  savedFilePath?: string;
  durationSeconds?: number;
  voiceId?: string;
  isMockFallback?: boolean;
  error?: string;
}

const DEFAULT_SAMPLE_PATH = path.join(process.cwd(), 'assets', 'doongle_voice.mp3');

/**
 * 둥글이 아기 목소리 기반 Instant Voice Cloning & 3초 훅 대사 TTS 합성 엔진
 */
export async function generateDoongleClonedSpeech(
  options: DoongleVoiceCloneOptions
): Promise<VoiceCloneResult> {
  const apiKey = options.apiKey || process.env.ELEVENLABS_API_KEY;
  const samplePath = options.voiceSamplePath || DEFAULT_SAMPLE_PATH;
  const targetText = options.text.trim();

  if (!targetText) {
    throw new Error('TTS로 변환할 텍스트 대본이 비어 있습니다.');
  }

  // 1. ElevenLabs API Key가 설정된 실제 운영 환경
  if (apiKey && apiKey !== 'mock-elevenlabs-key') {
    try {
      // 1-1. 둥글이 보이스 ID 확인 또는 즉석 클로닝 (Instant Voice Clone)
      let voiceId = process.env.DOONGLE_VOICE_ID;

      if (!voiceId) {
        if (!fs.existsSync(samplePath)) {
          throw new Error(`둥글이 오디오 샘플 파일을 찾을 수 없습니다: ${samplePath}`);
        }

        // ElevenLabs에 둥글이 아기 목소리 샘플 등록
        const formData = new FormData();
        formData.append('name', 'Doongle_Baby_Voice');
        formData.append('description', '귀엽고 통통 튀는 둥글이 캐릭터 아기 목소리 샘플');
        
        const audioBlob = new Blob([fs.readFileSync(samplePath)], { type: 'audio/mpeg' });
        formData.append('files', audioBlob, 'doongle_voice.mp3');

        const cloneRes = await fetch('https://api.elevenlabs.io/v1/voices/add', {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
          },
          body: formData,
        });

        if (!cloneRes.ok) {
          const errData = await cloneRes.json().catch(() => ({}));
          console.warn('ElevenLabs Voice Clone 등록 실패, 폴백 사용:', errData);
          throw new Error(`Voice Clone 실패: ${JSON.stringify(errData)}`);
        }

        const cloneData = await cloneRes.json();
        voiceId = cloneData.voice_id;
      }

      // 1-2. 복제된 둥글이 목소리로 3초 훅 대사 TTS 생성
      const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: targetText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: options.stability ?? 0.35,
            similarity_boost: options.similarityBoost ?? 0.85,
            style: 0.55,
            use_speaker_boost: true,
          },
        }),
      });

      if (!ttsRes.ok) {
        throw new Error(`ElevenLabs TTS 생성 오류: HTTP ${ttsRes.status}`);
      }

      const arrayBuffer = await ttsRes.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      let savedFilePath: string | undefined = undefined;
      if (options.saveToDisk) {
        const outDir = path.join(process.cwd(), 'public', 'audio', 'saved_doongle_scripts');
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }
        const safeName = `doongle_${Date.now()}_${targetText.slice(0, 10).replace(/[^a-zA-Z0-9가-힣]/g, '_')}.mp3`;
        savedFilePath = path.join(outDir, safeName);
        fs.writeFileSync(savedFilePath, audioBuffer);
      }

      return {
        success: true,
        audioBuffer,
        savedFilePath,
        voiceId,
        isMockFallback: false,
      };
    } catch (err: any) {
      console.warn('ElevenLabs API 연동 중 오류 발생 -> 둥글이 원본 오디오 샘플 폴백 활성화:', err.message);
    }
  }

  // 2. API Key 미설정 / 로컬 테스트 환경 -> 둥글이 실제 아기 목소리 원본 음원 폴백 제공
  if (fs.existsSync(samplePath)) {
    const audioBuffer = fs.readFileSync(samplePath);
    return {
      success: true,
      audioBuffer,
      audioUrl: '/assets/doongle_voice.mp3',
      voiceId: 'doongle-original-sample-clone',
      isMockFallback: true,
    };
  }

  return {
    success: false,
    error: '둥글이 목소리 오디오 샘플 파일을 찾을 수 없습니다.',
  };
}
