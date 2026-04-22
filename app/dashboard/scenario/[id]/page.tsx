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

type Row = {
  id: string;
  client_id: string;
  created_at: string;
  model: string | null;
  share_token: string | null;
  result: ScenarioResult;
  clients: { name: string; birth_date: string | null; address: string | null } | null;
};

export default async function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('ending_scenarios')
    .select(
      'id, client_id, created_at, model, share_token, result, clients(name, birth_date, address)',
    )
    .eq('id', id)
    .maybeSingle<Row>();

  if (!data) notFound();

  const name = data.clients?.name ?? '고객';
  const tier = detectTier(data.clients?.address);

  // Pull active contract (if any) to feed the funeral-cost gap visualization.
  const { data: contract } = await supabase
    .from('sangjo_contracts')
    .select('product_name, monthly_payment, total_months, paid_months')
    .eq('client_id', data.client_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<{
      product_name: string | null;
      monthly_payment: number | null;
      total_months: number | null;
      paid_months: number | null;
    }>();

  const existing =
    contract && contract.monthly_payment && contract.total_months
      ? {
          monthlyKrw: contract.monthly_payment,
          totalMonths: contract.total_months,
          paidMonths: contract.paid_months ?? 0,
          productName: contract.product_name,
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
