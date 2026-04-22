'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type ClientOption = { id: string; name: string; birth_date: string | null };

export function ScenarioLauncher({
  clients,
  defaultClientId,
}: {
  clients: ClientOption[];
  defaultClientId: string;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(defaultClientId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = clients.find((c) => c.id === clientId);
  const missingBirth = selected && !selected.birth_date;

  async function run() {
    setError(null);
    const res = await fetch('/api/scenario', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: clientId }),
    });

    if (!res.ok) {
      const { error: msg } = (await res.json().catch(() => ({}))) as { error?: string };
      setError(msg ?? '시나리오 생성에 실패했습니다.');
      return;
    }

    const { id } = (await res.json()) as { id: string };
    startTransition(() => {
      router.push(`/dashboard/scenario/${id}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="client">고객</Label>
        <select
          id="client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.birth_date ? ` · ${c.birth_date}` : ' (생년월일 미입력)'}
            </option>
          ))}
        </select>
      </div>

      {missingBirth && (
        <p className="text-sm text-amber-700">
          선택한 고객은 생년월일이 없어 시나리오를 생성할 수 없습니다. 고객 정보를 먼저 보완해 주세요.
        </p>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Button
        type="button"
        onClick={() => {
          startTransition(run);
        }}
        disabled={pending || !!missingBirth}
        className="h-11 px-6 bg-indigo-600 text-white hover:bg-indigo-700 [a]:hover:bg-indigo-700"
      >
        <Sparkles className="mr-1.5 h-4 w-4" />
        {pending ? 'AI 시뮬레이션 중…' : '시나리오 생성하기'}
      </Button>

      <p className="text-xs text-slate-500 leading-relaxed">
        생성된 시나리오는 통계 기반 참고 자료이며, 의학·법률·세무 자문은 전문가 확인이 필요합니다.
      </p>
    </div>
  );
}
