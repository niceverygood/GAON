-- ============================================================
-- Gaon — Debug helper (optional)
-- ============================================================
-- 디버그 페이지 (/dashboard/debug) 에서 세션이 PostgREST 쿼리에
-- JWT를 제대로 실어 보내는지 확인하기 위한 RPC.
--
-- 이 함수는 호출자의 auth.uid() 를 그대로 반환합니다.
-- NULL 이 반환되면 RLS 가 막히는 이유가 "세션 JWT가 DB 쿼리에
-- 실리지 않았다" 는 뜻.
-- ============================================================

create or replace function public.debug_auth_uid()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select auth.uid();
$$;

-- anon/authenticated 모두 호출 가능해야 진단 의미가 있음.
grant execute on function public.debug_auth_uid() to anon, authenticated;
