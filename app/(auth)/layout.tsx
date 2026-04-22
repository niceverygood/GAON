import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white text-slate-900">
      {/* Brand side */}
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur text-white font-black">
            가
          </span>
          <span className="text-lg font-black tracking-tight">가온 · Gaon</span>
        </Link>
        <div>
          <p className="text-2xl md:text-3xl font-black leading-snug">
            삶의 마지막을 준비하는<br />
            가장 따뜻한 기술.
          </p>
          <p className="mt-6 text-sm text-indigo-100/90 leading-relaxed max-w-md">
            엔딩 시나리오 · 해약 방지 AI · 장례 실행 매니저.
            상조 플래너를 위한 올인원 엔딩 플래닝 SaaS.
          </p>
        </div>
        <p className="text-xs text-indigo-200/80">
          © {new Date().getFullYear()} Gaon · B2B SaaS for funeral pre-planning consultants
        </p>
      </aside>

      {/* Form side */}
      <main className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
