import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateOutreachScripts } from '@/lib/retention/script';
import { AIJsonParseError } from '@/lib/ai/parser';
import { tierOf } from '@/lib/retention/scorer';

export const runtime = 'nodejs';
export const maxDuration = 45;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { contract_id?: string } | null;
  const contractId = body?.contract_id;
  if (!contractId) {
    return NextResponse.json({ error: 'contract_id required' }, { status: 400 });
  }

  const { data: contract } = await supabase
    .from('sangjo_contracts')
    .select('id, product_name, monthly_payment, paid_months, total_months, clients(name)')
    .eq('id', contractId)
    .maybeSingle<{
      id: string;
      product_name: string | null;
      monthly_payment: number | null;
      paid_months: number | null;
      total_months: number | null;
      clients: { name: string } | null;
    }>();

  if (!contract || !contract.clients) {
    return NextResponse.json({ error: 'contract not found' }, { status: 404 });
  }

  const { data: latest } = await supabase
    .from('retention_scores')
    .select('score, factors')
    .eq('contract_id', contractId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle<{
      score: number;
      factors: { tier?: string; items?: Array<{ label: string; points: number; hint?: string }> };
    }>();

  if (!latest) {
    return NextResponse.json(
      { error: '이 계약의 스코어가 없습니다. 먼저 재계산하세요.' },
      { status: 400 },
    );
  }

  try {
    const { result, model } = await generateOutreachScripts({
      client_name: contract.clients.name,
      tier: tierOf(latest.score),
      score: latest.score,
      factors: latest.factors?.items ?? [],
      product_name: contract.product_name,
      monthly_payment: contract.monthly_payment,
      paid_months: contract.paid_months,
      total_months: contract.total_months,
    });

    return NextResponse.json({ result, model });
  } catch (e) {
    if (e instanceof AIJsonParseError) {
      return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 502 });
    }
    console.error('[retention/script] failed', e);
    return NextResponse.json({ error: '화법 생성 실패' }, { status: 500 });
  }
}
