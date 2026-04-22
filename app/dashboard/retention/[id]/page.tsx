import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, TrendingUp, UserCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/common/Topbar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { tierOf, type RiskTier } from '@/lib/retention/scorer';
import { ScriptPanel } from './ScriptPanel';

export const metadata = { title: '해약 리스크 상세' };

type HistoryRow = {
  id: string;
  score: number;
  computed_at: string;
  factors: { tier?: string; items?: Array<{ label: string; points: number; hint?: string }> };
  recommended_action: string | null;
};

export default async function RetentionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Parallel fetch — the two queries are independent (both keyed by contract id).
  const [contractRes, historyRes] = await Promise.all([
    supabase
      .from('sangjo_contracts')
      .select(
        'id, product_name, monthly_payment, paid_months, total_months, contract_date, status, client_id, clients(id, name, phone)',
      )
      .eq('id', id)
      .maybeSingle<{
        id: string;
        product_name: string | null;
        monthly_payment: number | null;
        paid_months: number | null;
        total_months: number | null;
        contract_date: string | null;
        status: string;
        client_id: string;
        clients: { id: string; name: string; phone: string | null } | null;
      }>(),
    supabase
      .from('retention_scores')
      .select('id, score, computed_at, factors, recommended_action')
      .eq('contract_id', id)
      .order('computed_at', { ascending: false })
      .limit(14)
      .returns<HistoryRow[]>(),
  ]);

  const contract = contractRes.data;
  if (!contract || !contract.clients) notFound();

  const history = historyRes.data;

  const latest = history?.[0];
  const tier: RiskTier | null = latest ? tierOf(latest.score) : null;
  const progress =
    contract.total_months && contract.paid_months != null
      ? Math.round((contract.paid_months / contract.total_months) * 100)
      : null;

  return (
    <>
      <Topbar
        title={`${contract.clients.name} · 해약 리스크`}
        subtitle={latest ? new Date(latest.computed_at).toLocaleString('ko-KR') : '스코어 없음'}
      />

      <main className="flex-1 p-6 md:p-8 space-y-8">
        <Link
          href="/dashboard/retention"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Top 리스트로
        </Link>

        <section className="grid md:grid-cols-[auto_1fr] gap-6">
          <Card className="md:w-64">
            <CardContent className="p-6">
              {latest && tier ? <ScoreDisplay score={latest.score} tier={tier} /> : <p className="text-sm text-slate-500">스코어 없음</p>}
              {latest?.recommended_action && (
                <p className="mt-4 text-sm text-slate-700 leading-relaxed">
                  {latest.recommended_action}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center">
                  <UserCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <Link
                    href={`/dashboard/clients/${contract.client_id}`}
                    className="text-base font-bold hover:text-indigo-700"
                  >
                    {contract.clients.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {contract.clients.phone ?? '연락처 없음'}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <InfoStat label="상품" value={contract.product_name ?? '—'} />
                <InfoStat
                  label="월 납입"
                  value={contract.monthly_payment ? `${contract.monthly_payment.toLocaleString('ko-KR')}원` : '—'}
                />
                <InfoStat
                  label="납입 진도"
                  value={
                    progress != null
                      ? `${progress}% (${contract.paid_months}/${contract.total_months})`
                      : '—'
                  }
                />
              </div>
              {progress != null && (
                <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-black tracking-tight mb-3">스코어 요인</h2>
          {latest && latest.factors?.items?.length ? (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-slate-100">
                  {latest.factors.items.map((f, i) => (
                    <li key={i} className="flex items-center justify-between px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{f.label}</p>
                        {f.hint && <p className="mt-0.5 text-xs text-slate-500">{f.hint}</p>}
                      </div>
                      <span className="ml-4 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                        +{f.points}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-sm text-slate-500">요인이 기록되지 않았습니다.</CardContent>
            </Card>
          )}
        </section>

        <section>
          <h2 className="text-lg font-black tracking-tight mb-3">AI 화법 제안</h2>
          <ScriptPanel contractId={contract.id} disabled={!latest} />
        </section>

        {history && history.length > 1 && (
          <section>
            <h2 className="text-lg font-black tracking-tight mb-3">최근 스코어 변화</h2>
            <Card>
              <CardContent className="p-6 flex items-end gap-2 h-40">
                {history
                  .slice(0, 14)
                  .reverse()
                  .map((h) => (
                    <div
                      key={h.id}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition">
                        {h.score}
                      </span>
                      <div
                        className={cn('w-full rounded-t', barColor(tierOf(h.score)))}
                        style={{ height: `${(h.score / 100) * 80 + 8}%` }}
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>
            <p className="mt-2 text-xs text-slate-400 text-right inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> 최근 {history.length}회 스코어링
            </p>
          </section>
        )}
      </main>
    </>
  );
}

function ScoreDisplay({ score, tier }: { score: number; tier: RiskTier }) {
  const map: Record<RiskTier, { label: string; tint: string }> = {
    critical: { label: 'Critical', tint: 'bg-rose-100 text-rose-700' },
    high: { label: 'High', tint: 'bg-amber-100 text-amber-700' },
    medium: { label: 'Medium', tint: 'bg-slate-200 text-slate-700' },
    low: { label: 'Low', tint: 'bg-emerald-100 text-emerald-700' },
  };
  const m = map[tier];
  return (
    <>
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold', m.tint)}>
        {m.label}
      </span>
      <div className="mt-3 text-6xl font-black leading-none text-slate-900">{score}</div>
      <p className="mt-1 text-xs text-slate-500">해약 리스크 스코어 (0~100)</p>
    </>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 truncate">{value}</p>
    </div>
  );
}

function barColor(tier: RiskTier): string {
  return {
    critical: 'bg-rose-500',
    high: 'bg-amber-500',
    medium: 'bg-slate-400',
    low: 'bg-emerald-500',
  }[tier];
}
