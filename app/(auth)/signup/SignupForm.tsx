'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signupAction, type AuthState } from '../actions';

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signupAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">이름</Label>
        <Input id="name" name="name" required placeholder="홍길동" className="h-11" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="organization">
          소속 상조사 <span className="text-xs text-slate-400">(선택)</span>
        </Label>
        <Input id="organization" name="organization" placeholder="예) 프리드라이프" className="h-11" />
      </div>

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
          autoComplete="new-password"
          minLength={8}
          required
          placeholder="8자 이상"
          className="h-11"
        />
      </div>

      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full bg-indigo-600 text-white hover:bg-indigo-700 [a]:hover:bg-indigo-700"
      >
        {pending ? '가입 중…' : '계정 만들기'}
      </Button>

      <p className="text-xs text-slate-500 leading-relaxed">
        가입 시{' '}
        <a href="/terms" className="underline">이용약관</a> 및{' '}
        <a href="/privacy" className="underline">개인정보처리방침</a>에 동의한 것으로 간주합니다.
      </p>
    </form>
  );
}
