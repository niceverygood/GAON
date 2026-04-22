import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/common/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: planner } = await supabase
    .from('planners')
    .select('name, organization_id, organizations(name)')
    .eq('id', user.id)
    .maybeSingle<{ name: string | null; organization_id: string | null; organizations: { name: string } | null }>();

  const plannerName = planner?.name ?? user.email?.split('@')[0] ?? '플래너';
  const orgName = planner?.organizations?.name ?? null;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar plannerName={plannerName} orgName={orgName} />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
