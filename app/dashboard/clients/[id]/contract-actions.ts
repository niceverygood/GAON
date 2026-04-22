'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ContractFormState = { error?: string; ok?: true } | null;

function str(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}

function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (!s) return null;
  const n = Number.parseInt(s.replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

export async function addContractAction(
  _: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '세션이 만료되었습니다.' };

  const clientId = str(formData.get('client_id'));
  if (!clientId) return { error: '잘못된 요청입니다.' };

  const productName = str(formData.get('product_name')) || null;
  const monthly = intOrNull(formData.get('monthly_payment'));
  const total = intOrNull(formData.get('total_months'));
  const paid = intOrNull(formData.get('paid_months')) ?? 0;
  const contractDate = str(formData.get('contract_date')) || null;

  if (!monthly || !total) {
    return { error: '월 납입금과 총 개월 수는 필수입니다.' };
  }

  const { error } = await supabase.from('sangjo_contracts').insert({
    client_id: clientId,
    planner_id: user.id,
    product_name: productName,
    monthly_payment: monthly,
    total_months: total,
    paid_months: Math.min(paid, total),
    contract_date: contractDate,
    status: 'active',
  });

  if (error) return { error: '계약 저장에 실패했습니다.' };

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { ok: true };
}
