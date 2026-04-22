import Link from 'next/link';

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white font-black text-sm">
              가
            </span>
            <span className="text-base font-black tracking-tight">가온</span>
          </Link>
          <span className="text-xs text-slate-500">읽기 전용 공유 페이지</span>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6 text-xs text-slate-500 leading-relaxed">
          본 페이지는 상조 플래너가 상담 참고용으로 생성한 시나리오입니다.
          제공되는 수치는 통계 기반 추정이며, 의학·법률·세무 자문은 반드시 전문가를 통해 확인하시기 바랍니다.
        </div>
      </footer>
    </div>
  );
}
