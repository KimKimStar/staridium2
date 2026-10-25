import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/server';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-01-27.acacia' as any,
  typescript: true,
});

/**
 * 사장님 전용 '월 9,900원 Pro 정기 구독' Stripe Checkout 세션 생성
 */
export async function createProSubscriptionCheckout({
  userId,
  userEmail,
  returnUrl,
}: {
  userId: string;
  userEmail: string;
  returnUrl: string;
}) {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  // 만약 사전에 등록된 Price ID가 없다면 line_items에 9,900원 recurring 월간 플랜 동적 생성
  const lineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        price_data: {
          currency: 'krw',
          product_data: {
            name: '둥글이 AI 숏폼 방송국 Pro 사장님 패스',
            description: 'AI 체험형 숏폼 무제한 렌더링 & 고화질 자동 마케팅 솔루션 (월간 정기결제)',
          },
          unit_amount: 9900, // 9,900원 (KRW는 zero-decimal currency)
          recurring: {
            interval: 'month' as const,
          },
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    billing_address_collection: 'auto',
    customer_email: userEmail,
    line_items: [lineItem],
    metadata: {
      userId,
      tier: 'pro_monthly',
    },
    subscription_data: {
      metadata: {
        userId,
        tier: 'pro_monthly',
      },
    },
    success_url: `${returnUrl}/admin?session_id={CHECKOUT_SESSION_ID}&subscription=success`,
    cancel_url: `${returnUrl}/pricing?canceled=true`,
  });

  return session;
}

/**
 * 유저의 Pro 구독 유효 여부 검증 (접근 제어)
 */
export async function checkUserProSubscription(userId: string): Promise<{
  isPro: boolean;
  status?: string;
  currentPeriodEnd?: string;
}> {
  if (!userId) {
    return { isPro: false, status: 'unauthenticated' };
  }

  try {
    const { data: sub, error } = await supabaseAdmin
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !sub) {
      return { isPro: false, status: 'none' };
    }

    // 만료 기간 확인 (current_period_end가 미래 시점인지)
    const isStillValid = !sub.current_period_end || new Date(sub.current_period_end).getTime() > Date.now();

    return {
      isPro: isStillValid,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
    };
  } catch (err) {
    console.error('[Stripe 구독 확인 에러]:', err);
    return { isPro: false, status: 'error' };
  }
}
