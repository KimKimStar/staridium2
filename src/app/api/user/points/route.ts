import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'demo-user-123';

  try {
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('id, email, nickname, points, role')
      .eq('id', userId)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({
        userId,
        points: 2500, // 데모 초기 포인트
        nickname: '둥글러버',
        role: 'user',
      });
    }

    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json({
      userId,
      points: 2500,
      nickname: '둥글러버',
      role: 'user',
    });
  }
}
