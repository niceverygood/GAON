'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FamilyScenarioView } from '@/components/scenario/FamilyScenarioView';
import type { FamilyScenarioResult } from '@/types/family-scenario';

export function FamilyScenarioLauncher({
  clientId,
  clientName,
  clientAge,
  memberCount,
}: {
  clientId: string;
  clientName: string;
  clientAge: number | null;
  memberCount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FamilyScenarioResult | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scenario/family', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? '생성 실패');
        return;
      }
      const { result } = (await res.json()) as { result: FamilyScenarioResult };
      setResult(result);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {clientName}님 · 본인 포함 {memberCount + 1}명 · 3세대 통합 관점
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={run}
            disabled={loading}
            className="h-9 px-3"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {loading ? '재생성 중…' : '다시 생성'}
          </Button>
        </div>
        <FamilyScenarioView result={result} />
      </div>
    );
  }

  if (clientAge == null) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 flex gap-3">
          <TriangleAlert className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
          <div className="space-y-2 text-sm text-amber-900">
            <p className="font-semibold">본인의 생년월일이 입력되지 않았습니다.</p>
            <p>고객 프로필에서 생년월일을 먼저 입력해 주세요.</p>
            <Link
              href={`/dashboard/clients/${clientId}`}
              className="inline-flex items-center gap-1 text-sm font-semibold underline"
            >
              프로필로 이동
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-8 md:p-12 text-center space-y-5 max-w-xl mx-auto">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight">
            3세대 가족 통합 엔딩 분석
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            본인 + 가족 {memberCount}명을 한번에 분석합니다. 세대별 엔딩 비용,
            상호 영향, 우선순위 액션까지 한 화면에.
          </p>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button
          type="button"
          onClick={run}
          disabled={loading}
          className="h-11 px-6 bg-violet-600 text-white hover:bg-violet-700 [a]:hover:bg-violet-700"
        >
          <Sparkles className="mr-1.5 h-4 w-4" />
          {loading ? 'AI 통합 분석 중… (최대 60초)' : '통합 분석 생성'}
        </Button>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          생성 결과는 세션 메모리에만 유지되며 별도 저장되지 않습니다.
          고객에게 공유하려면 먼저 개별 엔딩 시나리오를 생성해 주세요.
        </p>
      </CardContent>
    </Card>
  );
}
