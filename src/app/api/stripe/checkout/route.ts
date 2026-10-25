import { NextRequest, NextResponse } from 'next/server';
import { createProSubscriptionCheckout } from '@/lib/stripe/stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = 'user_demo_boss', userEmail = 'boss@example.com' } = body;

    const host = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await createProSubscriptionCheckout({
      userId,
      userEmail,
      returnUrl: host,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[Stripe Checkout Session Error]:', error);
    return NextResponse.json(
      { error: error?.message || '결제 세션 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
