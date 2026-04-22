import Link from 'next/link';
import { SignupForm } from './SignupForm';

export const metadata = { title: '회원가입' };

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight">가온 시작하기</h1>
        <p className="mt-2 text-sm text-slate-600">
          30초 안에 계정을 만들고 엔딩 시나리오를 체험해 보세요.
        </p>
      </div>

      <SignupForm />

      <p className="text-sm text-slate-600">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          로그인
        </Link>
      </p>
    </div>
  );
}
