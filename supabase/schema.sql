-- ==============================================================================
-- 둥글이 AI 방송국 Studio: Supabase DB 스키마 & 보안 정책 (RLS)
-- ==============================================================================

-- 1. UUID 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 프로필 테이블 (auth.users 연동 및 유저 리워드 포인트 관리)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nickname TEXT DEFAULT '방문탐험가',
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    points INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 신규 유저 생성 시 자동으로 profile 생성하는 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, role, points)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. 유저 장소 방문 및 영수증 제출 테이블 (submissions)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    place_name TEXT NOT NULL,
    review_text TEXT NOT NULL,
    place_image_url TEXT NOT NULL,
    receipt_image_url TEXT NOT NULL,
    consent_ai_usage BOOLEAN NOT NULL DEFAULT false,
    verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    verification_data JSONB, -- Gemini Vision 2중 검증 결과 (영수증 상호/일자/사진 원본성 신뢰도 점수 등)
    rejection_reason TEXT,
    reward_paid BOOLEAN DEFAULT false NOT NULL,
    reward_amount INTEGER DEFAULT 1000 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 포인트 지급 트랜잭션 기록 테이블 (point_transactions)
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. 관리자 둥글이 숏폼 렌더링 결과 테이블 (renders)
CREATE TABLE IF NOT EXISTS public.renders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    hook_script TEXT NOT NULL,          -- Gemini가 생성한 3초 후킹 대사
    video_url TEXT,                     -- FFmpeg로 렌더링된 최종 9:16 mp4 비디오 URL
    status TEXT DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    error_message TEXT,
    duration_seconds NUMERIC(4, 2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Stripe 월 9,900원 Pro 구독 테이블 (subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'trialing')),
    price_id TEXT,
    plan_tier TEXT DEFAULT 'pro_monthly',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(verification_status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_renders_submission_id ON public.renders(submission_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);

-- 8. Row Level Security (RLS) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 9. RLS 정책 정의
-- [Profiles]
CREATE POLICY "자신의 프로필은 누구나 조회 가능" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "자신의 프로필 수정 가능" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- [Submissions]
CREATE POLICY "자신이 올린 제출 조회" ON public.submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "승인된 제출물은 관리자 또는 공개 갤러리에서 조회 가능" ON public.submissions
    FOR SELECT USING (verification_status = 'APPROVED');

CREATE POLICY "로그인 유저는 제출 생성 가능" ON public.submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- [Renders]
CREATE POLICY "렌더링된 영상은 누구나 조회 가능" ON public.renders
    FOR SELECT USING (true);

-- [Subscriptions]
CREATE POLICY "자신의 구독 정보만 조회 가능" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- [Storage Bucket 초기화 안내]
-- Supabase Dashboard > Storage 에서 다음 버킷 생성 권장:
-- 1. 'submissions' (Public / 유저 업로드 장소 사진 & 영수증)
-- 2. 'renders' (Public / FFmpeg 렌더링된 숏폼 MP4 비디오)
-- 3. 'assets' (Public / 둥글이 그린스크린 원본 영상 및 템플릿)
