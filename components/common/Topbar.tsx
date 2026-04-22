import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOutAction } from '@/app/(auth)/actions';

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
      <div>
        <h1 className="text-lg font-black tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <form action={signOutAction}>
        <Button type="submit" variant="ghost" size="sm" className="h-9 text-slate-600 hover:text-slate-900">
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          로그아웃
        </Button>
      </form>
    </header>
  );
}
