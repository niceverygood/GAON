'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ClientAssets, ClientFamily, Gender } from '@/types/db';

export type ClientFormState = { error?: string } | null;

function str(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}

function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (!s) return null;
  const n = Number.parseInt(s.replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function genderOrNull(v: FormDataEntryValue | null): Gender | null {
  const s = str(v);
  return s === 'male' || s === 'female' || s === 'other' ? s : null;
}

export async function createClientAction(
  _: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: '세션이 만료되었습니다. 다시 로그인해 주세요.' };

  const name = str(formData.get('name'));
  if (!name) return { error: '고객 이름은 필수입니다.' };

  const family: ClientFamily = {
    spouse: str(formData.get('spouse')) === 'on',
    children: intOrNull(formData.get('children')) ?? 0,
    parents_alive: intOrNull(formData.get('parents_alive')) ?? 0,
  };

  const assets: ClientAssets = {
    real_estate: intOrNull(formData.get('real_estate_krw')) ?? 0,
    financial: intOrNull(formData.get('financial_krw')) ?? 0,
    debt: intOrNull(formData.get('debt_krw')) ?? 0,
    monthly_income: intOrNull(formData.get('monthly_income_krw')) ?? 0,
    existing_sangjo_monthly: intOrNull(formData.get('existing_sangjo_monthly_krw')) ?? 0,
    insurance_monthly: intOrNull(formData.get('insurance_monthly_krw')) ?? 0,
  };

  const { data, error } = await supabase
    .from('clients')
    .insert({
      planner_id: user.id,
      name,
      birth_date: str(formData.get('birth_date')) || null,
      gender: genderOrNull(formData.get('gender')),
      phone: str(formData.get('phone')) || null,
      address: str(formData.get('address')) || null,
      occupation: str(formData.get('occupation')) || null,
      notes: str(formData.get('notes')) || null,
      family_json: family,
      asset_json: assets,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { error: '고객 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/clients');
  redirect(`/dashboard/clients/${data.id}`);
}

export async function deleteClientAction(clientId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('clients').delete().eq('id', clientId);
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/clients');
  redirect('/dashboard/clients');
}
