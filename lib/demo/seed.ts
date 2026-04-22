import type { SupabaseClient } from '@supabase/supabase-js';
import {
  SEED_CLIENTS,
  SEED_CONTRACTS,
  SEED_SCENARIOS,
  SEED_SCORES,
} from './seed-data';

export type SeedResult =
  | { seeded: true; clients: number }
  | { seeded: false; reason: 'already_has_data' | 'no_planner_row' };

/**
 * Populate a demo planner with realistic Korean consulting data.
 *
 * Idempotency rule: we only seed when the planner has **zero** clients.
 * This lets the test-login action call this unconditionally — real users
 * who happen to use the demo email will never have their data wiped.
 *
 * Requires a service-role client so the inserts bypass RLS in bulk.
 */
export async function seedDemoPlanner(
  admin: SupabaseClient,
  plannerId: string,
): Promise<SeedResult> {
  // 1. Skip if the account already has data. A single-row HEAD count is cheap.
  const { count: existing, error: existingErr } = await admin
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('planner_id', plannerId);

  if (existingErr) throw existingErr;
  if ((existing ?? 0) > 0) {
    return { seeded: false, reason: 'already_has_data' };
  }

  // 2. Make sure the planner row itself exists. The auth trigger normally
  //    handles this, but demo accounts predating migration 001 may be missing.
  await admin
    .from('planners')
    .upsert({ id: plannerId, name: '테스트 플래너' }, { onConflict: 'id' });

  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();
  const dateOnly = (d: number) =>
    new Date(now - d * 86_400_000).toISOString().slice(0, 10);

  // 3. Insert clients, remembering the generated ids per seed key.
  const clientRows = SEED_CLIENTS.map((c) => ({
    planner_id: plannerId,
    name: c.name,
    birth_date: c.birth_date,
    gender: c.gender,
    phone: c.phone,
    address: c.address,
    occupation: c.occupation,
    family_json: c.family_json,
    asset_json: c.asset_json,
    notes: c.notes,
    created_at: daysAgo(c.created_days_ago),
    updated_at: daysAgo(c.created_days_ago),
  }));
  const { data: insertedClients, error: clientErr } = await admin
    .from('clients')
    .insert(clientRows)
    .select('id, name');

  if (clientErr || !insertedClients) throw clientErr ?? new Error('client insert returned null');

  const clientIdByName = new Map<string, string>();
  insertedClients.forEach((row) => clientIdByName.set(row.name, row.id));
  const clientIdByKey = new Map<string, string>();
  SEED_CLIENTS.forEach((c) => {
    const id = clientIdByName.get(c.name);
    if (id) clientIdByKey.set(c.key, id);
  });

  // 4. Contracts — reference clients by seed key.
  const contractRows = SEED_CONTRACTS.map((k) => ({
    client_id: clientIdByKey.get(k.client_key)!,
    planner_id: plannerId,
    product_name: k.product_name,
    monthly_payment: k.monthly_payment,
    total_months: k.total_months,
    paid_months: k.paid_months,
    contract_date: dateOnly(k.contract_days_ago),
    status: k.status,
    created_at: daysAgo(7),
    updated_at: daysAgo(1),
  }));
  const { data: insertedContracts, error: contractErr } = await admin
    .from('sangjo_contracts')
    .insert(contractRows)
    .select('id, client_id');

  if (contractErr || !insertedContracts) throw contractErr ?? new Error('contract insert returned null');

  // Pair inserted contracts back with seed keys by position (preserved by PG).
  const contractIdByKey = new Map<string, string>();
  SEED_CONTRACTS.forEach((k, i) => {
    const id = insertedContracts[i]?.id;
    if (id) contractIdByKey.set(k.key, id);
  });

  // 5. Pre-baked ending scenarios.
  const scenarioRows = SEED_SCENARIOS.map((s) => ({
    client_id: clientIdByKey.get(s.client_key)!,
    planner_id: plannerId,
    result: s.result,
    model: s.model,
    created_at: daysAgo(s.created_days_ago),
  })).filter((row) => row.client_id);

  if (scenarioRows.length) {
    const { error: scenErr } = await admin.from('ending_scenarios').insert(scenarioRows);
    if (scenErr) throw scenErr;
  }

  // 6. Retention scores — service-role bypasses RLS (no planner write policy).
  const scoreRows = SEED_SCORES.map((s) => ({
    contract_id: contractIdByKey.get(s.contract_key)!,
    score: s.score,
    factors: { tier: s.tier, items: s.factors },
    recommended_action: s.recommended_action,
    computed_at: daysAgo(0.25), // 6 hours ago
  })).filter((row) => row.contract_id);

  if (scoreRows.length) {
    const { error: scoreErr } = await admin.from('retention_scores').insert(scoreRows);
    if (scoreErr) throw scoreErr;
  }

  return { seeded: true, clients: insertedClients.length };
}
