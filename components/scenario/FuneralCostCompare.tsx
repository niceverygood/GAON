import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  BENCHMARKS,
  CATEGORY_META,
  benchmarkFor,
  splitByBenchmark,
  type CostBreakdown,
  type CostCategory,
  type RegionTier,
} from '@/lib/funeral/benchmarks';

const CATEGORY_TINTS: Record<CostCategory, string> = {
  venue: 'bg-indigo-500',
  ritual: 'bg-violet-500',
  catering: 'bg-amber-500',
  cremation: 'bg-slate-500',
  supplies: 'bg-rose-500',
};

export type FuneralCompareProps = {
  /** Region tier for this consultation. */
  tier: RegionTier;
  /** Total funeral cost projected for this client. */
  totalKrw: number;
  /**
   * Optional category breakdown. If omitted we derive from the regional
   * benchmark proportions — better than nothing, and the source is shown.
   */
  breakdown?: CostBreakdown;
  /** Current monthly payment + paid months on the active sangjo contract, if any. */
  existing?: {
    monthlyKrw: number;
    totalMonths: number;
    paidMonths: number;
    productName?: string | null;
  } | null;
  /** Compact mode — drops benchmark comparison grid. */
  compact?: boolean;
};

/**
 * Visual cost comparison for in-consultation use: a stacked bar of the 5 cost
 * categories, regional benchmark context, and a gap readout vs the client's
 * existing sangjo coverage. Pure presentational — no data fetching.
 */
export function FuneralCostCompare({
  tier,
  totalKrw,
  breakdown,
  existing,
  compact,
}: FuneralCompareProps) {
  const bench = benchmarkFor(tier);
  const bars = breakdown ?? splitByBenchmark(totalKrw, tier);
  const covered = existing ? existing.monthlyKrw * existing.totalMonths : 0;
  const paidSoFar = existing ? existing.monthlyKrw * existing.paidMonths : 0;
  const gap = Math.max(0, totalKrw - covered);
  const paidPct = covered > 0 ? Math.round((paidSoFar / covered) * 100) : null;

  return (
    <Card>
      <CardContent className="p-6 md:p-8 space-y-8">
        {/* Headline */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              예상 장례비 · {bench.label}
            </p>
            <p className="mt-1 text-4xl md:text-5xl font-black text-slate-900">
              {krw(totalKrw)}
            </p>
          </div>
          <div className="text-sm text-slate-500">
            지역 평균 {krw(bench.total_krw)}
            <BenchmarkDelta total={totalKrw} benchmark={bench.total_krw} />
          </div>
        </div>

        {/* Stacked category bar */}
        <StackedBar breakdown={bars} total={totalKrw} />

        {/* Category rows */}
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
          {(Object.keys(bars) as CostCategory[]).map((cat) => {
            const value = bars[cat];
            const pct = totalKrw > 0 ? (value / totalKrw) * 100 : 0;
            return (
              <div key={cat} className="flex items-baseline gap-3 py-1.5">
                <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', CATEGORY_TINTS[cat])} />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-slate-900">
                      {CATEGORY_META[cat].label}
                    </span>
                    <span className="text-sm font-bold text-slate-700">{krw(value)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{CATEGORY_META[cat].desc}</p>
                </div>
                <span className="text-xs font-semibold text-slate-400 w-10 text-right">
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Coverage gap */}
        {existing && (
          <div className="grid md:grid-cols-3 gap-4 pt-2">
            <GapStat
              label="현재 상조 보장"
              value={krw(covered)}
              hint={
                existing.productName
                  ? `${existing.productName} · ${paidPct ?? 0}% 납입 완료`
                  : `${paidPct ?? 0}% 납입 완료`
              }
              tone="neutral"
            />
            <GapStat label="필요 장례비" value={krw(totalKrw)} tone="neutral" />
            <GapStat
              label={gap > 0 ? '부족한 금액' : '충분한 보장'}
              value={gap > 0 ? krw(gap) : '커버 가능'}
              tone={gap > 0 ? 'warning' : 'good'}
              icon={gap > 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            />
          </div>
        )}

        {/* Benchmark table */}
        {!compact && (
          <div className="border-t border-slate-100 pt-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              지역별 평균 장례비 참고
            </p>
            <div className="grid grid-cols-4 gap-2">
              {BENCHMARKS.map((b) => (
                <div
                  key={b.tier}
                  className={cn(
                    'rounded-lg border px-3 py-2.5',
                    b.tier === tier
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-slate-200 bg-white',
                  )}
                >
                  <p className="text-xs font-semibold text-slate-500">{b.label}</p>
                  <p className="mt-1 text-base font-black text-slate-900">{krw(b.total_krw)}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
              출처 · 한국소비자원 「장례서비스 가격 실태조사」(2023) + 상조업계 3일장 패키지 평균.
              문상객 수·식장 등급에 따라 ±30% 차이가 납니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StackedBar({ breakdown, total }: { breakdown: CostBreakdown; total: number }) {
  if (total <= 0) return null;
  return (
    <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100">
      {(Object.keys(breakdown) as CostCategory[]).map((cat) => {
        const pct = (breakdown[cat] / total) * 100;
        if (pct <= 0) return null;
        return (
          <div
            key={cat}
            className={CATEGORY_TINTS[cat]}
            style={{ width: `${pct}%` }}
            title={`${CATEGORY_META[cat].label} · ${krw(breakdown[cat])}`}
          />
        );
      })}
    </div>
  );
}

function BenchmarkDelta({ total, benchmark }: { total: number; benchmark: number }) {
  if (benchmark <= 0) return null;
  const diff = total - benchmark;
  if (Math.abs(diff) < benchmark * 0.03) {
    return <span className="ml-2 text-xs text-slate-400">(평균 근접)</span>;
  }
  const pct = Math.round((diff / benchmark) * 100);
  const sign = diff > 0 ? '+' : '';
  const tone = diff > 0 ? 'text-rose-600' : 'text-emerald-600';
  return <span className={cn('ml-2 text-xs font-semibold', tone)}>{sign}{pct}%</span>;
}

const TONE_CLASSES = {
  neutral: 'border-slate-200 text-slate-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  good: 'border-emerald-300 bg-emerald-50 text-emerald-900',
} as const;

function GapStat({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: keyof typeof TONE_CLASSES;
  icon?: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-lg border p-4', TONE_CLASSES[tone])}>
      <div className="flex items-center gap-1.5 text-xs font-semibold opacity-80">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-black leading-tight">{value}</div>
      {hint && <div className="mt-1 text-[11px] opacity-80">{hint}</div>}
    </div>
  );
}

function krw(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억 원`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString('ko-KR')}만 원`;
  return `${n.toLocaleString('ko-KR')}원`;
}
