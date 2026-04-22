import Link from 'next/link';
import { Sparkles, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/common/Topbar';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScenarioLauncher } from './ScenarioLauncher';

export const metadata = { title: '엔딩 시나리오' };

export default async function ScenarioIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const supabase = await createClient();

  const [{ data: clients }, { data: recent }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, birth_date')
      .order('created_at', { ascending: false }),
    supabase
      .from('ending_scenarios')
      .select('id, client_id, created_at, model, share_token, clients(name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const hasClients = !!clients && clients.length > 0;

  return (
    <>
      <Topbar title="엔딩 시나리오" subtitle="AI 기반 통계 시뮬레이션" />

      <main className="flex-1 p-6 md:p-8 space-y-8">
        {!hasClients ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center space-y-4 max-w-xl mx-auto">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black tracking-tight">먼저 고객을 등록하세요</h2>
              <p className="text-sm text-slate-500">
                엔딩 시나리오는 등록된 고객의 나이·가족·자산을 기반으로 생성됩니다.
              </p>
              <Link
                href="/dashboard/clients/new"
                className={cn(
                  buttonVariants({ size: 'sm' }),
                  'h-9 px-3 bg-indigo-600 text-white hover:bg-indigo-700 [a]:hover:bg-indigo-700',
                )}
              >
                고객 등록하기
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-black tracking-tight">새 시나리오 생성</h2>
                  <p className="text-sm text-slate-500">
                    고객을 선택하면 AI가 향후 20~30년 엔딩 타임라인을 생성합니다. 약 20~40초 소요.
                  </p>
                </div>
              </div>
              <ScenarioLauncher
                clients={clients!}
                defaultClientId={client ?? clients![0].id}
              />
            </CardContent>
          </Card>
        )}

        <section>
          <h3 className="mb-3 text-lg font-black tracking-tight">최근 시나리오</h3>
          {!recent || recent.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-sm text-slate-500">
                아직 생성된 시나리오가 없습니다.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-slate-100">
                  {recent.map((s) => {
                    const row = s as {
                      clients?: { name?: string } | null;
                      share_token?: string | null;
                    };
                    const name = row.clients?.name ?? '고객';
                    return (
                      <li key={s.id}>
                        <Link
                          href={`/dashboard/scenario/${s.id}`}
                          className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {new Date(s.created_at).toLocaleString('ko-KR')}
                              {s.model ? ` · ${s.model}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {row.share_token && (
                              <span className="inline-flex items-center rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                                공유 중
                              </span>
                            )}
                            <span className="text-xs text-slate-400">열기 →</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </>
  );
}
