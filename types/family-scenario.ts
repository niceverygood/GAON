/**
 * Output contract for the 3-generation family scenario generator.
 * The AI is instructed to emit this exact JSON — see
 * `lib/scenario/family-generator.ts` and `SYSTEM_PROMPTS.FAMILY_SCENARIO`.
 */

import type { FamilyRelation } from '@/types/db';

export type Generation = 'elder' | 'primary' | 'younger';

export type FamilyMemberScenario = {
  /** FamilyMember.id from client.family_json.members (or 'self' for the client). */
  id: string;
  name: string;
  relation: FamilyRelation | 'self';
  age: number;
  generation: Generation;
  /** 1 문장. 이 사람의 엔딩 관점 핵심 요약. */
  headline: string;
  /** 가까운 시일 내 주목할 이정표 (0~3개). */
  near_term: Array<{
    within_years: number;
    title: string;
    estimated_cost_krw?: number;
    category: 'health' | 'care' | 'funeral' | 'inheritance' | 'milestone';
  }>;
  /** 가계 기여도 (0=의존, 1=보조, 2=주축, 3=핵심). */
  role_score: number;
};

export type FamilyPriority = {
  title: string;
  target_member_id: string;
  within_years: number;
  reason: string;
};

export type FamilyScenarioResult = {
  /** 2~3 문장 전체 가족 엔딩 개관. */
  headline: string;
  /** 세대별 요약. */
  generations: Record<Generation, { summary: string; total_ending_cost_krw: number }>;
  members: FamilyMemberScenario[];
  /** 향후 20년 가족 전체 엔딩 관련 예상 총비용 합계. */
  family_total_need_krw: number;
  /** 현재 커버되는 합산 금액 (배우자·부모·본인 기존 상조·보험). */
  family_currently_covered_krw: number;
  /** 부족분. */
  family_shortfall_krw: number;
  /** 선순위 액션 — 최대 5개. */
  priorities: FamilyPriority[];
  /** 가족 단위 관점에서 플래너가 건낼 수 있는 화두. */
  planner_talking_points: string[];
  disclaimer: string;
};
