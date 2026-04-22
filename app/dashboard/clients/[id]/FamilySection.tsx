'use client';

import { useActionState, useState, useTransition } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Users2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  addFamilyMemberAction,
  removeFamilyMemberAction,
  type FamilyActionState,
} from './family-actions';
import type { FamilyMember, FamilyRelation } from '@/types/db';

const RELATION_LABELS: Record<FamilyRelation, string> = {
  spouse: '배우자',
  parent: '부모',
  parent_in_law: '배우자 부모',
  child: '자녀',
  sibling: '형제자매',
  grandchild: '손주',
  other: '기타',
};

export function FamilySection({
  clientId,
  members,
}: {
  clientId: string;
  members: FamilyMember[];
}) {
  const [open, setOpen] = useState(members.length === 0);
  const action = addFamilyMemberAction.bind(null, clientId);
  const [state, formAction, pending] = useActionState<FamilyActionState, FormData>(action, null);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-black tracking-tight">가족 구성원</h3>
          <p className="text-sm text-slate-500">
            입력한 가족은 3세대 통합 엔딩 분석에 함께 포함됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {members.length >= 1 && (
            <Link
              href={`/dashboard/scenario/family/${clientId}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white hover:bg-violet-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              가족 통합 분석
            </Link>
          )}
          {!open && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 px-3"
              onClick={() => setOpen(true)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              가족 추가
            </Button>
          )}
        </div>
      </div>

      {members.length === 0 ? (
        <Card className="border-dashed mb-4">
          <CardContent className="p-6 text-center space-y-2">
            <Users2 className="mx-auto h-5 w-5 text-slate-400" />
            <p className="text-sm text-slate-500">
              등록된 가족이 없습니다. 배우자·부모·자녀 중 한 명이라도 추가하면 3세대 통합 분석을 실행할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-4">
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{m.name}</span>
                      <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold', RELATION_TINT[m.relation])}>
                        {RELATION_LABELS[m.relation]}
                      </span>
                      <span className="text-xs text-slate-500">{m.age}세</span>
                    </div>
                    {(m.health_note || m.financial_note) && (
                      <p className="mt-1 text-xs text-slate-500 truncate">
                        {[m.health_note, m.financial_note].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <RemoveButton clientId={clientId} memberId={m.id} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {open && (
        <Card>
          <CardContent className="p-6">
            <form action={formAction} className="grid md:grid-cols-2 gap-4">
              <Field label="이름 *" htmlFor="name">
                <Input id="name" name="name" required placeholder="홍영희" className="h-10" />
              </Field>
              <Field label="관계 *" htmlFor="relation">
                <select
                  id="relation"
                  name="relation"
                  required
                  defaultValue="spouse"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {Object.entries(RELATION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="나이 *" htmlFor="age">
                <Input id="age" name="age" type="number" min={0} max={120} required className="h-10" />
              </Field>
              <Field label="성별" htmlFor="gender">
                <select
                  id="gender"
                  name="gender"
                  defaultValue=""
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">선택 안 함</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              </Field>
              <Field label="건강 메모 (선택)" htmlFor="health_note" className="md:col-span-2">
                <Input
                  id="health_note"
                  name="health_note"
                  placeholder="예) 당뇨 관리 중"
                  className="h-10"
                />
              </Field>
              <Field label="재무 메모 (선택)" htmlFor="financial_note" className="md:col-span-2">
                <Input
                  id="financial_note"
                  name="financial_note"
                  placeholder="예) 자가 소유, 소득 없음"
                  className="h-10"
                />
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
                  {pending ? '추가 중…' : '가족 추가'}
                </Button>
                {members.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="h-9"
                  >
                    닫기
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

function RemoveButton({ clientId, memberId }: { clientId: string; memberId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        if (!confirm('이 가족 구성원을 삭제하시겠습니까?')) return;
        start(async () => {
          await removeFamilyMemberAction(clientId, memberId);
        });
      }}
      disabled={pending}
      className="text-slate-400 hover:text-rose-600 transition"
      aria-label="가족 구성원 삭제"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

const RELATION_TINT: Record<FamilyRelation, string> = {
  spouse: 'bg-rose-100 text-rose-700',
  parent: 'bg-indigo-100 text-indigo-700',
  parent_in_law: 'bg-violet-100 text-violet-700',
  child: 'bg-amber-100 text-amber-700',
  sibling: 'bg-emerald-100 text-emerald-700',
  grandchild: 'bg-sky-100 text-sky-700',
  other: 'bg-slate-200 text-slate-700',
};

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
