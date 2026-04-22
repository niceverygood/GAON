'use client';

import { useState } from 'react';
import { MessageCircle, Phone, Send, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { OutreachResult, OutreachScript } from '@/lib/retention/script';

export function ScriptPanel({ contractId, disabled }: { contractId: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OutreachResult | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/retention/script', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contract_id: contractId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? '화법 생성 실패');
        return;
      }
      const { result } = (await res.json()) as { result: OutreachResult };
      setResult(result);
    } finally {
      setLoading(false);
    }
  }

  if (!result) {
    return (
      <Card>
        <CardContent className="p-6 md:p-8 text-center space-y-4">
          <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            최신 스코어와 주요 요인을 바탕으로 전화·문자·카톡 3가지 화법을 AI가 제안합니다.
            제안된 문장은 검토 후 사용하세요.
          </p>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button
            type="button"
            onClick={run}
            disabled={loading || disabled}
            className="h-10 px-5 bg-indigo-600 text-white hover:bg-indigo-700 [a]:hover:bg-indigo-700"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            {loading ? '생성 중…' : 'AI 화법 생성'}
          </Button>
          {disabled && (
            <p className="text-xs text-slate-500">
              이 계약에는 스코어가 없습니다. 먼저 <b>지금 재계산</b>을 실행해 주세요.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {result.summary && (
        <Card className="border-indigo-200 bg-indigo-50/40">
          <CardContent className="p-4 text-sm text-slate-800 leading-relaxed">
            {result.summary}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {result.scripts.map((s, i) => (
          <ScriptCard key={i} script={s} />
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={run} disabled={loading} className="h-9">
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        {loading ? '재생성 중…' : '다시 생성'}
      </Button>
    </div>
  );
}

const CHANNEL_META = {
  phone: { icon: Phone, tint: 'bg-indigo-100 text-indigo-700', label: '전화' },
  sms: { icon: Send, tint: 'bg-emerald-100 text-emerald-700', label: '문자' },
  kakao: { icon: MessageCircle, tint: 'bg-amber-100 text-amber-800', label: '카카오' },
} as const;

function ScriptCard({ script }: { script: OutreachScript }) {
  const meta = CHANNEL_META[script.channel] ?? CHANNEL_META.phone;
  const Icon = meta.icon;
  const [copied, setCopied] = useState(false);

  const fullText = [script.opening, script.body, script.closing].filter(Boolean).join('\n\n');

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className={cn('inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold', meta.tint)}>
            <Icon className="h-3 w-3" />
            {script.label || meta.label}
          </span>
          <button
            type="button"
            onClick={copy}
            className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
        <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
          {script.opening && <p>{script.opening}</p>}
          {script.body && <p className="mt-2">{script.body}</p>}
          {script.closing && <p className="mt-2 text-slate-600">{script.closing}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
