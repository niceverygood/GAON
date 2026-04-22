import { Topbar } from '@/components/common/Topbar';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: '설정' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: planner } = await supabase
    .from('planners')
    .select('name, role, branch, organization_id, organizations(name, plan)')
    .eq('id', user!.id)
    .maybeSingle<{
      name: string | null;
      role: string;
      branch: string | null;
      organization_id: string | null;
      organizations: { name: string; plan: string | null } | null;
    }>();

  return (
    <>
      <Topbar title="설정" subtitle="계정과 조직 정보" />
      <main className="flex-1 p-6 md:p-8 max-w-2xl">
        <Card>
          <CardContent className="p-6 space-y-5">
            <h2 className="text-base font-bold">계정</h2>
            <Row label="이메일" value={user!.email ?? '—'} />
            <Row label="이름" value={planner?.name ?? '—'} />
            <Row label="역할" value={roleLabel(planner?.role)} />
            <Row label="지점" value={planner?.branch ?? '—'} />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="p-6 space-y-5">
            <h2 className="text-base font-bold">조직</h2>
            <Row label="소속 상조사" value={planner?.organizations?.name ?? '—'} />
            <Row label="요금제" value={planLabel(planner?.organizations?.plan ?? null)} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function roleLabel(r?: string) {
  if (r === 'admin') return '슈퍼 관리자';
  if (r === 'manager') return '매니저';
  if (r === 'planner') return '플래너';
  return '—';
}

function planLabel(p: string | null) {
  if (p === 'starter') return 'Starter';
  if (p === 'pro') return 'Pro';
  if (p === 'enterprise') return 'Enterprise';
  return '미설정';
}
