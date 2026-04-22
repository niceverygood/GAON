/**
 * Tolerant JSON extractor for Claude outputs.
 *
 * Claude is good at emitting JSON but sometimes wraps it in prose or code fences.
 * This helper strips fences and extracts the outermost `{...}` block, so callers
 * can consume structured AI output without brittle string templates.
 */

export class AIJsonParseError extends Error {
  constructor(message: string, public readonly raw: string) {
    super(message);
    this.name = 'AIJsonParseError';
  }
}

export function extractJson<T = unknown>(raw: string): T {
  const trimmed = stripCodeFences(raw).trim();

  const direct = safeParse<T>(trimmed);
  if (direct.ok) return direct.value;

  const braced = extractBraced(trimmed);
  if (braced) {
    const parsed = safeParse<T>(braced);
    if (parsed.ok) return parsed.value;
  }

  throw new AIJsonParseError('AI 응답에서 JSON을 추출하지 못했습니다.', raw);
}

function stripCodeFences(s: string): string {
  const fenceStart = s.indexOf('```');
  if (fenceStart === -1) return s;
  const afterFirst = s.slice(fenceStart + 3);
  const langStripped = afterFirst.replace(/^[a-zA-Z0-9_-]*\n/, '');
  const fenceEnd = langStripped.lastIndexOf('```');
  return fenceEnd === -1 ? langStripped : langStripped.slice(0, fenceEnd);
}

function extractBraced(s: string): string | null {
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  return s.slice(first, last + 1);
}

function safeParse<T>(raw: string): { ok: true; value: T } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch {
    return { ok: false };
  }
}
