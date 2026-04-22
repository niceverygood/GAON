'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ClientFamily, FamilyMember, FamilyRelation, Gender } from '@/types/db';

export type FamilyActionState = { error?: string; ok?: true } | null;

const RELATIONS: FamilyRelation[] = [
  'spouse',
  'parent',
  'parent_in_law',
  'child',
  'sibling',
  'grandchild',
  'other',
];
const GENDERS: Gender[] = ['male', 'female', 'other'];

function str(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}
function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

async function loadFamily(clientId: string): Promise<{
  family: ClientFamily;
  userId: string;
} | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '세션이 만료되었습니다.' };

  const { data } = await supabase
    .from('clients')
    .select('family_json, planner_id')
    .eq('id', clientId)
    .maybeSingle<{ family_json: ClientFamily | null; planner_id: string }>();

  if (!data) return { error: '고객을 찾을 수 없습니다.' };

  const family: ClientFamily = data.family_json ?? {};
  return { family, userId: user.id };
}

async function saveFamily(clientId: string, family: ClientFamily): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase.from('clients').update({ family_json: family }).eq('id', clientId);
  if (error) return error.message;
  revalidatePath(`/dashboard/clients/${clientId}`);
  return null;
}

export async function addFamilyMemberAction(
  clientId: string,
  _: FamilyActionState,
  formData: FormData,
): Promise<FamilyActionState> {
  const ctx = await loadFamily(clientId);
  if ('error' in ctx) return { error: ctx.error };

  const name = str(formData.get('name'));
  const relation = str(formData.get('relation')) as FamilyRelation;
  const age = intOrNull(formData.get('age'));
  const gender = str(formData.get('gender')) as Gender | '';

  if (!name || !RELATIONS.includes(relation) || age == null || age < 0) {
    return { error: '이름·관계·나이는 필수입니다.' };
  }

  const member: FamilyMember = {
    id: crypto.randomUUID(),
    relation,
    name,
    age,
    gender: GENDERS.includes(gender as Gender) ? (gender as Gender) : undefined,
    health_note: str(formData.get('health_note')) || undefined,
    financial_note: str(formData.get('financial_note')) || undefined,
  };

  const members = [...(ctx.family.members ?? []), member];
  const summary = summarize(members, ctx.family);

  const err = await saveFamily(clientId, { ...ctx.family, ...summary, members });
  if (err) return { error: '저장 실패' };
  return { ok: true };
}

export async function removeFamilyMemberAction(clientId: string, memberId: string): Promise<void> {
  const ctx = await loadFamily(clientId);
  if ('error' in ctx) return;

  const members = (ctx.family.members ?? []).filter((m) => m.id !== memberId);
  const summary = summarize(members, ctx.family);
  await saveFamily(clientId, { ...ctx.family, ...summary, members });
}

/** Keep the quick-read count fields in sync with the members array. */
function summarize(
  members: FamilyMember[],
  prev: ClientFamily,
): Pick<ClientFamily, 'spouse' | 'children' | 'parents_alive'> {
  const spouse = members.some((m) => m.relation === 'spouse') || (prev.spouse ?? false);
  const children = members.filter((m) => m.relation === 'child').length || (prev.children ?? 0);
  const parents =
    members.filter((m) => m.relation === 'parent' || m.relation === 'parent_in_law').length ||
    (prev.parents_alive ?? 0);
  return { spouse, children, parents_alive: parents };
}
