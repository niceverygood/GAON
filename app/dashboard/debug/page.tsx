import { createClient, createServiceClient } from '@/lib/supabase/server';

export const metadata = { title: 'Debug' };
export const dynamic = 'force-dynamic';

/**
 * SSR diagnostic — shows what the server-side Supabase session actually sees.
 * Helpful when the dashboard renders 0 clients despite the DB being populated.
 */
export default async function DebugPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  const [{ data: planner, error: plannerErr }, { data: clients, error: clientsErr }, { count: serviceClientCount }] =
    await Promise.all([
      supabase.from('planners').select('*').eq('id', user?.id ?? '00000000-0000-0000-0000-000000000000').maybeSingle(),
      supabase.from('clients').select('id, name'),
      (async () => {
        if (!user?.id) return { count: null };
        const admin = await createServiceClient();
        return admin.from('clients').select('id', { count: 'exact', head: true }).eq('planner_id', user.id);
      })(),
    ]);

  const payload = {
    'auth.user (middleware session)': user
      ? { id: user.id, email: user.email, last_signed_in: user.last_sign_in_at }
      : null,
    'auth.getUser error': userErr?.message ?? null,
    'planners.self (RLS-aware)': planner,
    'planners.self error': plannerErr?.message ?? null,
    'clients (RLS-aware SELECT)': {
      count: clients?.length ?? 0,
      first_three: clients?.slice(0, 3).map((c) => c.name) ?? [],
      error: clientsErr?.message ?? null,
    },
    'clients count via service-role (bypasses RLS)': serviceClientCount,
    'interpretation':
      user && serviceClientCount && (clients?.length ?? 0) === 0
        ? '❗ DB has your data (service-role sees N rows) but RLS is returning 0 to your session. Most likely the session cookie is stale — fully log out and log back in.'
        : clients?.length
          ? '✓ Everything looks right.'
          : '세션 / 데이터 점검이 필요합니다.',
  };

  return (
    <main className="flex-1 p-6 md:p-8">
      <h1 className="text-xl font-black mb-4">Debug</h1>
      <pre className="rounded-lg bg-slate-900 text-slate-100 p-5 text-xs overflow-auto leading-relaxed">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </main>
  );
}
