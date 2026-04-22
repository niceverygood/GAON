import { CLAUDE_MODELS, generateText } from '@/lib/ai/claude';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';
import { AIJsonParseError, extractJson } from '@/lib/ai/parser';
import type { Client, ClientAssets, ClientFamily, FamilyMember } from '@/types/db';
import type { FamilyScenarioResult, Generation } from '@/types/family-scenario';

export type FamilyScenarioInput = {
  client: {
    id: string;
    name: string;
    age: number;
    gender: Client['gender'];
    occupation: string | null;
    region: string | null;
  };
  members: FamilyMember[];
  /** Shared financial context — the household's assets. */
  household_monthly_income_krw?: number;
  household_financial_assets_krw?: number;
  household_real_estate_krw?: number;
  household_debt_krw?: number;
  existing_sangjo_monthly_krw?: number;
  insurance_monthly_krw?: number;
};

export function buildFamilyInput(client: Client, age: number): FamilyScenarioInput {
  const family: ClientFamily = client.family_json ?? {};
  const assets: ClientAssets = client.asset_json ?? {};

  return {
    client: {
      id: client.id,
      name: client.name,
      age,
      gender: client.gender,
      occupation: client.occupation,
      region: client.address,
    },
    members: family.members ?? [],
    household_monthly_income_krw: assets.monthly_income || undefined,
    household_financial_assets_krw: assets.financial || undefined,
    household_real_estate_krw: assets.real_estate || undefined,
    household_debt_krw: assets.debt || undefined,
    existing_sangjo_monthly_krw: assets.existing_sangjo_monthly || undefined,
    insurance_monthly_krw: assets.insurance_monthly || undefined,
  };
}

export async function generateFamilyScenario(input: FamilyScenarioInput): Promise<{
  result: FamilyScenarioResult;
  model: string;
}> {
  const model = CLAUDE_MODELS.SONNET;
  const raw = await generateText(buildPrompt(input), {
    model,
    system: SYSTEM_PROMPTS.FAMILY_SCENARIO,
    maxTokens: 4500,
    temperature: 0.4,
  });

  try {
    const parsed = extractJson<FamilyScenarioResult>(raw);
    return { result: sanitize(parsed, input), model };
  } catch (e) {
    if (e instanceof AIJsonParseError) throw e;
    throw new AIJsonParseError('가족 시나리오 파싱 실패', raw);
  }
}

function buildPrompt(input: FamilyScenarioInput): string {
  const lines: string[] = [];
  lines.push('다음 가족의 3세대 통합 엔딩 시나리오를 생성하세요.');
  lines.push('각 구성원을 개별이 아닌 가족 전체 관점(간병 책임·상속 흐름·경제적 상호 영향)에서 분석하세요.');
  lines.push('');
  lines.push('[상담 대상 본인]');
  lines.push(`- id: self`);
  lines.push(`- 이름: ${input.client.name}`);
  lines.push(`- 나이: ${input.client.age}세`);
  lines.push(`- 성별: ${genderKo(input.client.gender)}`);
  if (input.client.occupation) lines.push(`- 직업: ${input.client.occupation}`);
  if (input.client.region) lines.push(`- 거주 지역: ${input.client.region}`);

  lines.push('');
  lines.push('[가족 구성원]');
  if (input.members.length === 0) {
    lines.push('- (등록된 구성원 없음 — 본인만 분석)');
  } else {
    for (const m of input.members) {
      const parts = [
        `id: ${m.id}`,
        `관계: ${relationKo(m.relation)}`,
        `이름: ${m.name}`,
        `나이: ${m.age}세`,
      ];
      if (m.gender) parts.push(`성별: ${genderKo(m.gender)}`);
      if (m.health_note) parts.push(`건강: ${m.health_note}`);
      if (m.financial_note) parts.push(`재무: ${m.financial_note}`);
      lines.push(`- ${parts.join(' · ')}`);
    }
  }

  lines.push('');
  lines.push('[가계 재무 — 공용]');
  const fin: string[] = [];
  if (input.household_monthly_income_krw) fin.push(`월 소득 ${krw(input.household_monthly_income_krw)}`);
  if (input.household_financial_assets_krw) fin.push(`금융 자산 ${krw(input.household_financial_assets_krw)}`);
  if (input.household_real_estate_krw) fin.push(`부동산 ${krw(input.household_real_estate_krw)}`);
  if (input.household_debt_krw) fin.push(`부채 ${krw(input.household_debt_krw)}`);
  if (input.existing_sangjo_monthly_krw) fin.push(`기존 상조 월 ${krw(input.existing_sangjo_monthly_krw)}`);
  if (input.insurance_monthly_krw) fin.push(`보험 월 ${krw(input.insurance_monthly_krw)}`);
  lines.push(fin.length ? `- ${fin.join(', ')}` : '- (정보 없음)');

  lines.push('');
  lines.push('[요구 출력]');
  lines.push('다음 JSON 스키마를 정확히 따라 한국어로 작성하세요. JSON 외 텍스트 금지.');
  lines.push('');
  lines.push('{');
  lines.push('  "headline": "2~3 문장 가족 전체 관점 요약",');
  lines.push('  "generations": {');
  lines.push('    "elder":   { "summary": "1 문장", "total_ending_cost_krw": number },');
  lines.push('    "primary": { "summary": "1 문장", "total_ending_cost_krw": number },');
  lines.push('    "younger": { "summary": "1 문장", "total_ending_cost_krw": number }');
  lines.push('  },');
  lines.push('  "members": [');
  lines.push('    {');
  lines.push('      "id": "self | member.id (입력과 동일하게)",');
  lines.push('      "name": "...",');
  lines.push('      "relation": "self|spouse|parent|parent_in_law|child|sibling|grandchild|other",');
  lines.push('      "age": number,');
  lines.push('      "generation": "elder | primary | younger",');
  lines.push('      "headline": "1 문장 요약",');
  lines.push('      "near_term": [');
  lines.push('        { "within_years": number, "title": "...", "category": "health|care|funeral|inheritance|milestone", "estimated_cost_krw": number(선택) }');
  lines.push('      ],');
  lines.push('      "role_score": 0|1|2|3');
  lines.push('    }');
  lines.push('  ],');
  lines.push('  "family_total_need_krw": number,');
  lines.push('  "family_currently_covered_krw": number,');
  lines.push('  "family_shortfall_krw": number,');
  lines.push('  "priorities": [');
  lines.push('    { "title": "...", "target_member_id": "...", "within_years": number, "reason": "1~2 문장" }');
  lines.push('  ],');
  lines.push('  "planner_talking_points": ["문장1", "문장2", "문장3"],');
  lines.push('  "disclaimer": "본 분석은 통계 기반 참고 자료이며, 상속·세무·의료 자문은 전문가 확인이 필요합니다."');
  lines.push('}');
  lines.push('');
  lines.push('[작성 규칙]');
  lines.push('- members에는 본인(id=self)과 입력된 모든 가족 구성원을 포함하세요.');
  lines.push('- elder=65세 이상, primary=35~64세, younger=34세 이하를 기준으로 generation을 지정.');
  lines.push('- priorities는 3~5개, 긴급도 높은 순서.');
  lines.push('- 모든 금액은 원(KRW) 정수.');
  lines.push('- 특정 구성원을 "곧 돌아가심" 등 부정적으로 단정하지 마세요.');

  return lines.join('\n');
}

