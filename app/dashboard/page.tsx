import Link from 'next/link';
import { Plus, Sparkles, ShieldCheck, HeartHandshake, ArrowUpRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/common/Topbar';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata = { title: '대시보드' };

export default async function DashboardHomePage() {
  const supabase = await createClient();

  const [
    { count: clientCount },
    { count: scenarioCount },
    { data: recentClients },
    { data: topRisk },
  ] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('ending_scenarios').select('id', { count: 'exact', head: true }),
    supabase
      .from('clients')
      .select('id, name, created_at, birth_date, phone')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.rpc('top_retention', { limit_count: 100 }),
  ]);

  const risky = Array.isArray(topRisk)
    ? (topRisk as Array<{ score: number }>).filter((r) => r.score >= 50).length
    : null;

  return (
    <>
      <Topbar title="대시보드" subtitle="오늘의 플래너 업무 요약" />

      <main className="flex-1 p-6 md:p-8 space-y-8">
        {/* Quick stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat
            tint="indigo"
            icon={<Sparkles className="h-4 w-4" />}
            label="생성한 시나리오"
            value={scenarioCount ?? 0}
            cta={{ label: '새 시나리오', href: '/dashboard/scenario' }}
          />
          <Stat
            tint="amber"
            icon={<ShieldCheck className="h-4 w-4" />}
            label="해약 위험 (High·Critical)"
            value={risky ?? '—'}
            hint={risky === null ? '스코어링 대기' : '스코어 50 이상 활성 계약'}
            cta={{ label: '리드 보기', href: '/dashboard/retention' }}
          />
          <Stat
            tint="rose"
            icon={<HeartHandshake className="h-4 w-4" />}
            label="진행 중 장례"
            value="—"
            hint="Phase 3"
            cta={{ label: '이벤트 보기', href: '/dashboard/funeral' }}
          />
        </section>

        {/* Recent clients */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black tracking-tight">최근 고객 {clientCount ? `(${clientCount})` : ''}</h2>
              <p className="mt-1 text-sm text-slate-500">
                마지막으로 등록한 고객부터 표시됩니다.
              </p>
            </div>
            <Link
              href="/dashboard/clients/new"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'h-9 px-3 bg-indigo-600 text-white hover:bg-indigo-700 [a]:hover:bg-indigo-700',
              )}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              고객 추가
            </Link>
          </div>

          {!recentClients || recentClients.length === 0 ? (
            <EmptyClients />
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-slate-100">
                  {recentClients.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/dashboard/clients/${c.id}`}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {c.birth_date ? new Date(c.birth_date).toLocaleDateString('ko-KR') : '생년월일 미입력'}
                            {c.phone ? ` · ${c.phone}` : ''}
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-slate-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </>
  );
}

function EmptyClients() {
  return (
    <Card className="border-dashed">
      <CardContent className="p-10 text-center space-y-4">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
          <Plus className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold">첫 고객을 등록해 보세요</h3>
          <p className="mt-1 text-sm text-slate-500">
            이름·생년월일만 있어도 엔딩 시나리오를 바로 생성할 수 있습니다.
          </p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className={cn(
            buttonVariants({ size: 'sm' }),
            'h-9 px-3 bg-indigo-600 text-white hover:bg-indigo-700 [a]:hover:bg-indigo-700',
          )}
        >
          고객 등록하기
        </Link>
      </CardContent>
    </Card>
  );
}

const TINTS = {
  indigo: 'bg-indigo-100 text-indigo-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
} as const;

function Stat({
  tint,
  icon,
  label,
  value,
  hint,
  cta,
}: {
  tint: keyof typeof TINTS;
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  cta?: { label: string; href: string };
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg', TINTS[tint])}>
            {icon}
          </span>
          {cta && (
            <Link href={cta.href} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
              {cta.label} →
            </Link>
          )}
        </div>
        <div className="mt-6">
          <div className="text-3xl font-black text-slate-900">{value}</div>
          <div className="mt-1 text-sm text-slate-600">{label}</div>
          {hint && <div className="mt-2 text-xs text-slate-400">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
