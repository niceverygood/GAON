import Anthropic from '@anthropic-ai/sdk';

export const CLAUDE_MODELS = {
  // 기본 — 시나리오·화법·유족 안내 등 대부분의 작업
  SONNET: 'claude-sonnet-4-5',
  // 품질 크리티컬 — 유언장 초안·복잡한 엔딩 시나리오
  OPUS: 'claude-opus-4-7',
  // 대량·저비용 — 요약·분류·간단한 룰 판정
  HAIKU: 'claude-haiku-4-5',
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

let _client: Anthropic | null = null;

export function getAnthropic() {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

type GenerateOptions = {
  model?: ClaudeModel;
  system?: string;
  maxTokens?: number;
  temperature?: number;
};

/**
 * Single-shot text generation. For tool-use or streaming, use getAnthropic() directly.
 */
export async function generateText(
  prompt: string,
  { model = CLAUDE_MODELS.SONNET, system, maxTokens = 4096, temperature = 0.7 }: GenerateOptions = {},
): Promise<string> {
  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
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
