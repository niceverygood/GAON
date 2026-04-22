'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createClientAction, type ClientFormState } from '../actions';

export function ClientForm() {
  const [state, action, pending] = useActionState<ClientFormState, FormData>(createClientAction, null);

  return (
    <form action={action} className="space-y-6 max-w-3xl">
      <Card>
        <CardContent className="p-6 space-y-6">
          <SectionHeader title="기본 정보" desc="필수 항목은 이름뿐입니다. 나머지는 상담 중 채워도 됩니다." />

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="이름 *" htmlFor="name">
              <Input id="name" name="name" required placeholder="홍길동" className="h-11" />
            </Field>
            <Field label="전화번호" htmlFor="phone">
              <Input id="phone" name="phone" inputMode="tel" placeholder="010-0000-0000" className="h-11" />
            </Field>
            <Field label="생년월일" htmlFor="birth_date">
              <Input id="birth_date" name="birth_date" type="date" className="h-11" />
            </Field>
            <Field label="성별" htmlFor="gender">
              <select
                id="gender"
                name="gender"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                defaultValue=""
              >
                <option value="">선택 안 함</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </Field>
            <Field label="직업" htmlFor="occupation" className="md:col-span-2">
              <Input id="occupation" name="occupation" placeholder="예) 자영업, 공무원" className="h-11" />
            </Field>
            <Field label="주소" htmlFor="address" className="md:col-span-2">
              <Input id="address" name="address" placeholder="시·도 / 구·군 정도만 입력해도 됩니다" className="h-11" />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-6">
          <SectionHeader title="가족 구성" desc="상속·간병 시나리오 정확도에 영향을 줍니다." />

          <div className="grid md:grid-cols-3 gap-4 items-end">
            <Field label="자녀 수" htmlFor="children">
              <Input id="children" name="children" type="number" min={0} defaultValue={0} className="h-11" />
            </Field>
            <Field label="생존 부모 수" htmlFor="parents_alive">
              <Input id="parents_alive" name="parents_alive" type="number" min={0} max={2} defaultValue={0} className="h-11" />
            </Field>
            <label className="flex h-11 items-center gap-2 px-3 rounded-lg border border-slate-200 bg-white cursor-pointer">
              <input type="checkbox" name="spouse" className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              <span className="text-sm text-slate-700">배우자 있음</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-6">
          <SectionHeader title="재무 · 상조 (선택)" desc="입력한 범위 안에서 시나리오 정확도가 올라갑니다. 모두 원 단위." />

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="월 소득" htmlFor="monthly_income_krw">
              <NumberInput id="monthly_income_krw" name="monthly_income_krw" placeholder="3,500,000" />
            </Field>
            <Field label="금융 자산" htmlFor="financial_krw">
              <NumberInput id="financial_krw" name="financial_krw" placeholder="100,000,000" />
            </Field>
            <Field label="부동산 자산" htmlFor="real_estate_krw">
              <NumberInput id="real_estate_krw" name="real_estate_krw" placeholder="500,000,000" />
            </Field>
            <Field label="부채" htmlFor="debt_krw">
              <NumberInput id="debt_krw" name="debt_krw" placeholder="200,000,000" />
            </Field>
            <Field label="타사 상조 월 납입" htmlFor="existing_sangjo_monthly_krw">
              <NumberInput id="existing_sangjo_monthly_krw" name="existing_sangjo_monthly_krw" placeholder="29,900" />
            </Field>
            <Field label="보험 월 납입" htmlFor="insurance_monthly_krw">
              <NumberInput id="insurance_monthly_krw" name="insurance_monthly_krw" placeholder="120,000" />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-6">
          <SectionHeader title="메모" desc="상담 중 들은 건강·가족·기타 특이사항." />
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="예) 고혈압 10년 복용 중, 자녀 분가 예정, …"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="h-11 px-6 bg-indigo-600 text-white hover:bg-indigo-700 [a]:hover:bg-indigo-700"
        >
          {pending ? '저장 중…' : '저장'}
        </Button>
        <Link href="/dashboard/clients" className="text-sm text-slate-500 hover:text-slate-800">
          취소
        </Link>
      </div>
    </form>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  );
}

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
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function NumberInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} type="number" inputMode="numeric" min={0} step={1} className="h-11" />;
}
