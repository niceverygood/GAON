import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Topbar } from '@/components/common/Topbar';
import { ClientForm } from './ClientForm';

export const metadata = { title: '고객 추가' };

export default function NewClientPage() {
  return (
    <>
      <Topbar title="고객 추가" subtitle="엔딩 시나리오 생성에 필요한 기본 정보를 입력합니다" />
      <main className="flex-1 p-6 md:p-8">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          고객 목록으로
        </Link>
        <ClientForm />
      </main>
    </>
  );
}
