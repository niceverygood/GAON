import { createClient, createServiceClient } from '@/lib/supabase/server';

export const metadata = { title: 'Debug' };
export const dynamic = 'force-dynamic';

export default async function DebugPage() {
  const supabase = await createClient();

  const [{ data: userData, error: userErr }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);

  const user = userData?.user ?? null;
  const session = sessionData?.session ?? null;

  // Try calling an RPC that returns auth.uid() — definitive proof of whether
  // PostgREST is receiving the user's JWT. If it returns null, RLS will
  // always filter to 0 rows because `planner_id = auth.uid()` never matches.
  let rlsUid: string | null = null;
  let rlsUidError: string | null = null;
  try {
    const { data, error } = await supabase.rpc('debug_auth_uid');
    rlsUid = (data as string) ?? null;
    rlsUidError = error?.message ?? null;
  } catch (e) {
    rlsUidError = (e as Error).message;
  }

  const [{ data: planner, error: plannerErr }, { data: clients, error: clientsErr }, { count: svcCount }] =
    await Promise.all([
      supabase.from('planners').select('*').eq('id', user?.id ?? '00000000-0000-0000-0000-000000000000').maybeSingle(),
      supabase.from('clients').select('id, name'),
      (async () => {
        if (!user?.id) return { count: null };
        const admin = await createServiceClient();
        return admin.from('clients').select('id', { count: 'exact', head: true }).eq('planner_id', user.id);
      })(),
    ]);

  const configuredKeyKind =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? 'legacy anon (eyJ...)'
      : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        ? 'sb_publishable_ (new format)'
        : 'NONE';

  const activeKeyHint = resolveActiveKeyFormat();

  const payload = {
    'auth.user (middleware session)': user
      ? { id: user.id, email: user.email, last_signed_in: user.last_sign_in_at }
      : null,
    'auth.getUser error': userErr?.message ?? null,
    'auth.getSession access_token present': !!session?.access_token,
    'auth.getSession access_token prefix': session?.access_token?.slice(0, 24) ?? null,
    'configured supabase key': configuredKeyKind,
    'active supabase key in SSR': activeKeyHint,
    'auth.uid() as seen by Postgres (RLS context)': rlsUid,
    'auth.uid() RPC error': rlsUidError,
    'planners.self (RLS-aware)': planner,
    'planners.self error': plannerErr?.message ?? null,
    'clients (RLS-aware SELECT)': {
      count: clients?.length ?? 0,
      first_three: clients?.slice(0, 3).map((c) => c.name) ?? [],
      error: clientsErr?.message ?? null,
    },
    'clients count via service-role (bypasses RLS)': svcCount,
    'interpretation': interpret({
      hasUser: !!user,
      rlsUid,
      svcCount: svcCount ?? 0,
      clientCount: clients?.length ?? 0,
    }),
  };

  return (
    <main className="flex-1 p-6 md:p-8">
      <h1 className="text-xl font-black mb-4">Debug</h1>
      <pre className="rounded-lg bg-slate-900 text-slate-100 p-5 text-xs overflow-auto leading-relaxed">
        {JSON.stringify(payload, null, 2)}
      </pre>
      <div className="mt-6 text-sm text-slate-500 space-y-1 leading-relaxed">
        <p>
          <b>정상 상태:</b> auth.uid() · user.id 가 동일한 UUID. planners.self 가 채워짐. clients count 가 service-role count 와 같음.
        </p>
        <p>
          <b>auth.uid() 가 null:</b> PostgREST 쿼리에 세션 JWT가 실리지 않은 상태. 대부분 새 <code>sb_publishable_</code> 키를 쓰거나 세션 쿠키가 만료된 경우.
        </p>
      </div>
    </main>
  );
}

function resolveActiveKeyFormat(): string {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const k = anon ?? pub ?? '';
  if (!k) return 'none configured';
  if (k.startsWith('eyJ')) return 'legacy anon (JWT)';
  if (k.startsWith('sb_publishable_')) return 'publishable (sb_publishable_)';
  return `unknown (${k.slice(0, 6)}…)`;
}

function interpret(s: {
  hasUser: boolean;
  rlsUid: string | null;
  svcCount: number;
  clientCount: number;
}): string {
  if (!s.hasUser) return '❗ 로그인 안 됨 — 세션 쿠키 없음';
  if (!s.rlsUid)
    return '❗ auth.uid() 가 NULL. PostgREST에 JWT가 실리지 않은 상태 — Vercel에 NEXT_PUBLIC_SUPABASE_ANON_KEY 추가 + 재배포 + 로그아웃/로그인 필요';
  if (s.svcCount > 0 && s.clientCount === 0)
    return '❗ DB에 데이터 있음(service-role). RLS가 막고 있음 — 세션/키 문제';
  if (s.clientCount > 0) return '✓ 정상';
  return '데이터 없음 — "테스트 계정으로 로그인" 으로 자동 시드 유도';
}
