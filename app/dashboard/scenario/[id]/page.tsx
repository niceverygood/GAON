import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/common/Topbar';
import { ScenarioResultView } from '@/components/scenario/ScenarioResultView';
import { FuneralCostCompare } from '@/components/scenario/FuneralCostCompare';
import { detectTier } from '@/lib/funeral/benchmarks';
import type { ScenarioResult } from '@/types/scenario';
import { ShareButton } from './ShareButton';

export const metadata = { title: '시나리오 상세' };

type ContractRow = {
  product_name: string | null;
  monthly_payment: number | null;
  total_months: number | null;
  paid_months: number | null;
  status: string;
  created_at: string;
};

type Row = {
  id: string;
  client_id: string;
  created_at: string;
  model: string | null;
  share_token: string | null;
  result: ScenarioResult;
  clients: {
    name: string;
    birth_date: string | null;
    address: string | null;
    sangjo_contracts: ContractRow[] | null;
  } | null;
};

export default async function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Single round-trip: scenario + client + that client's contracts in one
  // nested select. Collapsing the former two sequential queries into one
  // shaves a Supabase round-trip (~80-200ms).
  const { data } = await supabase
    .from('ending_scenarios')
    .select(
      `id, client_id, created_at, model, share_token, result,
       clients(
         name, birth_date, address,
         sangjo_contracts(product_name, monthly_payment, total_months, paid_months, status, created_at)
       )`,
    )
    .eq('id', id)
    .maybeSingle<Row>();

  if (!data) notFound();

  const name = data.clients?.name ?? '고객';
  const tier = detectTier(data.clients?.address);

  // Pick the most recent active contract for the cost-gap visualization.
  const activeContract =
    data.clients?.sangjo_contracts
      ?.filter((c) => c.status === 'active')
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] ?? null;

  const existing =
    activeContract && activeContract.monthly_payment && activeContract.total_months
      ? {
          monthlyKrw: activeContract.monthly_payment,
          totalMonths: activeContract.total_months,
          paidMonths: activeContract.paid_months ?? 0,
          productName: activeContract.product_name,
        }
      : null;

  return (
    <>
      <Topbar title={`${name} · 엔딩 시나리오`} subtitle={new Date(data.created_at).toLocaleString('ko-KR')} />

      <main className="flex-1 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/clients/${data.client_id}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {name} 프로필로
          </Link>
          {data.model && (
            <span className="text-xs text-slate-400">model · {data.model}</span>
          )}
        </div>

        <ShareButton scenarioId={data.id} initialToken={data.share_token} />

        <ScenarioResultView result={data.result} />

        {data.result.costs?.funeral_krw > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-black tracking-tight">지역 평균 장례비와의 비교</h2>
            <FuneralCostCompare tier={tier} totalKrw={data.result.costs.funeral_krw} existing={existing} />
          </section>
        )}
      </main>
    </>
  );
}
