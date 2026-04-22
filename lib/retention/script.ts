import { CLAUDE_MODELS, generateText } from '@/lib/ai/claude';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';
import { AIJsonParseError, extractJson } from '@/lib/ai/parser';
import type { Factor, RiskTier } from './scorer';

export type OutreachChannel = 'phone' | 'sms' | 'kakao';

export type OutreachScript = {
  channel: OutreachChannel;
  label: string;
  opening: string;
  body: string;
  closing: string;
};

export type OutreachResult = {
  summary: string;
  scripts: OutreachScript[];
};

export type OutreachInput = {
  client_name: string;
  tier: RiskTier;
  score: number;
  factors: Array<Pick<Factor, 'label' | 'points' | 'hint'>>;
  product_name: string | null;
  monthly_payment: number | null;
  paid_months: number | null;
  total_months: number | null;
};

export async function generateOutreachScripts(input: OutreachInput): Promise<{
  result: OutreachResult;
  model: string;
}> {
  const prompt = buildPrompt(input);
  const model = CLAUDE_MODELS.SONNET;

  const raw = await generateText(prompt, {
    model,
    system: SYSTEM_PROMPTS.RETENTION_SCRIPT,
    maxTokens: 1500,
    temperature: 0.6,
  });

  try {
    const parsed = extractJson<OutreachResult>(raw);
    return { result: normalize(parsed), model };
  } catch (e) {
    if (e instanceof AIJsonParseError) throw e;
    throw new AIJsonParseError('화법 생성 파싱 실패', raw);
  }
}

function buildPrompt(input: OutreachInput): string {
  const lines: string[] = [];
  lines.push('해약 리스크 고객에게 건넬 수 있는 화법을 3개 제안하세요.');
  lines.push('');
  lines.push('[고객 · 계약]');
  lines.push(`- 고객명: ${input.client_name}`);
  if (input.product_name) lines.push(`- 상품: ${input.product_name}`);
  if (input.monthly_payment) lines.push(`- 월 납입: ${fmt(input.monthly_payment)}`);
  if (input.total_months && input.paid_months != null) {
    lines.push(`- 납입 진도: ${input.paid_months}/${input.total_months}개월`);
  }
  lines.push(`- 리스크: ${input.tier.toUpperCase()} (${input.score}/100)`);

  lines.push('');
  lines.push('[스코어 요인]');
  for (const f of input.factors) {
    lines.push(`- ${f.label} (+${f.points})${f.hint ? ` — ${f.hint}` : ''}`);
  }

  lines.push('');
  lines.push('[요구 출력]');
  lines.push('아래 JSON 스키마를 정확히 따라 한국어로 작성하세요. JSON 외 텍스트 금지.');
  lines.push('');
  lines.push('{');
  lines.push('  "summary": "1~2 문장. 왜 지금 연락해야 하는지 플래너 관점에서 요약.",');
  lines.push('  "scripts": [');
  lines.push('    { "channel": "phone", "label": "전화 오프닝", "opening": "...", "body": "...", "closing": "..." },');
  lines.push('    { "channel": "sms",   "label": "문자 1회차",  "opening": "...", "body": "...", "closing": "..." },');
  lines.push('    { "channel": "kakao", "label": "카톡 안부",   "opening": "...", "body": "...", "closing": "..." }');
  lines.push('  ]');
  lines.push('}');
  lines.push('');
  lines.push('[작성 규칙]');
  lines.push('- 고객의 상황을 먼저 인정하는 문장으로 오프닝. 압박 표현 금지.');
  lines.push('- 본문은 2~3 문장. 해약 방지를 명시적으로 언급하지 않습니다.');
  lines.push('- 문자·카톡은 80자 이내로 간결하게.');
  lines.push('- 정책·약관 인용 시 "담당자 확인 권장"으로 닫기.');

  return lines.join('\n');
}

function normalize(r: OutreachResult): OutreachResult {
  const scripts = Array.isArray(r.scripts) ? r.scripts.filter((s) => s && s.channel) : [];
  return {
    summary: r.summary ?? '',
    scripts,
  };
}

function fmt(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}
