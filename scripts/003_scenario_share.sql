-- ============================================================
-- Gaon — Scenario share token (v3)
-- Apply after 002_retention_helpers.sql.
--
-- 공유 링크: 플래너가 생성한 엔딩 시나리오를 고객·가족에게 전달할 수 있도록
-- 시나리오당 1개의 무작위 토큰을 발급한다. 서버는 service-role로 토큰을
-- 조회하므로 anon 셀렉트 정책을 추가하지 않는다.
-- ============================================================

alter table public.ending_scenarios
  add column if not exists share_token text unique,
  add column if not exists shared_at timestamptz;

create index if not exists scenarios_share_token_idx
  on public.ending_scenarios(share_token)
  where share_token is not null;

comment on column public.ending_scenarios.share_token is
  '32-byte URL-safe token for public sharing. Null = unpublished.';
comment on column public.ending_scenarios.shared_at is
  'Timestamp the token was first issued. Used for audit + expiry logic.';
