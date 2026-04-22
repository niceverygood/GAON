import Link from 'next/link';
import { ShieldCheck, TriangleAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/common/Topbar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { tierOf, type RiskTier } from '@/lib/retention/scorer';
import { RecomputeButton } from './RecomputeButton';

export const metadata = { title: '해약 방지 AI' };

type Row = {
  contract_id: string;
  client_id: string;
  client_name: string;
  score: number;
  factors: { tier?: string; items?: Array<{ label: string; points: number }> };
  recommended_action: string | null;
  computed_at: string;
  product_name: string | null;
  monthly_payment: number | null;
  paid_months: number | null;
  total_months: number | null;
};

export default async function RetentionPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('top_retention', { limit_count: 20 });

  const rows = (data as Row[] | null) ?? [];
  const missingView = !!error && /relation|function/i.test(error.message);

  const lastComputed = rows[0]?.computed_at;

  return (
    <>
      <Topbar
        title="해약 방지 AI"
        subtitle={
          lastComputed
            ? `마지막 스코어링 ${new Date(lastComputed).toLocaleString('ko-KR')}`
            : '이번 달 해약 위험 Top 20'
        }
      />

      <main className="flex-1 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <Tally label="Critical" count={rows.filter((r) => r.score >= 70).length} tint="rose" />
            <Tally label="High" count={rows.filter((r) => r.score >= 50 && r.score < 70).length} tint="amber" />
            <Tally label="Medium" count={rows.filter((r) => r.score >= 25 && r.score < 50).length} tint="slate" />
          </div>
          <RecomputeButton />
        </div>

        {missingView ? (
          <MigrationNotice />
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-[auto_2fr_2fr_2fr_auto] gap-4 px-5 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span>위험도</span>
                <span>고객 · 상품</span>
                <span>주요 요인</span>
                <span>권장 액션</span>
                <span className="text-right">상세</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <RetentionRow key={r.contract_id} row={r} />
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}

function RetentionRow({ row }: { row: Row }) {
  const tier = tierOf(row.score);
  const progress =
    row.total_months && row.paid_months != null
      ? Math.round((row.paid_months / row.total_months) * 100)
      : null;

  return (
    <li>
      <Link
        href={`/dashboard/retention/${row.contract_id}`}
        className="grid grid-cols-[auto_2fr_2fr_2fr_auto] gap-4 items-center px-5 py-4 hover:bg-slate-50 transition"
      >
        <ScoreBadge score={row.score} tier={tier} />
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{row.client_name}</p>
          <p className="mt-0.5 text-xs text-slate-500 truncate">
            {row.product_name ?? '상품 미지정'}
            {progress != null ? ` · 납입 ${progress}%` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {(row.factors?.items ?? []).slice(0, 3).map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
            >
              {f.label}
              <span className="text-[10px] font-semibold text-slate-500">+{f.points}</span>
            </span>
          ))}
        </div>
        <p className="text-sm text-slate-700 truncate">{row.recommended_action ?? '—'}</p>
        <span className="text-xs text-slate-400 text-right">열기 →</span>
      </Link>
    </li>
  );
}

const TIER_STYLE: Record<RiskTier, string> = {
  critical: 'bg-rose-100 text-rose-700',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-slate-200 text-slate-700',
  low: 'bg-emerald-100 text-emerald-700',
};

function ScoreBadge({ score, tier }: { score: number; tier: RiskTier }) {
  return (
    <div className={cn('flex h-12 w-12 flex-col items-center justify-center rounded-lg', TIER_STYLE[tier])}>
      <span className="text-lg font-black leading-none">{score}</span>
      <span className="text-[10px] font-semibold uppercase mt-0.5 leading-none">{tier}</span>
    </div>
  );
}

function Tally({ label, count, tint }: { label: string; count: number; tint: 'rose' | 'amber' | 'slate' }) {
  const tintClass = {
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-200 text-slate-700',
  }[tint];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <span className={cn('h-2 w-2 rounded-full', tintClass.split(' ')[0])} />
      <span className="text-xs font-semibold text-slate-500 uppercase">{label}</span>
      <span className="text-sm font-black text-slate-900">{count}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="p-12 text-center space-y-4 max-w-xl mx-auto">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-black tracking-tight">아직 스코어가 없습니다</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          고객에게 상조 계약을 등록한 뒤 상단의 <b>지금 재계산</b> 버튼을 누르거나, 다음 cron
          (매일 03:15 KST)을 기다려 주세요.
        </p>
      </CardContent>
    </Card>
  );
}

function MigrationNotice() {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="p-6 flex gap-3">
        <TriangleAlert className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
        <div className="space-y-1 text-sm text-amber-900">
          <p className="font-semibold">RPC가 아직 배포되지 않았습니다.</p>
          <p>
            Supabase SQL 에디터에서 <code className="bg-amber-100 rounded px-1">scripts/002_retention_helpers.sql</code>
            을 실행해 <code>top_retention</code> 함수와 <code>latest_retention_scores</code> 뷰를
            생성해 주세요.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
