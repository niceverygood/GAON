import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-black">
              가
            </span>
            <span className="text-lg font-black tracking-tight">가온</span>
            <span className="hidden sm:inline text-xs text-slate-500">Gaon</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <Link href="#features" className="hover:text-slate-900">기능</Link>
            <Link href="#roi" className="hover:text-slate-900">성과</Link>
            <Link href="#pricing" className="hover:text-slate-900">요금</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-9 px-3')}
            >
              로그인
            </Link>
            <Link
              href="#contact"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'h-9 px-4 bg-indigo-600 text-white hover:bg-indigo-700 [a&]:hover:bg-indigo-700',
              )}
            >
              파일럿 문의
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-500 flex flex-col md:flex-row gap-4 md:justify-between">
          <div>
            <p className="font-semibold text-slate-700">가온 (Gaon)</p>
            <p className="mt-1">삶의 마지막을 준비하는 가장 따뜻한 기술.</p>
          </div>
          <div className="text-xs leading-relaxed">
            <p>
              가온은 상조 판매 대행이 아닌 플래너 업무 지원 SaaS입니다.<br />
              제공되는 모든 수치·문서는 참고 자료이며, 법률·세무·의료 자문은 해당 전문가를 통해
              확인하시기 바랍니다.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
