import { CLAUDE_MODELS, generateText } from '@/lib/ai/claude';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';
import { AIJsonParseError, extractJson } from '@/lib/ai/parser';
import type { ScenarioInput, ScenarioResult } from '@/types/scenario';

/**
 * Build the user-facing prompt for the endgame simulator.
 * The system prompt (see `lib/ai/prompts.ts`) enforces the tone and JSON shape.
 */
function buildPrompt(input: ScenarioInput): string {
  const lines: string[] = [];
  lines.push('아래 고객 정보를 바탕으로 향후 20~30년의 엔딩 시나리오를 생성하세요.');
  lines.push('');
  lines.push('[고객 정보]');
  lines.push(`- 이름: ${input.name}`);
  lines.push(`- 나이: ${input.age}세`);
  lines.push(`- 성별: ${genderKo(input.gender)}`);
  if (input.region) lines.push(`- 거주 지역: ${input.region}`);
  if (input.occupation) lines.push(`- 직업: ${input.occupation}`);
  if (input.household_size) lines.push(`- 가구원 수: ${input.household_size}명`);
  if (input.dependents) lines.push(`- 부양 가족: ${input.dependents}명`);
  if (input.monthly_income_krw) lines.push(`- 월 소득: ${krw(input.monthly_income_krw)}`);
  if (input.financial_assets_krw) lines.push(`- 금융 자산: ${krw(input.financial_assets_krw)}`);
  if (input.real_estate_krw) lines.push(`- 부동산: ${krw(input.real_estate_krw)}`);
  if (input.debt_krw) lines.push(`- 부채: ${krw(input.debt_krw)}`);
  if (input.existing_sangjo_monthly_krw)
    lines.push(`- 기존 상조 월 납입: ${krw(input.existing_sangjo_monthly_krw)}`);
  if (input.insurance_monthly_krw)
    lines.push(`- 보험 월 납입: ${krw(input.insurance_monthly_krw)}`);
  if (input.health_notes) lines.push(`- 건강·가족 메모: ${input.health_notes}`);

  lines.push('');
  lines.push('[요구 출력]');
  lines.push('다음 JSON 스키마를 정확히 따라 한국어로 작성하세요. JSON 외의 텍스트는 절대 출력하지 마세요.');
  lines.push('');
  lines.push('{');
  lines.push('  "headline": "2~3 문장 요약. 공포 자극 금지, 통계 기반.",');
  lines.push('  "life_expectancy_range": { "low": number, "high": number, "source": "예: 통계청 2023 생명표" },');
  lines.push('  "timeline": [');
  lines.push('    {');
  lines.push('      "age": number,');
  lines.push('      "category": "health|care|funeral|inheritance|milestone",');
  lines.push('      "title": "짧은 라벨",');
  lines.push('      "detail": "1~2 문장 객관적 설명",');
  lines.push('      "estimated_cost_krw": number (선택),');
  lines.push('      "probability": number (0~1, 선택),');
  lines.push('      "source": "출처 (선택)"');
  lines.push('    }');
  lines.push('  ],');
  lines.push('  "costs": {');
  lines.push('    "lifetime_medical_krw": number,');
  lines.push('    "care_total_krw": number,');
  lines.push('    "care_monthly_krw": number,');
  lines.push('    "care_avg_months": number,');
  lines.push('    "funeral_krw": number,');
  lines.push('    "inheritance_tax_krw": number,');
  lines.push('    "total_need_krw": number');
  lines.push('  },');
  lines.push('  "coverage_gap": {');
  lines.push('    "currently_covered_krw": number,');
  lines.push('    "shortfall_krw": number,');
  lines.push('    "summary": "1 문장"');
  lines.push('  },');
  lines.push('  "planner_talking_points": ["문장1", "문장2", "문장3"],');
  lines.push('  "disclaimer": "본 시나리오는 통계 기반 참고 자료이며, 의학·법률·세무 자문은 전문가 확인이 필요합니다."');
  lines.push('}');
  lines.push('');
  lines.push('[작성 규칙]');
  lines.push('- timeline은 5~10개 이벤트, 나이 오름차순 정렬.');
  lines.push('- 모든 금액은 원(KRW) 정수, 만 원 단위 반올림 허용.');
  lines.push('- 고객 언급 없이 단정하지 않습니다. ("확정", "분명히" 등 금지)');
  lines.push('- 모든 출처(source)는 실제 존재하는 공공 통계나 보고서 이름으로 표기.');
  lines.push('- JSON 외 어떤 텍스트도 출력하지 마세요.');

  return lines.join('\n');
}

export async function generateEndingScenario(input: ScenarioInput): Promise<{
  result: ScenarioResult;
  model: string;
}> {
  const model = CLAUDE_MODELS.SONNET;
  const raw = await generateText(buildPrompt(input), {
    model,
    system: SYSTEM_PROMPTS.ENDGAME_SIMULATOR,
    maxTokens: 4096,
    temperature: 0.4,
  });

  try {
    const parsed = extractJson<ScenarioResult>(raw);
    return { result: sanitize(parsed), model };
  } catch (e) {
    if (e instanceof AIJsonParseError) throw e;
    throw new AIJsonParseError('시나리오 파싱 실패', raw);
  }
}

/**
 * Clamp + coerce loosely-typed AI output into the ScenarioResult shape.
 * We trust the schema but defensively normalize arrays/numbers so the UI
 * never crashes on a slightly off response.
 */
function sanitize(r: ScenarioResult): ScenarioResult {
  const timeline = Array.isArray(r.timeline)
    ? r.timeline
        .filter((e) => e && typeof e.age === 'number' && typeof e.title === 'string')
        .sort((a, b) => a.age - b.age)
    : [];

  const disclaimer =
    r.disclaimer?.trim() ||
    '본 시나리오는 통계 기반 참고 자료이며, 의학·법률·세무 자문은 전문가 확인이 필요합니다.';

  return { ...r, timeline, disclaimer };
}

function genderKo(g: ScenarioInput['gender']): string {
  return g === 'male' ? '남성' : g === 'female' ? '여성' : '기타';
}

function krw(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}
