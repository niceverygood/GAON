'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { seedDemoPlanner } from '@/lib/demo/seed';

export type AuthState = { error?: string } | null;

/** Demo credentials — overridable via env. Auto-provisioned on first click. */
const DEMO_EMAIL = process.env.TEST_ACCOUNT_EMAIL ?? 'demo@gaon.app';
const DEMO_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD ?? 'GaonDemo!2026';
const DEMO_NAME = process.env.TEST_ACCOUNT_NAME ?? '테스트 플래너';

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

/**
 * One-click login for pilots and demos. Auto-provisions the demo user via
 * service-role if it does not yet exist, then signs in. Requires
 * `SUPABASE_SERVICE_ROLE_KEY` to be set server-side.
 */
export async function loginWithTestAccountAction(
  _prev: AuthState,
  _formData: FormData,
): Promise<AuthState> {
  void _prev;
  void _formData;
  if (!DEMO_EMAIL || !DEMO_PASSWORD) {
    return { error: '테스트 계정 설정이 누락되었습니다.' };
  }

  const supabase = await createClient();
  const firstTry = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (!firstTry.error) {
    // Ensure demo data exists — cheap no-op when the account already has clients.
    await trySeed(firstTry.data.user?.id);
    redirect('/dashboard');
  }

  // First attempt failed — most likely user not yet provisioned. Try creating
  // it via service-role and retry. A missing service role key means we cannot
  // auto-create, so we surface a clear message.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error:
        '테스트 계정이 아직 생성되지 않았습니다. 운영자가 SUPABASE_SERVICE_ROLE_KEY를 설정하거나 계정을 수동 생성해 주세요.',
    };
  }

  try {
    const admin = await createServiceClient();
    const { error: createErr } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { name: DEMO_NAME },
    });

    // "already registered" is fine — means the password we tried is wrong.
    if (createErr && !/already|exists|registered/i.test(createErr.message)) {
      console.error('[test-login] admin.createUser failed', createErr);
      return { error: '테스트 계정 생성에 실패했습니다.' };
    }
  } catch (e) {
    console.error('[test-login] service client threw', e);
    return { error: '테스트 계정 생성 중 오류가 발생했습니다.' };
  }

  const retry = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (retry.error) {
    return {
      error:
        '테스트 계정 로그인에 실패했습니다. 비밀번호가 변경되었을 수 있습니다. 운영자에게 문의해 주세요.',
    };
  }

  await trySeed(retry.data.user?.id);
  redirect('/dashboard');
}

/**
 * Best-effort demo seeding. Swallows errors (including "migrations not run
 * yet") so a seeding hiccup never blocks the login itself.
 */
async function trySeed(plannerId: string | undefined): Promise<void> {
  if (!plannerId) return;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const admin = await createServiceClient();
    const outcome = await seedDemoPlanner(admin, plannerId);
    if (outcome.seeded) {
      console.log('[test-login] seeded demo data:', outcome.clients, 'clients');
    }
  } catch (e) {
    console.error('[test-login] seed failed — login will still proceed', e);
  }
}
