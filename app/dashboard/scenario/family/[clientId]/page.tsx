import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/common/Topbar';
import { FamilyScenarioLauncher } from './FamilyScenarioLauncher';
import type { Client, ClientFamily } from '@/types/db';

export const metadata = { title: '가족 통합 분석' };

export default async function FamilyScenarioPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .maybeSingle<Client>();

  if (!client) notFound();

  const family: ClientFamily = client.family_json ?? {};
  const members = family.members ?? [];
  const age = client.birth_date ? ageFromBirth(client.birth_date) : null;

  return (
    <>
      <Topbar
        title={`${client.name} · 가족 통합 분석`}
        subtitle={`본인 포함 ${members.length + 1}명 · 3세대 관점`}
      />
      <main className="flex-1 p-6 md:p-8 space-y-6">
        <Link
          href={`/dashboard/clients/${client.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          고객 프로필로
        </Link>
        <FamilyScenarioLauncher
          clientId={client.id}
          clientName={client.name}
          clientAge={age}
          memberCount={members.length}
        />
      </main>
    </>
  );
}

function ageFromBirth(birth: string): number | null {
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
