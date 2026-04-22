'use client';

import { useState, useTransition } from 'react';
import { Check, Copy, Link2, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { issueShareTokenAction, revokeShareTokenAction } from './share-actions';

export function ShareButton({
  scenarioId,
  initialToken,
}: {
  scenarioId: string;
  initialToken: string | null;
}) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const shareUrl =
    token && typeof window !== 'undefined'
      ? `${window.location.origin}/share/scenario/${token}`
      : null;

  function issue() {
    setError(null);
    start(async () => {
      const res = await issueShareTokenAction(scenarioId);
      if (res?.error) setError(res.error);
      else if (res?.token) setToken(res.token);
    });
  }

  function revoke() {
    if (!confirm('공유 링크를 해지하시겠습니까? 기존 링크는 즉시 비활성화됩니다.')) return;
    setError(null);
    start(async () => {
      const res = await revokeShareTokenAction(scenarioId);
      if (res?.error) setError(res.error);
      else setToken(null);
    });
  }

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  }

  if (!token) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">고객·가족에게 공유</p>
            <p className="text-xs text-slate-500 mt-0.5">
              로그인 없이 시나리오 결과만 볼 수 있는 읽기 전용 링크를 발급합니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {error && <span className="text-xs text-rose-600">{error}</span>}
            <Button
              type="button"
              onClick={issue}
              disabled={pending}
              className="h-10 px-4 bg-indigo-600 text-white hover:bg-indigo-700 [a]:hover:bg-indigo-700"
            >
              <Link2 className="mr-1.5 h-4 w-4" />
              {pending ? '발급 중…' : '공유 링크 발급'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200 bg-indigo-50/60">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">공유 링크 활성화</p>
            <p className="text-xs text-slate-500 mt-0.5">
              링크를 가진 누구나 이 시나리오 결과를 볼 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={revoke}
              disabled={pending}
              variant="outline"
              size="sm"
              className="h-9 px-3"
            >
              <ShieldOff className="mr-1 h-3.5 w-3.5" />
              해지
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareUrl ?? ''}
            className="flex-1 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            onFocus={(e) => e.currentTarget.select()}
          />
          <Button
            type="button"
            onClick={copy}
            size="sm"
            className="h-10 px-3 bg-indigo-600 text-white hover:bg-indigo-700 [a]:hover:bg-indigo-700"
          >
            {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
