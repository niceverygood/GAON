'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type AuthState = { error?: string } | null;

function normalize(input: FormDataEntryValue | null): string {
  return typeof input === 'string' ? input.trim() : '';
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = normalize(formData.get('email'));
  const password = normalize(formData.get('password'));
  const next = normalize(formData.get('next')) || '/dashboard';

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력해 주세요.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: '로그인에 실패했습니다. 이메일·비밀번호를 확인해 주세요.' };
  }

  redirect(next);
}

export async function signupAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const name = normalize(formData.get('name'));
  const email = normalize(formData.get('email'));
  const password = normalize(formData.get('password'));
  const orgName = normalize(formData.get('organization'));

  if (!name || !email || !password) {
    return { error: '이름·이메일·비밀번호를 모두 입력해 주세요.' };
  }

  if (password.length < 8) {
    return { error: '비밀번호는 8자 이상으로 설정해 주세요.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        organization: orgName || null,
      },
    },
  });

  if (error) {
    return { error: '가입에 실패했습니다. 다른 이메일을 사용해 주세요.' };
  }

  redirect('/login?signup=1');
}

export async function signInWithKakao(): Promise<void> {
  const supabase = await createClient();
  const origin = (await headers()).get('origin') ?? process.env.NEXT_PUBLIC_BASE_URL ?? '';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error || !data?.url) {
    redirect('/login?error=oauth');
  }
  redirect(data.url);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
