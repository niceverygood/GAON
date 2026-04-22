/**
 * Minimal hand-rolled row types mirroring `scripts/001_initial_schema.sql`.
 *
 * These are the shapes returned by Supabase default select queries — fields
 * with JSONB columns use narrow types where we own the writer. Regenerate
 * with `supabase gen types typescript` once the CLI is wired up.
 */

export type PlannerRole = 'planner' | 'manager' | 'admin';
export type Gender = 'male' | 'female' | 'other';
export type ContractStatus = 'active' | 'paused' | 'terminated' | 'event';
export type FuneralStatus = 'in_progress' | 'completed' | 'cancelled';
export type SubscriptionPlan = 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'cancelled' | 'past_due';

export type FamilyRelation =
  | 'spouse'
  | 'parent'
  | 'parent_in_law'
  | 'child'
  | 'sibling'
  | 'grandchild'
  | 'other';

export type FamilyMember = {
  id: string;
  relation: FamilyRelation;
  name: string;
  age: number;
  gender?: Gender;
  health_note?: string;
  financial_note?: string;
};

export type ClientFamily = {
  /** Count fields are kept for backward compat + quick display — derivable from members. */
  spouse?: boolean;
  children?: number;
  parents_alive?: number;
  /** Per-person records for 3-generation consolidated analysis. */
  members?: FamilyMember[];
};

export type ClientAssets = {
  real_estate?: number;
  financial?: number;
  debt?: number;
  monthly_income?: number;
  insurance_monthly?: number;
  existing_sangjo_monthly?: number;
};

export type Organization = {
  id: string;
  name: string;
  plan: SubscriptionPlan | null;
  seat_count: number;
  created_at: string;
};

export type Planner = {
  id: string;
  organization_id: string | null;
  name: string | null;
  role: PlannerRole;
  branch: string | null;
  created_at: string;
};

export type Client = {
  id: string;
  planner_id: string;
  name: string;
  birth_date: string | null;
  gender: Gender | null;
  phone: string | null;
  address: string | null;
  occupation: string | null;
  family_json: ClientFamily;
  asset_json: ClientAssets;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SangjoContract = {
  id: string;
  client_id: string;
  planner_id: string;
  product_name: string | null;
  monthly_payment: number | null;
  total_months: number | null;
  paid_months: number;
  contract_date: string | null;
  status: ContractStatus;
  terminated_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EndingScenario = {
  id: string;
  client_id: string;
  planner_id: string;
  result: import('./scenario').ScenarioResult;
  model: string | null;
  token_usage: { input: number; output: number } | null;
  created_at: string;
};

export type RetentionScore = {
  id: string;
  contract_id: string;
  score: number;
  factors: Record<string, number>;
  recommended_action: string | null;
  computed_at: string;
};

export type FuneralEvent = {
  id: string;
  contract_id: string;
  planner_id: string;
  deceased_at: string | null;
  venue: string | null;
  timeline: Array<{ day: number; time?: string; task: string; done?: boolean }>;
  expenses: Record<string, number>;
  status: FuneralStatus;
  family_access_token: string | null;
  created_at: string;
  updated_at: string;
};
