/**
 * Endgame simulator output contract.
 * The Claude prompt is instructed to emit exactly this JSON shape — see
 * `lib/scenario/generator.ts` and `lib/ai/prompts.ts`.
 */

export type ScenarioTimelineEvent = {
  /** Age when the event is projected (e.g., 62). */
  age: number;
  /** Event category — drives icon + tint on the timeline. */
  category: 'health' | 'care' | 'funeral' | 'inheritance' | 'milestone';
  /** Short label shown on the timeline dot. */
  title: string;
  /** 1~2 sentence objective description (no fear language). */
  detail: string;
  /** Estimated cost in KRW, if applicable. */
  estimated_cost_krw?: number;
  /** Probability hint (0~1), optional. */
  probability?: number;
  /** Source citation, e.g., "통계청 2023 생명표". */
  source?: string;
};

export type ScenarioCostSummary = {
  /** Expected lifetime medical costs (treatment, hospitalization). */
  lifetime_medical_krw: number;
  /** Expected care cost (간병) — monthly * avg months. */
  care_total_krw: number;
  care_monthly_krw: number;
  care_avg_months: number;
  /** Funeral cost estimate for the client's region/tier. */
  funeral_krw: number;
  /** Expected inheritance tax + settlement gap for the survivor. */
  inheritance_tax_krw: number;
  /** Total client-side ending-related financial need. */
  total_need_krw: number;
};

export type ScenarioCoverageGap = {
  /** What the current sangjo / insurance covers. */
  currently_covered_krw: number;
  /** Resulting shortfall vs total need. */
  shortfall_krw: number;
  /** One-line interpretation shown to the client. */
  summary: string;
};

export type ScenarioResult = {
  /** 2~3 sentence narrative summary shown at the top of the result. */
  headline: string;
  /**
   * Projected statistical life expectancy — always framed as a range,
   * never a single number. e.g., { low: 82, high: 88 }.
   */
  life_expectancy_range: { low: number; high: number; source: string };
  /** Timeline of projected events, sorted by age ascending. */
  timeline: ScenarioTimelineEvent[];
  /** Aggregate cost breakdown. */
  costs: ScenarioCostSummary;
  /** Gap vs existing coverage. */
  coverage_gap: ScenarioCoverageGap;
  /** 3 talking points the planner can use to open the conversation. */
  planner_talking_points: string[];
  /** Disclaimer — must always be present. */
  disclaimer: string;
};

export type ScenarioInput = {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  region?: string;
  occupation?: string;
  household_size?: number;
  dependents?: number;
  monthly_income_krw?: number;
  financial_assets_krw?: number;
  real_estate_krw?: number;
  debt_krw?: number;
  existing_sangjo_monthly_krw?: number;
  insurance_monthly_krw?: number;
  health_notes?: string;
};
