import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/stripe';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret);
    } else {
      // 로컬 개발 환경에서 webhookSecret이 없을 때의 안전 파싱
      event = JSON.parse(bodyText) as Stripe.Event;
    }
  } catch (err: any) {
    console.error(`[Webhook 서명 검증 실패]: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      // 1. 최초 결제 완료 및 구독 세션 활성화
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (userId && subscriptionId) {
          // Stripe에서 실제 구독 객체 조회하여 만료일 등 확인
          const subDetails = await stripe.subscriptions.retrieve(subscriptionId);

          await supabaseAdmin.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: subDetails.status,
              plan_tier: 'pro_monthly',
              current_period_start: new Date(subDetails.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subDetails.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subDetails.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'stripe_subscription_id' }
          );

          // 유저 프로필 역할을 'admin' 또는 'pro'로 격상
          await supabaseAdmin
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', userId);

          console.log(`[Stripe Webhook] 신규 Pro 구독 활성화 완료: User ${userId}, Sub: ${subscriptionId}`);
        }
        break;
      }

      // 2. 구독 갱신 또는 상태 변경 (결제 성공, 결제 실패 등)
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        console.log(`[Stripe Webhook] 구독 상태 동기화 업데이트: ${sub.id} -> ${sub.status}`);
        break;
      }

      // 3. 구독 취소/해지
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        console.log(`[Stripe Webhook] 구독 해지 처리 완료: ${sub.id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] 처리되지 않은 이벤트 타입: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook 처리 중 오류]:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
