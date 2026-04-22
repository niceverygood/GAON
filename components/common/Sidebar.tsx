'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Settings,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
};

const ITEMS: Item[] = [
  { href: '/dashboard', label: '홈', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: '고객', icon: Users },
  { href: '/dashboard/scenario', label: '엔딩 시나리오', icon: Sparkles, hint: 'AI' },
  { href: '/dashboard/retention', label: '해약 방지', icon: ShieldCheck },
  { href: '/dashboard/tools/funeral-cost', label: '장례비 비교', icon: Calculator },
  { href: '/dashboard/funeral', label: '장례 실행', icon: HeartHandshake },
];

export function Sidebar({ plannerName, orgName }: { plannerName: string; orgName?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-black">
            가
          </span>
          <span className="text-lg font-black tracking-tight">가온</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {ITEMS.map(({ href, label, icon: Icon, hint }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600',
                )}
              />
              <span>{label}</span>
              {hint && (
                <span className="ml-auto rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                  {hint}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4 space-y-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700"
        >
          <Settings className="h-3.5 w-3.5" />
          설정
        </Link>
        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="text-xs text-slate-500">로그인</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900 truncate">{plannerName}</p>
          {orgName && <p className="mt-0.5 text-xs text-slate-500 truncate">{orgName}</p>}
        </div>
      </div>
    </aside>
  );
}
