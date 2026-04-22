'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FuneralCostCompare } from '@/components/scenario/FuneralCostCompare';
import { BENCHMARKS, benchmarkFor, type RegionTier } from '@/lib/funeral/benchmarks';

export function FuneralCostTool() {
  const [tier, setTier] = useState<RegionTier>('metro');
  const [scale, setScale] = useState<number>(100);
  const [monthly, setMonthly] = useState<number>(39_900);
  const [totalMonths, setTotalMonths] = useState<number>(120);
  const [paidMonths, setPaidMonths] = useState<number>(24);

  const totalKrw = useMemo(() => {
    const base = benchmarkFor(tier).total_krw;
    return Math.round((base * scale) / 100);
  }, [tier, scale]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 md:p-8 grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>지역</Label>
              <div className="grid grid-cols-4 gap-2">
                {BENCHMARKS.map((b) => (
                  <button
                    key={b.tier}
                    type="button"
                    onClick={() => setTier(b.tier)}
                    className={`h-10 rounded-lg border text-sm font-semibold transition ${
                      tier === b.tier
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scale">규모 조정 (%)</Label>
              <div className="flex items-center gap-3">
                <input
                  id="scale"
                  type="range"
                  min={60}
                  max={180}
                  step={5}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-sm font-bold text-slate-900 text-right">{scale}%</span>
              </div>
              <p className="text-[11px] text-slate-500">
                식장 등급·문상객 수에 따라 조정. 기본 100% = 지역 평균.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Label>현재 상조 계약</Label>
            <div className="grid grid-cols-3 gap-3">
              <Field label="월 납입">
                <Input
                  type="number"
                  min={0}
                  value={monthly}
                  onChange={(e) => setMonthly(Number(e.target.value) || 0)}
                  className="h-10"
                />
              </Field>
              <Field label="총 개월">
                <Input
                  type="number"
                  min={1}
                  value={totalMonths}
                  onChange={(e) => setTotalMonths(Number(e.target.value) || 1)}
                  className="h-10"
                />
              </Field>
              <Field label="납입 개월">
                <Input
                  type="number"
                  min={0}
                  max={totalMonths}
                  value={paidMonths}
                  onChange={(e) => setPaidMonths(Number(e.target.value) || 0)}
                  className="h-10"
                />
              </Field>
            </div>
            <p className="text-[11px] text-slate-500">
              입력값은 저장되지 않습니다. 고객 프로필 기반 상세 비교는 고객 페이지에서.
            </p>
          </div>
        </CardContent>
      </Card>

      <FuneralCostCompare
        tier={tier}
        totalKrw={totalKrw}
        existing={{
          monthlyKrw: monthly,
          totalMonths,
          paidMonths: Math.min(paidMonths, totalMonths),
        }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </div>
  );
}
