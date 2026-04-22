'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RecomputeButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setMsg(null);
    const res = await fetch('/api/retention/recompute', { method: 'POST' });
    setRunning(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(body.error ?? '재계산 실패');
      return;
    }
    const { inserted } = (await res.json()) as { inserted: number };
    setMsg(`${inserted}개 계약 재계산 완료`);
    startTransition(() => router.refresh());
  }

  const busy = running || pending;

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={run}
        disabled={busy}
        className="h-10 px-3"
      >
        <RefreshCw className={busy ? 'mr-1.5 h-3.5 w-3.5 animate-spin' : 'mr-1.5 h-3.5 w-3.5'} />
        {busy ? '재계산 중…' : '지금 재계산'}
      </Button>
    </div>
  );
}
