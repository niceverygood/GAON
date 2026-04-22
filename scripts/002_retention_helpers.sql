-- ============================================================
-- Gaon — Retention helpers (v2)
-- Apply after 001_initial_schema.sql.
--
-- `retention_scores` is append-only (cron writes a fresh row daily).
-- These helpers give the dashboard a cheap "latest score per contract"
-- view without pulling every historical row to the client.
-- ============================================================

-- Latest-per-contract view. Used by the dashboard list.
-- `security_invoker = true` makes the underlying retention_scores RLS apply
-- to the caller (planner) instead of the view definer, so planners only see
-- their own contracts' scores.
create or replace view public.latest_retention_scores
with (security_invoker = true) as
select distinct on (rs.contract_id)
  rs.id,
  rs.contract_id,
  rs.score,
  rs.factors,
  rs.recommended_action,
  rs.computed_at
from public.retention_scores rs
order by rs.contract_id, rs.computed_at desc;

comment on view public.latest_retention_scores is
  'Latest retention score per contract. Append-only source is retention_scores.';

-- Views inherit the RLS of their underlying tables (security_invoker), so the
-- planner's select policy on retention_scores already applies. No extra grant
-- needed because supabase's authenticated/anon roles can select this view.

-- ============================================================
-- RPC: top risky contracts for the calling planner.
-- Returns enough data to render the Top N card without a join chain.
-- ============================================================
create or replace function public.top_retention(limit_count int default 20)
returns table (
  contract_id uuid,
  client_id uuid,
  client_name text,
  score int,
  factors jsonb,
  recommended_action text,
  computed_at timestamptz,
  product_name text,
  monthly_payment int,
  paid_months int,
  total_months int
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    lrs.contract_id,
    c.id as client_id,
    c.name as client_name,
    lrs.score,
    lrs.factors,
    lrs.recommended_action,
    lrs.computed_at,
    sc.product_name,
    sc.monthly_payment,
    sc.paid_months,
    sc.total_months
  from public.latest_retention_scores lrs
  join public.sangjo_contracts sc on sc.id = lrs.contract_id
  join public.clients c on c.id = sc.client_id
  where sc.status = 'active'
  order by lrs.score desc, lrs.computed_at desc
  limit limit_count;
$$;
