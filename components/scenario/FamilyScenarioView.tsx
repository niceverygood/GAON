import {
  Activity,
  Armchair,
  Baby,
  Flame,
  Gift,
  Heart,
  Quote,
  TriangleAlert,
  Users2,
  UserCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  FamilyMemberScenario,
  FamilyScenarioResult,
  Generation,
} from '@/types/family-scenario';
import type { FamilyRelation } from '@/types/db';

const GEN_META: Record<Generation, { label: string; tint: string; icon: React.ComponentType<{ className?: string }> }> = {
  elder: { label: '조부모 세대', tint: 'bg-indigo-100 text-indigo-700', icon: Heart },
  primary: { label: '본인·배우자 세대', tint: 'bg-violet-100 text-violet-700', icon: UserCircle2 },
  younger: { label: '자녀·손주 세대', tint: 'bg-emerald-100 text-emerald-700', icon: Baby },
};

const RELATION_LABELS: Record<FamilyRelation | 'self', string> = {
  self: '본인',
  spouse: '배우자',
  parent: '부모',
  parent_in_law: '배우자 부모',
  child: '자녀',
  sibling: '형제자매',
  grandchild: '손주',
  other: '기타',
};

const CATEGORY_META = {
  health: { icon: Activity, tint: 'bg-rose-50 text-rose-700', label: '건강' },
  care: { icon: Armchair, tint: 'bg-amber-50 text-amber-700', label: '간병' },
  funeral: { icon: Flame, tint: 'bg-slate-100 text-slate-700', label: '장례' },
  inheritance: { icon: Gift, tint: 'bg-indigo-50 text-indigo-700', label: '상속' },
  milestone: { icon: Users2, tint: 'bg-violet-50 text-violet-700', label: '이정표' },
} as const;

export function FamilyScenarioView({ result }: { result: FamilyScenarioResult }) {
  const { family_total_need_krw, family_currently_covered_krw, family_shortfall_krw } = result;
  const byGen = groupByGeneration(result.members);

  return (
    <div className="space-y-8">
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50/60 to-white">
        <CardContent className="p-6 md:p-8">
          <Badge className="bg-violet-600 hover:bg-violet-600">3세대 통합 분석 · 참고 자료</Badge>
          <p className="mt-4 text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">
            “{result.headline}”
          </p>
        </CardContent>
      </Card>

      {/* Totals */}
      <section>
        <h2 className="mb-4 text-lg font-black tracking-tight">가족 전체 엔딩 필요 금액</h2>
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <Total label="가족 전체 필요" value={family_total_need_krw} tint="slate" />
              <Total label="현재 준비" value={family_currently_covered_krw} tint="slate" />
              <Total
                label="부족 (갭)"
                value={family_shortfall_krw}
                tint={family_shortfall_krw > 0 ? 'warning' : 'good'}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Generations */}
      <section>
        <h2 className="mb-4 text-lg font-black tracking-tight">세대별 관점</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {(['elder', 'primary', 'younger'] as Generation[]).map((g) => {
            const meta = GEN_META[g];
            const Icon = meta.icon;
            const summary = result.generations?.[g];
            const members = byGen[g];
            return (
              <Card key={g}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg', meta.tint)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{meta.label}</p>
                      <p className="text-[11px] text-slate-500">
                        {members.length}명 포함
                      </p>
                    </div>
                  </div>
                  {summary?.summary && (
                    <p className="text-sm text-slate-700 leading-relaxed">{summary.summary}</p>
                  )}
                  <div className="text-2xl font-black text-slate-900">
                    {krw(summary?.total_ending_cost_krw ?? 0)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Member cards */}
      <section>
        <h2 className="mb-4 text-lg font-black tracking-tight">구성원별 요약</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {result.members.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      </section>

      {/* Priorities */}
      {result.priorities?.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-black tracking-tight">우선순위 액션</h2>
          <Card>
            <CardContent className="p-0">
              <ol className="divide-y divide-slate-100">
                {result.priorities.map((p, i) => {
                  const target = result.members.find((m) => m.id === p.target_member_id);
                  return (
                    <li key={i} className="px-5 py-4 flex gap-4">
                      <span className="h-8 w-8 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-sm font-black shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {p.title}
                          {target && (
                            <span className="ml-2 text-xs font-normal text-slate-500">
                              · {target.name} ({RELATION_LABELS[target.relation]})
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{p.reason}</p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          권장 실행 시기 — 향후 {p.within_years}년 내
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Talking points */}
      {result.planner_talking_points?.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-black tracking-tight">가족 상담 화법</h2>
          <Card>
            <CardContent className="p-6 space-y-3">
              {result.planner_talking_points.map((p, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <Quote className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  <p className="text-sm text-slate-800 leading-relaxed">{p}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <TriangleAlert className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">{result.disclaimer}</p>
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: FamilyMemberScenario }) {
  const genMeta = GEN_META[member.generation];
  const relationLabel = RELATION_LABELS[member.relation as keyof typeof RELATION_LABELS] ?? '기타';
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('h-10 w-10 rounded-full inline-flex items-center justify-center font-black text-sm', genMeta.tint)}>
              {member.name[0] ?? '?'}
            </div>
            <div>
              <p className="font-bold text-slate-900">{member.name}</p>
              <p className="text-[11px] text-slate-500">
                {relationLabel} · {member.age}세
              </p>
            </div>
          </div>
          <RoleScore score={member.role_score} />
        </div>

        {member.headline && (
          <p className="text-sm text-slate-700 leading-relaxed">{member.headline}</p>
        )}

        {member.near_term?.length > 0 && (
          <ul className="space-y-2">
            {member.near_term.map((ev, i) => {
              const meta = CATEGORY_META[ev.category] ?? CATEGORY_META.milestone;
              const Icon = meta.icon;
              return (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className={cn('mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded', meta.tint)}>
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800">{ev.title}</p>
                    <p className="text-[11px] text-slate-500">
                      향후 {ev.within_years}년 내
                      {ev.estimated_cost_krw ? ` · ${krw(ev.estimated_cost_krw)}` : ''}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RoleScore({ score }: { score: number }) {
  const label = ['의존', '보조', '주축', '핵심'][Math.max(0, Math.min(3, score))] ?? '-';
  const tint =
    score >= 3
      ? 'bg-indigo-100 text-indigo-700'
      : score === 2
        ? 'bg-emerald-100 text-emerald-700'
        : score === 1
          ? 'bg-slate-100 text-slate-700'
          : 'bg-rose-100 text-rose-700';
  return (
    <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold', tint)}>
      {label}
    </span>
  );
}

function Total({
  label,
  value,
  tint,
}: {
  label: string;
  value: number;
  tint: 'slate' | 'warning' | 'good';
}) {
  const tone = {
    slate: 'border-slate-200 text-slate-900',
    warning: 'border-amber-300 bg-amber-50 text-amber-900',
    good: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  }[tint];
  return (
    <div className={cn('rounded-lg border p-4', tone)}>
      <p className="text-xs font-semibold opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-black leading-tight">{krw(value)}</p>
    </div>
  );
}

function groupByGeneration(members: FamilyMemberScenario[]): Record<Generation, FamilyMemberScenario[]> {
  return {
    elder: members.filter((m) => m.generation === 'elder'),
    primary: members.filter((m) => m.generation === 'primary'),
    younger: members.filter((m) => m.generation === 'younger'),
  };
}

function krw(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억 원`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString('ko-KR')}만 원`;
  return `${n.toLocaleString('ko-KR')}원`;
}
