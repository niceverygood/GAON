'use client';

import { useActionState, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { addContractAction, type ContractFormState } from './contract-actions';
import type { ContractStatus, SangjoContract } from '@/types/db';

type ContractRow = Pick<
  SangjoContract,
  | 'id'
  | 'product_name'
  | 'monthly_payment'
  | 'total_months'
  | 'paid_months'
  | 'contract_date'
  | 'status'
>;

export function ContractSection({
  clientId,
  contracts,
}: {
  clientId: string;
  contracts: ContractRow[];
}) {
  const [open, setOpen] = useState(contracts.length === 0);
  const [state, action, pending] = useActionState<ContractFormState, FormData>(
    addContractAction,
    null,
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-black tracking-tight">상조 계약</h3>
        {!open && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 px-3"
            onClick={() => setOpen(true)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            계약 추가
          </Button>
        )}
      </div>

      {contracts.length === 0 ? (
        <p className="text-sm text-slate-500 mb-3">
          등록된 계약이 없습니다. 계약을 등록하면 해약 방지 AI 스코어링 대상이 됩니다.
        </p>
      ) : (
        <Card className="mb-4">
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {contracts.map((c) => {
                const pct = c.total_months ? Math.round((c.paid_months / c.total_months) * 100) : 0;
                return (
                  <li key={c.id} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {c.product_name ?? '이름 없는 상품'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          월 {fmt(c.monthly_payment)}원 · {c.paid_months}/{c.total_months}개월 ({pct}%)
                          {c.contract_date && ` · ${c.contract_date}`}
                        </p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {open && (
        <Card>
          <CardContent className="p-6">
            <form action={action} className="grid md:grid-cols-2 gap-4 items-end">
              <input type="hidden" name="client_id" value={clientId} />

              <Field label="상품명" htmlFor="product_name">
                <Input id="product_name" name="product_name" placeholder="예) 프리미엄 A형" />
              </Field>
              <Field label="계약일" htmlFor="contract_date">
                <Input id="contract_date" name="contract_date" type="date" />
              </Field>
              <Field label="월 납입금 *" htmlFor="monthly_payment">
                <Input
                  id="monthly_payment"
                  name="monthly_payment"
                  type="number"
                  min={0}
                  required
                  placeholder="39,900"
                />
              </Field>
              <Field label="총 납입 개월 *" htmlFor="total_months">
                <Input
                  id="total_months"
                  name="total_months"
                  type="number"
                  min={1}
                  required
                  placeholder="120"
                />
              </Field>
              <Field label="현재까지 납입 개월" htmlFor="paid_months">
                <Input id="paid_months" name="paid_months" type="number" min={0} defaultValue={0} />
              </Field>

              {state?.error && (
                <p className="md:col-span-2 text-sm text-rose-600">{state.error}</p>
              )}

              <div className="md:col-span-2 flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={pending}
                  className="h-10 px-4 bg-indigo-600 text-white hover:bg-indigo-700 [a]:hover:bg-indigo-700"
                >
                  {pending ? '저장 중…' : '계약 저장'}
                </Button>
                {contracts.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="h-9"
                  >
                    취소
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: ContractStatus }) {
  const map = {
    active: { tint: 'bg-emerald-100 text-emerald-700', label: '진행 중' },
    paused: { tint: 'bg-amber-100 text-amber-700', label: '정지' },
    terminated: { tint: 'bg-rose-100 text-rose-700', label: '해약' },
    event: { tint: 'bg-slate-200 text-slate-700', label: '장례 발생' },
  } as const;
  const m = map[status] ?? map.active;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold', m.tint)}>
      {m.label}
    </span>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function fmt(n: number | null): string {
  return n == null ? '—' : n.toLocaleString('ko-KR');
}

export { type ContractRow };
