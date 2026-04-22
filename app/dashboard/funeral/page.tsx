import { HeartHandshake } from 'lucide-react';
import { Topbar } from '@/components/common/Topbar';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = { title: '장례 실행 매니저' };

export default function FuneralPage() {
  return (
    <>
      <Topbar title="장례 실행 매니저" subtitle="Phase 3 — 준비 중" />
      <main className="flex-1 p-6 md:p-8">
        <Card className="border-dashed">
          <CardContent className="p-12 text-center space-y-4 max-w-xl mx-auto">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black tracking-tight">장례 실행 AI 매니저</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              사망진단서 → 장례식장 예약 → 화장장 → 부고 → 부의금 정리 → 답례까지,
              3일 간 유족 옆을 지키는 AI 매니저를 Month 3에 공개합니다.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
