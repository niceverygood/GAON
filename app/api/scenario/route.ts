import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEndingScenario } from '@/lib/scenario/generator';
import { AIJsonParseError } from '@/lib/ai/parser';
import type { Client, ClientAssets, ClientFamily } from '@/types/db';
import type { ScenarioInput } from '@/types/scenario';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { client_id?: string } | null;
  const clientId = body?.client_id;
  if (!clientId) {
    return NextResponse.json({ error: 'client_id required' }, { status: 400 });
  }

  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .maybeSingle<Client>();

  if (clientErr || !client) {
    return NextResponse.json({ error: 'client not found' }, { status: 404 });
  }

  const input = buildInput(client);
  if (input.age == null) {
    return NextResponse.json(
      { error: '고객의 생년월일이 없어 시나리오를 생성할 수 없습니다.' },
      { status: 400 },
    );
  }

  try {
    const { result, model } = await generateEndingScenario(input);

    const { data: saved, error: insertErr } = await supabase
      .from('ending_scenarios')
      .insert({
        client_id: client.id,
        planner_id: user.id,
        result,
        model,
      })
      .select('id')
      .single();

    if (insertErr || !saved) {
      return NextResponse.json({ error: '시나리오 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({ id: saved.id, result });
  } catch (e) {
    if (e instanceof AIJsonParseError) {
      return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 502 });
    }
    console.error('[scenario] generation failed', e);
    return NextResponse.json({ error: '시나리오 생성 실패' }, { status: 500 });
  }
}

function buildInput(client: Client): ScenarioInput & { age: number | null } {
  const age = client.birth_date ? ageFromBirth(client.birth_date) : null;
  const family: ClientFamily = client.family_json ?? {};
  const assets: ClientAssets = client.asset_json ?? {};

  const dependents =
    (family.spouse ? 1 : 0) + (family.children ?? 0) + (family.parents_alive ?? 0);

  return {
    name: client.name,
    age: age ?? 0,
    gender: client.gender ?? 'other',
    region: client.address ?? undefined,
    occupation: client.occupation ?? undefined,
    dependents: dependents || undefined,
    monthly_income_krw: assets.monthly_income || undefined,
    financial_assets_krw: assets.financial || undefined,
    real_estate_krw: assets.real_estate || undefined,
    debt_krw: assets.debt || undefined,
    existing_sangjo_monthly_krw: assets.existing_sangjo_monthly || undefined,
    insurance_monthly_krw: assets.insurance_monthly || undefined,
    health_notes: client.notes ?? undefined,
  };
}

function ageFromBirth(birth: string): number | null {
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
