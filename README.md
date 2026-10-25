# 👶 둥글이 스튜디오 (Doongle AI Studio)
> **1인 AI 방송국 SaaS**: 유저 방문 인증 2중 리워드 & 아기 캐릭터 '둥글이' AI 체험형 숏폼 자동 제작 플랫폼

---

## 🌟 프로젝트 개요
손님이 직접 방문한 장소의 사진과 영수증을 올리면 **Gemini Vision 2중 검증**을 통해 즉시 리워드(1,000P)를 지급하고, 관리자(사장님/크리에이터)는 이 소스를 활용해 전용 아기 캐릭터 **'둥글이'가 등장하는 Ken Burns 줌인 + 크로마키 합성 9:16 숏폼 영상**을 1초 만에 렌더링하는 풀스택 SaaS입니다.

---

## 🛠️ 기술 스택
- **프론트엔드**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS (따뜻한 아이보리 & 파스텔 옐로우 감성 테마)
- **AI 엔진**:
  - **Google Gemini 1.5 Flash (Vision)**: 영수증 날짜/상호명 판독 + 직접 촬영 원본성(불펌/화면 캡처 판별) 2중 검증
  - **Google Gemini 1.5 Flash (Text)**: 유저 실제 후기를 분석해 3초 만에 시선을 사로잡는 숏폼 후킹 대사 & 자막 자동 생성
- **비디오 렌더링 & AI 모션 엔진**:
  - **Replicate API (AnimateAnyone / Kling / Pose Transfer)**: 원본 숏폼 비디오의 모션 뼈대와 타이밍을 추적해 유저 캐릭터 이미지에 동작을 전이
  - **Node.js & FFmpeg**: Ken Burns 줌인 + 크로마키 합성 + '3초 훅 텍스트' 배너 자막 자동 오버레이 편집 (9:16 Shorts)
- **백엔드 & 데이터베이스**: **Supabase** (PostgreSQL, Row Level Security, Storage 버킷)
- **비즈니스 모델 & 결제**: **Stripe** (사장님 전용 월 9,900원 Pro 정기구독 결제창 & Webhook 동기화, Pro 권한 제어)

---

## 📂 전체 디렉토리 구조
```text
4_둥글이_AI체험숏폼_SaaS/
├── package.json                          # 의존성 패키지 정의
├── tsconfig.json                         # TypeScript 컴파일러 설정
├── tailwind.config.ts                    # 아이보리/파스텔 옐로우 톤 팔레트 정의
├── postcss.config.mjs
├── next.config.mjs                       # fluent-ffmpeg 외부 번들 설정
├── .env.example                          # 환경변수 템플릿
├── README.md                             # 상세 실행 가이드
├── supabase/
│   └── schema.sql                        # Supabase DDL (테이블, 트리거, RLS, Storage 정책)
├── public/
│   └── assets/
│       └── sample_greenscreen.mp4        # 둥글이 그린스크린 원본 영상 배치 경로
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # 글로벌 레이아웃 & 테마
│   │   ├── page.tsx                      # 메인 랜딩 & 3단계 파이프라인 소개
│   │   ├── globals.css                   # 글로벌 Tailwind 스타일
│   │   ├── upload/page.tsx               # [1] 유저 업로드 & 2중 검증 리워드 페이지
│   │   ├── admin/page.tsx                # [2] 관리자 숏폼 렌더링 스튜디오
│   │   ├── pricing/page.tsx              # [3] 사장님 Pro 월 9,900원 구독 페이지
│   │   └── api/
│   │       ├── upload-and-verify/route.ts # Gemini 2중 검증 & 포인트 지급 API
│   │       ├── submissions/route.ts       # 승인된 장소 소스 목록 조회 API
│   │       ├── render-short/route.ts      # Gemini 후킹 카피 + FFmpeg 숏폼 합성 API
│   │       ├── stripe/
│   │       │   ├── checkout/route.ts     # Stripe 월 9,900원 Checkout 세션 생성 API
│   │       │   └── webhook/route.ts      # Stripe Webhook 이벤트 동기화 핸들러
│   │       └── user/points/route.ts       # 유저 포인트 조회 API
│   ├── components/
│   │   ├── Navbar.tsx                     # 감성 상단 네비게이션 & 실시간 포인트 배지
│   │   ├── UploadForm.tsx                 # 모바일 친화 2중 업로드 & 검증 피드백 폼
│   │   ├── AdminGallery.tsx               # 관리자 장소 소스 갤러리 & [둥글이 숏폼 렌더링]
│   │   ├── VideoPlayerModal.tsx           # 9:16 모바일 세로 숏폼 플레이어 & 다운로드
│   │   └── PricingCard.tsx                # 월 9,900원 Pro 구독 플랜 결제 연동 카드
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                  # 브라우저용 Supabase 클라이언트
│   │   │   └── server.ts                  # 백엔드 Service Role Supabase 인스턴스
│   │   ├── gemini/
│   │   │   ├── verify-receipt-place.ts    # Gemini Vision 2중 검증 엔진
│   │   │   └── generate-hook.ts           # Gemini 3초 후킹 대본 & 자막 생성기
│   │   ├── ffmpeg/
│   │   │   └── shortform-renderer.ts      # Ken Burns + 크로마키 + drawtext FFmpeg 렌더러
│   │   └── stripe/
│   │       └── stripe.ts                  # Stripe SDK 인스턴스 및 Pro 구독 접근제어 가드
│   └── types/
│       └── index.ts                       # 공통 TypeScript 인터페이스
```

---

## 🚀 빠른 시작 가이드 (Quick Start)

### 1. 패키지 설치
```bash
cd "4_둥글이_AI체험숏폼_SaaS"
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 복사하여 `.env.local`을 생성하고 키를 입력합니다:
```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Google Gemini API
GEMINI_API_KEY="AIzaSy..."

# Stripe 결제
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
*(※ 키가 없어도 시뮬레이션 데모 모드가 내장되어 있어 기본 화면과 동작을 즉시 체험하실 수 있습니다.)*

### 3. Supabase DB 마이그레이션
Supabase 대시보드 **SQL Editor**에 `supabase/schema.sql` 내용을 복사하여 실행합니다:
- `profiles`, `submissions`, `point_transactions`, `renders`, `subscriptions` 테이블 생성
- 신규 유저 생성 트리거 및 Row Level Security (RLS) 정책 자동 구성
- Storage 대시보드에서 `submissions`, `renders` 버킷을 생성합니다.

### 4. FFmpeg 설치 (비디오 렌더링용)
- **Windows**: `winget install Gyan.FFmpeg` 또는 공식 홈페이지에서 다운로드 후 시스템 환경변수 `PATH`에 등록
- **Mac**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`

### 5. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속!
