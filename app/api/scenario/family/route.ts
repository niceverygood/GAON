import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildFamilyInput, generateFamilyScenario } from '@/lib/scenario/family-generator';
import { AIJsonParseError } from '@/lib/ai/parser';
import type { Client } from '@/types/db';

export const runtime = 'nodejs';
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { client_id?: string } | null;
  const clientId = body?.client_id;
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 });

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .maybeSingle<Client>();

  if (!client) return NextResponse.json({ error: 'client not found' }, { status: 404 });

  const age = ageFromBirth(client.birth_date);
  if (age == null) {
    return NextResponse.json(
      { error: '고객의 생년월일이 없어 분석을 생성할 수 없습니다.' },
      { status: 400 },
    );
  }

  try {
    const { result, model } = await generateFamilyScenario(buildFamilyInput(client, age));
    return NextResponse.json({ result, model });
  } catch (e) {
    if (e instanceof AIJsonParseError) {
      return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 502 });
    }
    console.error('[scenario/family] failed', e);
    return NextResponse.json({ error: '가족 시나리오 생성 실패' }, { status: 500 });
  }
}

function ageFromBirth(birth: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
