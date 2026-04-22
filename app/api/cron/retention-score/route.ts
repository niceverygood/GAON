import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { scoreContract, type Factor } from '@/lib/retention/scorer';
import type { Client, SangjoContract } from '@/types/db';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const BATCH_SIZE = 500;

/**
 * Cron entrypoint. Recomputes retention scores for every active contract.
 *
 * Called daily via `vercel.json` schedule OR manually with header
 * `x-cron-secret: $CRON_SECRET`. Uses the service-role client so it can
 * bypass RLS when writing scores in bulk.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get('x-cron-secret');
  const vercelAuth = request.headers.get('authorization');
  const authed =
    (!!secret && header === secret) ||
    (!!secret && vercelAuth === `Bearer ${secret}`);

  if (!authed) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const startedAt = Date.now();
  let processed = 0;
  let inserted = 0;
  let from = 0;

  while (true) {
    const { data: contracts, error } = await supabase
      .from('sangjo_contracts')
      .select(
        'id, client_id, monthly_payment, total_months, paid_months, contract_date, status, clients(family_json, asset_json, phone, notes)',
      )
      .eq('status', 'active')
      .range(from, from + BATCH_SIZE - 1)
      .returns<
        Array<
          Pick<
            SangjoContract,
            'id' | 'client_id' | 'monthly_payment' | 'total_months' | 'paid_months' | 'contract_date' | 'status'
          > & { clients: Pick<Client, 'family_json' | 'asset_json' | 'phone' | 'notes'> | null }
        >
      >();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!contracts || contracts.length === 0) break;

    const rows = contracts
      .filter((c) => c.clients)
      .map((c) => {
        const result = scoreContract({
          contract: c,
          client: c.clients!,
        });
        return {
          contract_id: c.id,
          score: result.score,
          factors: serializeFactors(result.factors, result.tier),
          recommended_action: result.recommended_action,
        };
      });

    if (rows.length) {
      const { error: insertErr } = await supabase.from('retention_scores').insert(rows);
      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      inserted += rows.length;
    }

    processed += contracts.length;
    if (contracts.length < BATCH_SIZE) break;
    from += BATCH_SIZE;
  }

  return NextResponse.json({
    ok: true,
    processed,
    inserted,
    elapsed_ms: Date.now() - startedAt,
  });
}

/** GET for local verification — requires the same header. */
export async function GET(request: NextRequest) {
  return POST(request);
}

function serializeFactors(factors: Factor[], tier: string): Record<string, unknown> {
  return {
    tier,
    items: factors.map((f) => ({
      key: f.key,
      label: f.label,
      points: f.points,
      hint: f.hint,
    })),
  };
}
