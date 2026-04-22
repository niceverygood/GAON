import { Topbar } from '@/components/common/Topbar';
import { FuneralCostTool } from './FuneralCostTool';

export const metadata = { title: '장례비 비교 도구' };

export default function FuneralCostToolPage() {
  return (
    <>
      <Topbar title="장례비 비교 도구" subtitle="상담 중 즉시 사용 가능한 빠른 시뮬레이터" />
      <main className="flex-1 p-6 md:p-8">
        <FuneralCostTool />
      </main>
    </>
  );
}
