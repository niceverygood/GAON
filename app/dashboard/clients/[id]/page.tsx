import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Sparkles, Phone, MapPin, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/common/Topbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Client, ClientAssets, ClientFamily } from '@/types/db';
import { ContractSection, type ContractRow } from './ContractSection';
import { FamilySection } from './FamilySection';

export const metadata = { title: '고객 상세' };

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle<Client>();

  if (!client) notFound();

  const [{ data: scenarios }, { data: contracts }] = await Promise.all([
    supabase
      .from('ending_scenarios')
      .select('id, created_at, model')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('sangjo_contracts')
      .select('id, product_name, monthly_payment, total_months, paid_months, contract_date, status')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .returns<ContractRow[]>(),
  ]);

  const age = computeAge(client.birth_date);
  const family: ClientFamily = client.family_json ?? {};
  const assets: ClientAssets = client.asset_json ?? {};

  return (
    <>
      <Topbar title={client.name} subtitle={age != null ? `${age}세` : '상세 정보'} />

      <main className="flex-1 p-6 md:p-8 space-y-8">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          고객 목록
        </Link>

        {/* Header card */}
        <Card>
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center font-black text-lg">
                {client.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight">{client.name}</h2>
                  {age != null && <Badge variant="secondary">{age}세</Badge>}
                  {client.gender && <Badge variant="secondary">{genderLabel(client.gender)}</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  {client.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {client.phone}
                    </span>
                  )}
                  {client.address && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {client.address}
                    </span>
                  )}
                  {client.occupation && (
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {client.occupation}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/dashboard/scenario?client=${client.id}`}
              className={cn(
                buttonVariants({ size: 'sm' }),
                'h-10 px-4 bg-indigo-600 text-white hover:bg-indigo-700 [a]:hover:bg-indigo-700 self-start md:self-center',
              )}
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              엔딩 시나리오 생성
            </Link>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <InfoCard title="가족 구성">
            <InfoRow label="배우자" value={family.spouse ? '있음' : '없음'} />
            <InfoRow label="자녀" value={family.children != null ? `${family.children}명` : '—'} />
            <InfoRow label="생존 부모" value={family.parents_alive != null ? `${family.parents_alive}명` : '—'} />
          </InfoCard>

          <InfoCard title="재무 · 상조">
            <InfoRow label="월 소득" value={krw(assets.monthly_income)} />
            <InfoRow label="금융 자산" value={krw(assets.financial)} />
            <InfoRow label="부동산" value={krw(assets.real_estate)} />
            <InfoRow label="부채" value={krw(assets.debt)} />
            <InfoRow label="타사 상조 월 납입" value={krw(assets.existing_sangjo_monthly)} />
            <InfoRow label="보험 월 납입" value={krw(assets.insurance_monthly)} />
          </InfoCard>
        </div>

        {client.notes && (
          <InfoCard title="메모">
            <p className="whitespace-pre-wrap text-sm text-slate-700">{client.notes}</p>
          </InfoCard>
        )}

        <FamilySection clientId={client.id} members={family.members ?? []} />

        <ContractSection clientId={client.id} contracts={contracts ?? []} />

        <section>
          <h3 className="text-lg font-black tracking-tight mb-3">최근 시나리오</h3>
          {!scenarios || scenarios.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-sm text-slate-500">
                아직 생성된 시나리오가 없습니다.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-slate-100">
                  {scenarios.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/dashboard/scenario/${s.id}`}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {new Date(s.created_at).toLocaleString('ko-KR')}
                          </p>
                          {s.model && <p className="mt-0.5 text-xs text-slate-500">{s.model}</p>}
                        </div>
                        <span className="text-xs text-slate-400">열기 →</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-base font-bold mb-4">{title}</h3>
        <div className="space-y-2.5">{children}</div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value ?? '—'}</span>
    </div>
  );
}

function computeAge(birth: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

function genderLabel(g: 'male' | 'female' | 'other'): string {
  return g === 'male' ? '남성' : g === 'female' ? '여성' : '기타';
}

function krw(n: number | null | undefined): string | null {
  if (n == null || n === 0) return null;
  return `₩${n.toLocaleString('ko-KR')}`;
}
