import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scoreContract, type Factor } from '@/lib/retention/scorer';
import type { Client, SangjoContract } from '@/types/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Planner-triggered recompute. Scopes to the caller's own active contracts
 * using RLS — safe to expose to the dashboard. Inserts one fresh score row
 * per contract so `latest_retention_scores` reflects "just now".
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: contracts, error } = await supabase
    .from('sangjo_contracts')
    .select(
      'id, client_id, monthly_payment, total_months, paid_months, contract_date, status, clients(family_json, asset_json, phone, notes)',
    )
    .eq('planner_id', user.id)
    .eq('status', 'active')
    .returns<
      Array<
        Pick<
          SangjoContract,
          | 'id'
          | 'client_id'
          | 'monthly_payment'
          | 'total_months'
          | 'paid_months'
          | 'contract_date'
          | 'status'
        > & { clients: Pick<Client, 'family_json' | 'asset_json' | 'phone' | 'notes'> | null }
      >
    >();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!contracts || contracts.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  const rows = contracts
    .filter((c) => c.clients)
    .map((c) => {
      const result = scoreContract({ contract: c, client: c.clients! });
      return {
        contract_id: c.id,
        score: result.score,
        factors: {
          tier: result.tier,
          items: result.factors.map((f: Factor) => ({
            key: f.key,
            label: f.label,
            points: f.points,
            hint: f.hint,
          })),
        },
        recommended_action: result.recommended_action,
      };
    });

  // retention_scores has no user-facing INSERT policy yet; we need to allow
  // the service role to write. The scorer is deterministic so bypassing RLS
  // with the service client is safe for this planner-scoped loop.
  const { createServiceClient } = await import('@/lib/supabase/server');
  const service = await createServiceClient();
  const { error: insertErr } = await service.from('retention_scores').insert(rows);

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: rows.length });
}
