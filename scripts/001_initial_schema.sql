-- ============================================================
-- Gaon — Initial Schema (v1)
-- Apply via Supabase SQL editor or `supabase db execute`.
--
-- Conventions:
--   * All tables use `uuid` PK with `gen_random_uuid()` default.
--   * `created_at` on every row.
--   * RLS is ENABLED on every user-facing table.
--   * Foreign keys use ON DELETE CASCADE only when child is
--     semantically owned by the parent; otherwise ON DELETE RESTRICT.
-- ============================================================

-- Requires pgcrypto (ships with Supabase) for gen_random_uuid().
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. organizations (상조사)
-- ============================================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text check (plan in ('starter', 'pro', 'enterprise')),
  seat_count int default 1 check (seat_count > 0),
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- ============================================================
-- 2. planners (플래너 = 사용자)
-- Mirrors auth.users via 1:1 id. Created on signup.
-- ============================================================
create table if not exists public.planners (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete restrict,
  name text,
  role text not null default 'planner' check (role in ('planner', 'manager', 'admin')),
  branch text,
  created_at timestamptz not null default now()
);

create index if not exists planners_org_idx on public.planners(organization_id);

alter table public.planners enable row level security;

-- Helper: is the current user a super admin?
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.planners
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: current user's organization_id
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.planners where id = auth.uid();
$$;

-- Helper: current user's role
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.planners where id = auth.uid();
$$;

-- ============================================================
-- 3. clients (고객)
-- ============================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  planner_id uuid not null references public.planners(id) on delete restrict,
  name text not null,
  birth_date date,
  gender text check (gender in ('male', 'female', 'other')),
  phone text,
  address text,
  occupation text,
  family_json jsonb default '{}'::jsonb,
  asset_json jsonb default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_planner_idx on public.clients(planner_id, created_at desc);

alter table public.clients enable row level security;

-- ============================================================
-- 4. sangjo_contracts (상조 계약)
-- ============================================================
create table if not exists public.sangjo_contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  planner_id uuid not null references public.planners(id) on delete restrict,
  product_name text,
  monthly_payment int check (monthly_payment >= 0),
  total_months int check (total_months > 0),
  paid_months int default 0 check (paid_months >= 0),
  contract_date date,
  status text not null default 'active' check (status in ('active', 'paused', 'terminated', 'event')),
  terminated_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contracts_client_idx on public.sangjo_contracts(client_id, status);
create index if not exists contracts_planner_idx on public.sangjo_contracts(planner_id, created_at desc);

alter table public.sangjo_contracts enable row level security;

-- ============================================================
-- 5. ending_scenarios (엔딩 시나리오 결과)
-- ============================================================
create table if not exists public.ending_scenarios (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  planner_id uuid not null references public.planners(id) on delete restrict,
  result jsonb not null,
  model text,
  token_usage jsonb,
  created_at timestamptz not null default now()
);

create index if not exists scenarios_client_idx on public.ending_scenarios(client_id, created_at desc);

alter table public.ending_scenarios enable row level security;

-- ============================================================
-- 6. retention_scores (해약 리스크 스코어)
-- Computed daily by cron.
-- ============================================================
create table if not exists public.retention_scores (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.sangjo_contracts(id) on delete cascade,
  score int not null check (score between 0 and 100),
  factors jsonb not null default '{}'::jsonb,
  recommended_action text,
  computed_at timestamptz not null default now()
);

create index if not exists retention_scores_contract_idx on public.retention_scores(contract_id, computed_at desc);
create index if not exists retention_scores_score_idx on public.retention_scores(score desc, computed_at desc);

alter table public.retention_scores enable row level security;

