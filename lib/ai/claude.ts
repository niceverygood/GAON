import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/**
 * Central AI client for Gaon.
 *
 * Two providers are supported:
 *   1. Anthropic native (`ANTHROPIC_API_KEY`) — preferred when available.
 *   2. OpenRouter (`OPENROUTER_API_KEY`) — used as fallback. CLAUDE.md lists
 *      OpenRouter as an optional provider so the product is not blocked on
 *      Anthropic key procurement for pilot customers.
 *
 * Callers see a single `generateText()` entrypoint with the same semantics
 * regardless of which provider is active. `CLAUDE_MODELS.*` tokens are
 * translated to OpenRouter model IDs via `OPENROUTER_MODEL_MAP` when routed
 * through OpenRouter.
 */

export const CLAUDE_MODELS = {
  // 기본 — 시나리오·화법·유족 안내 등 대부분의 작업
  SONNET: 'claude-sonnet-4-5',
  // 품질 크리티컬 — 유언장 초안·복잡한 엔딩 시나리오
  OPUS: 'claude-opus-4-7',
  // 대량·저비용 — 요약·분류·간단한 룰 판정
  HAIKU: 'claude-haiku-4-5',
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

/** Anthropic model id → OpenRouter model id. */
const OPENROUTER_MODEL_MAP: Record<ClaudeModel, string> = {
  [CLAUDE_MODELS.SONNET]: 'anthropic/claude-sonnet-4.5',
  [CLAUDE_MODELS.OPUS]: 'anthropic/claude-opus-4.7',
  [CLAUDE_MODELS.HAIKU]: 'anthropic/claude-haiku-4.5',
};

type Provider = 'anthropic' | 'openrouter';

function activeProvider(): Provider {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';
  throw new Error(
    'No AI provider configured. Set ANTHROPIC_API_KEY or OPENROUTER_API_KEY.',
  );
}

let _anthropic: Anthropic | null = null;
let _openai: OpenAI | null = null;

export function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

function getOpenRouter(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL ?? 'https://gaon.app',
        'X-Title': 'Gaon — 상조 플래너 SaaS',
      },
    });
  }
  return _openai;
}

type GenerateOptions = {
  model?: ClaudeModel;
  system?: string;
  maxTokens?: number;
  temperature?: number;
};

/**
 * Single-shot text generation. For streaming or tool-use, use the underlying
 * SDK directly via `getAnthropic()`.
 */
export async function generateText(
  prompt: string,
  {
    model = CLAUDE_MODELS.SONNET,
    system,
    maxTokens = 4096,
    temperature = 0.7,
  }: GenerateOptions = {},
): Promise<string> {
  const provider = activeProvider();

  if (provider === 'anthropic') {
    const response = await getAnthropic().messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');
  }

  // OpenRouter path — OpenAI-compatible chat completions.
  const openrouterModel = OPENROUTER_MODEL_MAP[model] ?? OPENROUTER_MODEL_MAP[CLAUDE_MODELS.SONNET];
  const completion = await getOpenRouter().chat.completions.create({
    model: openrouterModel,
    max_tokens: maxTokens,
    temperature,
    messages: [
      ...(system ? [{ role: 'system' as const, content: system }] : []),
      { role: 'user', content: prompt },
    ],
  });
  return completion.choices?.[0]?.message?.content ?? '';
}
