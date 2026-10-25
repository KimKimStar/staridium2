import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateDoongleHookScript(params: {
  placeName: string;
  reviewText: string;
}): Promise<{
  hookLine: string;        // 3초 후킹 첫 마디 (영상 상단 노출용)
  bodyLine: string;        // 핵심 추천 포인트 (영상 하단 노출용)
  fullScript: string;      // 둥글이 전체 나레이션
}> {
  const { placeName, reviewText } = params;

  if (!apiKey || apiKey === 'AIzaSy...') {
    // API 키 미지정 시 따뜻하고 귀여운 기본 대본 반환
    return {
      hookLine: `둥글이가 찐 인정한 ${placeName}!`,
      bodyLine: `${reviewText.slice(0, 25)}... 여긴 무조건 가야 해!`,
      fullScript: `안녕! 나 둥글이야! 여기 ${placeName} 진짜 대박이지 않아? ${reviewText.slice(0, 30)} 완전 추천할게, 꼭 가봐!`,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
당신은 숏폼 AI 방송국의 귀엽고 통통한 아기 캐릭터 '둥글이'의 숏폼 전문 카피라이터입니다.
유저가 직접 다녀온 장소와 생생한 후기를 바탕으로, 인스타그램 릴스/유튜브 쇼츠에서 첫 3초 만에 시청자의 시선을 사로잡는 강력한 후킹 대사와 자막 문구를 작성해 주세요.

[장소 정보]
- 장소명: "${placeName}"
- 유저 실제 후기: "${reviewText}"

[캐릭터 톤앤매너]
- 화자: 세상의 모든 핫플을 탐험하는 아기 캐릭터 '둥글이'
- 말투: "~했둥!", "~라구!", "~야!", "헤헤", 발랄하고 호기심 넘치며 신뢰감을 주는 귀여운 말투
- 길이: 숏폼 영상(약 5초 내외)에 맞춰 간결하고 임팩트 있는 문장

[출력 요구사항 (반드시 JSON 형식만 반환)]
{
  "hookLine": "영상 상단에 큼직하게 띄울 3초 후킹 헤드라인 (15자 이내, 예: '연남동 숨은 버터바 성지 발견했둥!')",
  "bodyLine": "영상 하단에 표시할 핵심 후기 자막 (20자 이내, 예: '한 입 먹자마자 사르르 녹아내려요')",
  "fullScript": "둥글이의 귀여운 1인칭 전체 나레이션 대사 (40자 내외)"
}
    `.trim();

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    const cleanJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanJson);
    return {
      hookLine: parsed.hookLine || `둥글이 PICK! ${placeName}`,
      bodyLine: parsed.bodyLine || `리얼 후기: ${reviewText.slice(0, 20)}`,
      fullScript: parsed.fullScript || `안녕 난 둥글이야! ${placeName}에 다녀왔둥!`,
    };
  } catch (error) {
    console.error('[Gemini 숏폼 후킹 카피 생성 에러]:', error);
    return {
      hookLine: `둥글이의 핫플 탐험: ${placeName}`,
      bodyLine: reviewText.slice(0, 22),
      fullScript: `오늘 둥글이가 추천하는 핫플레이스 ${placeName}!`,
    };
  }
}