-- ============================================================
-- 7. funeral_events (장례 이벤트)
-- ============================================================
create table if not exists public.funeral_events (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.sangjo_contracts(id) on delete restrict,
  planner_id uuid not null references public.planners(id) on delete restrict,
  deceased_at timestamptz,
  venue text,
  timeline jsonb default '[]'::jsonb,
  expenses jsonb default '{}'::jsonb,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  family_access_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists funeral_events_contract_idx on public.funeral_events(contract_id);
create index if not exists funeral_events_planner_idx on public.funeral_events(planner_id, status);

alter table public.funeral_events enable row level security;

-- ============================================================
-- 8. family_accesses (유족 토큰 기반 접근)
-- ============================================================
create table if not exists public.family_accesses (
  id uuid primary key default gen_random_uuid(),
  funeral_event_id uuid not null references public.funeral_events(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists family_accesses_token_idx on public.family_accesses(token);

alter table public.family_accesses enable row level security;

-- ============================================================
-- 9. subscriptions (SaaS 구독)
-- ============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro', 'enterprise')),
  seat_count int not null default 1 check (seat_count > 0),
  status text not null default 'trialing' check (status in ('active', 'trialing', 'cancelled', 'past_due')),
  current_period_end timestamptz,
  payment_key text,
  billing_cycle text check (billing_cycle in ('monthly', 'yearly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subs_org_idx on public.subscriptions(organization_id, status);

alter table public.subscriptions enable row level security;

-- ============================================================
-- updated_at trigger (공통)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['clients', 'sangjo_contracts', 'funeral_events', 'subscriptions'] loop
    execute format(
      'drop trigger if exists %I_set_updated_at on public.%I;',
      t, t
    );
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- --- organizations ---
drop policy if exists org_select on public.organizations;
create policy org_select on public.organizations
  for select using (
    public.is_super_admin()
    or id = public.current_org_id()
  );

drop policy if exists org_admin_all on public.organizations;
create policy org_admin_all on public.organizations
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- --- planners ---
drop policy if exists planners_self_select on public.planners;
create policy planners_self_select on public.planners
  for select using (
    public.is_super_admin()
    or id = auth.uid()
    or (organization_id = public.current_org_id() and public.current_role() in ('manager', 'admin'))
  );

drop policy if exists planners_self_update on public.planners;
create policy planners_self_update on public.planners
  for update using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists planners_admin_all on public.planners;
create policy planners_admin_all on public.planners
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- --- clients ---
drop policy if exists clients_planner_select on public.clients;
create policy clients_planner_select on public.clients
  for select using (
    public.is_super_admin()
    or planner_id = auth.uid()
    or (
      public.current_role() in ('manager', 'admin')
      and planner_id in (select id from public.planners where organization_id = public.current_org_id())
    )
  );

drop policy if exists clients_planner_write on public.clients;
create policy clients_planner_write on public.clients
  for all using (planner_id = auth.uid())
  with check (planner_id = auth.uid());

-- --- sangjo_contracts ---
drop policy if exists contracts_select on public.sangjo_contracts;
create policy contracts_select on public.sangjo_contracts
  for select using (
    public.is_super_admin()
    or planner_id = auth.uid()
    or (
      public.current_role() in ('manager', 'admin')
      and planner_id in (select id from public.planners where organization_id = public.current_org_id())
    )
  );

drop policy if exists contracts_write on public.sangjo_contracts;
create policy contracts_write on public.sangjo_contracts
  for all using (planner_id = auth.uid())
  with check (planner_id = auth.uid());

-- --- ending_scenarios ---
drop policy if exists scenarios_select on public.ending_scenarios;
create policy scenarios_select on public.ending_scenarios
  for select using (
    public.is_super_admin()
    or planner_id = auth.uid()
    or (
      public.current_role() in ('manager', 'admin')
      and planner_id in (select id from public.planners where organization_id = public.current_org_id())
    )
  );

drop policy if exists scenarios_write on public.ending_scenarios;
create policy scenarios_write on public.ending_scenarios
  for all using (planner_id = auth.uid())
  with check (planner_id = auth.uid());

-- --- retention_scores ---
-- Service-role writes via cron. Planners read only their contracts.
drop policy if exists retention_select on public.retention_scores;
create policy retention_select on public.retention_scores
  for select using (
    public.is_super_admin()
    or contract_id in (select id from public.sangjo_contracts where planner_id = auth.uid())
    or (
      public.current_role() in ('manager', 'admin')
      and contract_id in (
        select c.id from public.sangjo_contracts c
        join public.planners p on p.id = c.planner_id
        where p.organization_id = public.current_org_id()
      )
    )
  );

-- --- funeral_events ---
drop policy if exists funeral_select on public.funeral_events;
create policy funeral_select on public.funeral_events
  for select using (
    public.is_super_admin()
    or planner_id = auth.uid()
    or (
      public.current_role() in ('manager', 'admin')
      and planner_id in (select id from public.planners where organization_id = public.current_org_id())
    )
  );

drop policy if exists funeral_write on public.funeral_events;
create policy funeral_write on public.funeral_events
  for all using (planner_id = auth.uid())
  with check (planner_id = auth.uid());

-- --- family_accesses ---
-- Token-based access is server-validated; table is only readable to planners who own the event.
drop policy if exists family_access_planner on public.family_accesses;
create policy family_access_planner on public.family_accesses
  for select using (
    public.is_super_admin()
    or funeral_event_id in (select id from public.funeral_events where planner_id = auth.uid())
  );

-- --- subscriptions ---
drop policy if exists subs_select on public.subscriptions;
create policy subs_select on public.subscriptions
  for select using (
    public.is_super_admin()
    or organization_id = public.current_org_id()
  );

drop policy if exists subs_admin_write on public.subscriptions;
create policy subs_admin_write on public.subscriptions
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- ============================================================
-- AUTO-CREATE planner ROW ON AUTH SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.planners (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
