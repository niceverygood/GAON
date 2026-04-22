'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  loginAction,
  loginWithTestAccountAction,
  signInWithKakao,
  type AuthState,
} from '../actions';

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';
  const justSignedUp = params.get('signup') === '1';
  const errorKind = params.get('error');
  const oauthError = errorKind === 'oauth';
  const envMissing = errorKind === 'supabase_env_missing';

  const [state, formAction, pending] = useActionState<AuthState, FormData>(loginAction, null);
  const [demoState, demoAction, demoPending] = useActionState<AuthState, FormData>(
    loginWithTestAccountAction,
    null,
  );

  return (
    <div className="space-y-4">
      {justSignedUp && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          가입 확인 이메일을 발송했습니다. 메일 링크로 인증 후 로그인해 주세요.
        </div>
      )}
      {oauthError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          카카오 로그인을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      )}
      {envMissing && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 leading-relaxed">
          서버 환경 변수가 설정되지 않았습니다. 운영자는 Vercel Project Settings →
          Environment Variables 에서 <code className="px-1 bg-rose-100 rounded">NEXT_PUBLIC_SUPABASE_URL</code>{' '}
          와 <code className="px-1 bg-rose-100 rounded">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{' '}
          를 추가해 주세요.
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <div className="space-y-1.5">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="planner@sangjo.co.kr"
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-11"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-rose-600">{state.error}</p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full bg-indigo-600 text-white hover:bg-indigo-700 [a]:hover:bg-indigo-700"
        >
          {pending ? '로그인 중…' : '로그인'}
        </Button>
      </form>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-400">또는</span>
        </div>
      </div>

      <form action={signInWithKakao}>
        <Button
          type="submit"
          variant="outline"
          className="h-11 w-full border-[#FEE500] bg-[#FEE500] text-slate-900 hover:bg-[#FFDE00] [a]:hover:bg-[#FFDE00]"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          카카오로 시작하기
        </Button>
      </form>

      <form action={demoAction} className="space-y-2">
        <Button
          type="submit"
          variant="outline"
          disabled={demoPending}
          className="h-11 w-full border-dashed border-indigo-300 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100 [a]:hover:bg-indigo-100"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {demoPending ? '테스트 계정 준비 중…' : '테스트 계정으로 로그인'}
        </Button>
        {demoState?.error && (
          <p className="text-xs text-rose-600 leading-relaxed">{demoState.error}</p>
        )}
        <p className="text-[11px] text-slate-400 leading-relaxed">
          데모·파일럿용 자동 생성 계정입니다. 실제 고객 데이터를 입력하지 마세요.
        </p>
      </form>
    </div>
  );
}
