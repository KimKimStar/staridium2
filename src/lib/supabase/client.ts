import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';

// 브라우저에서 안전하게 사용하는 공개 클라이언트
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
