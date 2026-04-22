import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { ScenarioResultView } from '@/components/scenario/ScenarioResultView';
import { FuneralCostCompare } from '@/components/scenario/FuneralCostCompare';
import { detectTier } from '@/lib/funeral/benchmarks';
import type { ScenarioResult } from '@/types/scenario';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SharedScenarioRow = {
  id: string;
  created_at: string;
  result: ScenarioResult;
  clients: { name: string; address: string | null } | null;
  planners: { name: string | null; organizations: { name: string } | null } | null;
};

export default async function SharedScenarioPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 16) notFound();

  const supabase = await createServiceClient();

  const { data } = await supabase
    .from('ending_scenarios')
    .select(
      'id, created_at, result, clients(name, address), planners(name, organizations(name))',
    )
    .eq('share_token', token)
    .maybeSingle<SharedScenarioRow>();

  if (!data) notFound();

  const clientName = data.clients?.name ?? '고객';
  const tier = detectTier(data.clients?.address);
  const planner = data.planners;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:py-14 space-y-8">
      {/* Intro */}
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
          상담 참고 자료
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          {clientName}님을 위한 엔딩 시나리오
        </h1>
        <p className="text-sm text-slate-500">
          {new Date(data.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          {planner?.name && ` · 담당 ${planner.name} 플래너`}
          {planner?.organizations?.name && ` · ${planner.organizations.name}`}
        </p>
      </section>

      {/* Core scenario (talking points are internal; ScenarioResultView renders them —
          we keep them because the shared audience often includes the planner
          in the same room; but we soften with a leading note). */}
      <section>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 leading-relaxed mb-6">
          이 페이지는 담당 플래너가 상담을 위해 생성한 개인 맞춤 자료입니다.
          숫자는 통계 기반 추정이며, 확정된 예측이 아닙니다.
        </div>
        <ScenarioResultView result={data.result} />
      </section>

      {/* Funeral cost contextualization */}
      {data.result.costs?.funeral_krw > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-black tracking-tight">지역 평균과의 장례비 비교</h2>
          <FuneralCostCompare tier={tier} totalKrw={data.result.costs.funeral_krw} compact />
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white px-5 py-4">
        <p className="text-sm text-slate-700 leading-relaxed">
          더 자세한 설명은 담당 플래너에게 문의해 주세요. 가족 구성이나 건강 상황에 변화가 있다면
          시나리오를 다시 생성해 갱신할 수 있습니다.
        </p>
      </section>
    </div>
  );
}
