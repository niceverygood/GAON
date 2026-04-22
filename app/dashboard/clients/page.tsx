import Link from 'next/link';
import { Plus, Search, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/common/Topbar';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata = { title: '고객' };

export default async function ClientsListPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, birth_date, gender, phone, occupation, created_at')
    .order('created_at', { ascending: false });

  return (
    <>
      <Topbar title="고객" subtitle={clients ? `총 ${clients.length}명` : ''} />

      <main className="flex-1 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="이름·전화번호로 검색"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              disabled
              aria-label="검색 (곧 지원)"
            />
          </div>
          <Link
            href="/dashboard/clients/new"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'h-10 px-4 bg-indigo-600 text-white hover:bg-indigo-700 [a]:hover:bg-indigo-700',
            )}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            고객 추가
          </Link>
        </div>

        {!clients || clients.length === 0 ? <EmptyState /> : <ClientTable clients={clients} />}
      </main>
    </>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="p-12 text-center space-y-4">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold">등록된 고객이 없습니다</h3>
          <p className="mt-1 text-sm text-slate-500">
            첫 고객을 등록하고 엔딩 시나리오를 생성해 상담에 활용하세요.
          </p>
        </div>
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
  );
}

type Row = {
  id: string;
  name: string;
  birth_date: string | null;
  gender: 'male' | 'female' | 'other' | null;
  phone: string | null;
  occupation: string | null;
  created_at: string;
};

function ClientTable({ clients }: { clients: Row[] }) {
  return (
    <Card>
      <CardContent className="p-0 overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr] gap-4 px-5 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>이름</span>
          <span>성별</span>
          <span>생년월일</span>
          <span>연락처</span>
          <span className="text-right">등록일</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {clients.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/clients/${c.id}`}
                className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr] gap-4 items-center px-5 py-3.5 hover:bg-slate-50 transition"
              >
                <div>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  {c.occupation && <p className="mt-0.5 text-xs text-slate-500">{c.occupation}</p>}
                </div>
                <span className="text-sm text-slate-600">{genderLabel(c.gender)}</span>
                <span className="text-sm text-slate-600">
                  {c.birth_date ? new Date(c.birth_date).toLocaleDateString('ko-KR') : '—'}
                </span>
                <span className="text-sm text-slate-600 truncate">{c.phone ?? '—'}</span>
                <span className="text-right text-xs text-slate-400">
                  {new Date(c.created_at).toLocaleDateString('ko-KR')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function genderLabel(g: 'male' | 'female' | 'other' | null): string {
  if (g === 'male') return '남';
  if (g === 'female') return '여';
  if (g === 'other') return '기타';
  return '—';
}