function sanitize(r: FamilyScenarioResult, input: FamilyScenarioInput): FamilyScenarioResult {
  const members = Array.isArray(r.members)
    ? r.members.filter((m) => m && typeof m.age === 'number')
    : [];

  // AI sometimes skips declaring generation — fall back by age.
  for (const m of members) {
    if (!m.generation) m.generation = generationFor(m.age);
    if (!Array.isArray(m.near_term)) m.near_term = [];
  }

  // Sanity checks on numbers to avoid NaN in the UI.
  const total = Math.max(0, Math.round(r.family_total_need_krw ?? 0));
  const covered = Math.max(0, Math.round(r.family_currently_covered_krw ?? 0));
  const shortfall = Math.max(0, Math.round(r.family_shortfall_krw ?? total - covered));

  return {
    ...r,
    members,
    family_total_need_krw: total,
    family_currently_covered_krw: covered,
    family_shortfall_krw: shortfall,
    priorities: Array.isArray(r.priorities) ? r.priorities.slice(0, 5) : [],
    disclaimer:
      r.disclaimer?.trim() ||
      '본 분석은 통계 기반 참고 자료이며, 상속·세무·의료 자문은 전문가 확인이 필요합니다.',
    generations: r.generations ?? {
      elder: { summary: '', total_ending_cost_krw: 0 },
      primary: { summary: '', total_ending_cost_krw: 0 },
      younger: { summary: '', total_ending_cost_krw: 0 },
    },
    // Preserve headline as-is; used by presentation layer
    headline: r.headline ?? buildFallbackHeadline(input),
  };
}

function buildFallbackHeadline(input: FamilyScenarioInput): string {
  return `${input.client.name}님 가족의 3세대 통합 엔딩 분석 결과입니다.`;
}

function generationFor(age: number): Generation {
  if (age >= 65) return 'elder';
  if (age >= 35) return 'primary';
  return 'younger';
}

function genderKo(g: Client['gender']): string {
  return g === 'male' ? '남성' : g === 'female' ? '여성' : '기타';
}

function relationKo(r: FamilyMember['relation']): string {
  const map: Record<FamilyMember['relation'], string> = {
    spouse: '배우자',
    parent: '부모',
    parent_in_law: '배우자 부모',
    child: '자녀',
    sibling: '형제자매',
    grandchild: '손주',
    other: '기타',
  };
  return map[r] ?? r;
}

function krw(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}
