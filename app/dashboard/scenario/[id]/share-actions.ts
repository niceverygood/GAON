'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

export type ShareState = { token?: string; error?: string } | null;

/**
 * Issue (or return existing) share token for an ending scenario.
 * Only the scenario's owning planner can issue a token — RLS enforces this.
 */
export async function issueShareTokenAction(scenarioId: string): Promise<ShareState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '세션이 만료되었습니다.' };

  const { data: scenario, error: fetchErr } = await supabase
    .from('ending_scenarios')
    .select('id, share_token')
    .eq('id', scenarioId)
    .maybeSingle<{ id: string; share_token: string | null }>();

  if (fetchErr || !scenario) return { error: '시나리오를 찾을 수 없습니다.' };
  if (scenario.share_token) return { token: scenario.share_token };

  const token = randomBytes(24).toString('base64url');

  const { error: updateErr } = await supabase
    .from('ending_scenarios')
    .update({ share_token: token, shared_at: new Date().toISOString() })
    .eq('id', scenarioId);

  if (updateErr) return { error: '토큰 발급에 실패했습니다.' };

  revalidatePath(`/dashboard/scenario/${scenarioId}`);
  return { token };
}

export async function revokeShareTokenAction(scenarioId: string): Promise<ShareState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '세션이 만료되었습니다.' };

  const { error } = await supabase
    .from('ending_scenarios')
    .update({ share_token: null, shared_at: null })
    .eq('id', scenarioId);

  if (error) return { error: '토큰 해지에 실패했습니다.' };
  revalidatePath(`/dashboard/scenario/${scenarioId}`);
  return {};
}
