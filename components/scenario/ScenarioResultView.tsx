import {
  Activity,
  Armchair,
  Flame,
  Gift,
  Milestone,
  Quote,
  TrendingDown,
  TriangleAlert,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  ScenarioResult,
  ScenarioTimelineEvent,
} from '@/types/scenario';

export function ScenarioResultView({ result }: { result: ScenarioResult }) {
  const { costs, coverage_gap, life_expectancy_range } = result;

  return (
    <div className="space-y-8">
      {/* Headline */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-white">
        <CardContent className="p-6 md:p-8">
          <Badge className="bg-indigo-600 hover:bg-indigo-600">AI 생성 · 참고 자료</Badge>
          <p className="mt-4 text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">
            “{result.headline}”
          </p>
          <p className="mt-4 text-sm text-slate-500">
            통계적 기대수명 범위 {life_expectancy_range.low}–{life_expectancy_range.high}세
            <span className="text-slate-400"> · 출처 {life_expectancy_range.source}</span>
          </p>
        </CardContent>
      </Card>

      {/* Cost summary */}
      <section>
        <h2 className="mb-4 text-lg font-black tracking-tight">엔딩 총 필요 금액</h2>
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="text-4xl md:text-5xl font-black text-slate-900">
              {krw(costs.total_need_krw)}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              의료 · 간병 · 장례 · 상속까지 통계 기반 합산 추정
            </p>
            <div className="mt-8 grid md:grid-cols-4 gap-4">
              <Breakdown label="평생 의료비" value={costs.lifetime_medical_krw} tint="rose" />
              <Breakdown
                label="간병 총액"
                value={costs.care_total_krw}
                tint="amber"
                hint={`${krw(costs.care_monthly_krw)}/월 × ${costs.care_avg_months}개월`}
              />
              <Breakdown label="장례비" value={costs.funeral_krw} tint="slate" />
              <Breakdown label="예상 상속세" value={costs.inheritance_tax_krw} tint="indigo" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Coverage gap */}
      <section>
        <h2 className="mb-4 text-lg font-black tracking-tight">현재 준비 vs 필요</h2>
        <Card>
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <StatBlock label="현재 준비" value={krw(coverage_gap.currently_covered_krw)} tone="neutral" />
              <StatBlock label="총 필요" value={krw(costs.total_need_krw)} tone="neutral" />
              <StatBlock
                label="부족 (갭)"
                value={krw(coverage_gap.shortfall_krw)}
                tone={coverage_gap.shortfall_krw > 0 ? 'warning' : 'good'}
                icon={coverage_gap.shortfall_krw > 0 ? <TrendingDown className="h-4 w-4" /> : undefined}
              />
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
              {coverage_gap.summary}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Timeline */}
      <section>
        <h2 className="mb-4 text-lg font-black tracking-tight">예상 엔딩 타임라인</h2>
        <Card>
          <CardContent className="p-6 md:p-8">
            <ol className="relative ml-3 border-l border-slate-200 space-y-6">
              {result.timeline.map((e, i) => (
                <TimelineItem key={`${e.age}-${i}`} event={e} />
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>

      {/* Talking points */}
      <section>
        <h2 className="mb-4 text-lg font-black tracking-tight">플래너 화법 제안</h2>
        <Card>
          <CardContent className="p-6 space-y-3">
            {result.planner_talking_points.map((p, i) => (
              <div key={i} className="flex gap-3 items-start">
                <Quote className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <p className="text-sm text-slate-800 leading-relaxed">{p}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <TriangleAlert className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">{result.disclaimer}</p>
      </div>
    </div>
  );
}

const CATEGORY_META: Record<
  ScenarioTimelineEvent['category'],
  { icon: React.ComponentType<{ className?: string }>; tint: string; label: string }
> = {
  health: { icon: Activity, tint: 'bg-rose-100 text-rose-700', label: '건강' },
  care: { icon: Armchair, tint: 'bg-amber-100 text-amber-700', label: '간병' },
  funeral: { icon: Flame, tint: 'bg-slate-200 text-slate-700', label: '장례' },
  inheritance: { icon: Gift, tint: 'bg-indigo-100 text-indigo-700', label: '상속' },
  milestone: { icon: Milestone, tint: 'bg-violet-100 text-violet-700', label: '이정표' },
};

function TimelineItem({ event }: { event: ScenarioTimelineEvent }) {
  const meta = CATEGORY_META[event.category] ?? CATEGORY_META.milestone;
  const Icon = meta.icon;
  return (
    <li className="pl-6 relative">
      <span
        className={cn(
          'absolute -left-[13px] top-0 h-6 w-6 inline-flex items-center justify-center rounded-full ring-2 ring-white',
          meta.tint,
        )}
      >
        <Icon className="h-3 w-3" />
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-slate-900">{event.age}세</span>
        <Badge variant="secondary" className="text-xs">
          {meta.label}
        </Badge>
        {typeof event.probability === 'number' && (
          <span className="text-xs text-slate-400">확률 {(event.probability * 100).toFixed(0)}%</span>
        )}
      </div>
      <p className="mt-1 text-base font-semibold text-slate-900">{event.title}</p>
      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{event.detail}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
        {event.estimated_cost_krw != null && event.estimated_cost_krw > 0 && (
          <span className="font-semibold text-slate-700">예상 {krw(event.estimated_cost_krw)}</span>
        )}
        {event.source && <span className="text-slate-400">출처 {event.source}</span>}
      </div>
    </li>
  );
}

const BREAKDOWN_TINTS = {
  rose: 'bg-rose-50 text-rose-700',
  amber: 'bg-amber-50 text-amber-700',
  slate: 'bg-slate-100 text-slate-700',
  indigo: 'bg-indigo-50 text-indigo-700',
} as const;

function Breakdown({
  label,
  value,
  tint,
  hint,
}: {
  label: string;
  value: number;
  tint: keyof typeof BREAKDOWN_TINTS;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 p-4">
      <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-semibold', BREAKDOWN_TINTS[tint])}>
        {label}
      </span>
      <div className="mt-3 text-xl font-black text-slate-900">{krw(value)}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

const TONE_CLASSES = {
  neutral: 'border-slate-200 text-slate-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  good: 'border-emerald-300 bg-emerald-50 text-emerald-900',
} as const;

function StatBlock({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: keyof typeof TONE_CLASSES;
  icon?: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-lg border p-4', TONE_CLASSES[tone])}>
      <div className="flex items-center gap-1.5 text-xs font-semibold opacity-80">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}

function krw(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억 원`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString('ko-KR')}만 원`;
  return `${n.toLocaleString('ko-KR')}원`;
}
