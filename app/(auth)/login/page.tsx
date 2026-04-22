import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export const metadata = { title: '로그인' };

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight">플래너 로그인</h1>
        <p className="mt-2 text-sm text-slate-600">
          가온 계정으로 로그인해 대시보드를 이용하세요.
        </p>
      </div>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <p className="text-sm text-slate-600">
        아직 계정이 없으신가요?{' '}
        <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
          회원가입
        </Link>
      </p>
    </div>
  );
}
