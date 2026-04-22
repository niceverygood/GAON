import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, HeartHandshake, LineChart, Users } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Fully static — ISR so the edge serves a cached HTML payload to every visitor
// and the page never triggers a fresh function invocation on hot paths.
export const revalidate = 3600;

export default function LandingPage() {
  return (
    <>
      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-white to-white" />
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 md:pt-32 md:pb-28">
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-0">
            상조 플래너를 위한 AI 업무 플랫폼
          </Badge>
          <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight text-slate-900">
            고객이 먼저<br className="hidden md:block" />
            <span className="text-indigo-600">엔딩 플랜</span>을 말하게 하세요.
          </h1>
          <p className="mt-6 max-w-2xl text-lg md:text-xl text-slate-600 leading-relaxed">
            가온은 한국 상조 플래너의 3대 고민—심리 저항·해약·실행—을 AI로 해결하는
            올인원 플래닝 SaaS입니다. 객관적 수치는 AI가 말하고, 플래너는 해결책을 제시합니다.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="#contact"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-12 px-6 text-base bg-indigo-600 text-white hover:bg-indigo-700 [a&]:hover:bg-indigo-700',
              )}
            >
              파일럿 문의하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'h-12 px-6 text-base')}
            >
              플래너 로그인
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl">
            <Stat label="해약 감소 목표" value="5~10%p" />
            <Stat label="상담 전환 개선" value="2배↑" />
            <Stat label="신입 온보딩" value="1/3로" />
          </div>
        </div>
      </section>

      {/* ── 3 KILLER FEATURES ──────────────────────────────── */}
      <section id="features" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-indigo-600">세 가지 킬러 기능</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">
              플래너가 업무 전에는 돌아갈 수 없는 도구
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              무거운 주제는 가온이 데이터로 말합니다. 플래너는 고객 옆에서 신뢰를 쌓는 데 집중합니다.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              tint="indigo"
              title="엔딩 시나리오"
              subtitle="막연한 공포를 구체적 숫자로"
              body="나이·가족·자산을 입력하면 AI가 향후 20~30년의 질병·간병·장례·상속 타임라인을 태블릿 한 화면에 시각화합니다."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-6 w-6" />}
              tint="amber"
              title="해약 방지 AI"
              subtitle="이번 달 해약 위험 Top 10"
              body="미납·경제·무응답·가족 변동 신호를 매일 재계산해 리스크 스코어를 제공합니다. 선제 연락 화법까지 AI가 제안합니다."
            />
            <FeatureCard
              icon={<HeartHandshake className="h-6 w-6" />}
              tint="rose"
              title="장례 실행 AI 매니저"
              subtitle="3일간 유족·플래너 옆에"
              body="사망진단서부터 부고 문구·부의금 정리·답례 안내까지. 신입도 베테랑 수준의 서비스를 유족에게 전할 수 있습니다."
            />
          </div>
        </div>
      </section>

      {/* ── ROI ────────────────────────────────────────────── */}
      <section id="roi" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-indigo-600">숫자로 증명되는 성과</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">
              10년 납입 중 30~50%가 해약됩니다.<br />
              <span className="text-slate-500">가온은 그 중 5~10%p를 지킵니다.</span>
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Metric icon={<LineChart className="h-5 w-5" />} value="수십억원" label="상조사 1곳 연간 해약 손실 절감 기대치" />
            <Metric icon={<Users className="h-5 w-5" />} value="2배↑" label="상담 전환율 — 엔딩 시나리오 사용 시" />
            <Metric icon={<Sparkles className="h-5 w-5" />} value="70%↓" label="신입 플래너 장례 실전 교육 시간" />
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────── */}
      <section id="pricing" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-indigo-600">요금</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">
              플래너 1명당 월 3만원부터.
            </h2>
            <p className="mt-4 text-slate-600">
              조직 규모에 맞게 선택하세요. 파일럿은 첫 달 무료로 진행합니다.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <PricingCard
              name="Starter"
              price="30,000"
              audience="소형 상조사 (~10명)"
              features={['엔딩 시나리오', '기본 CRM', '고객 공유 링크']}
            />
            <PricingCard
              highlight
              name="Pro"
              price="40,000"
              audience="중견 (10~100명)"
              features={['Starter 전체', '해약 방지 AI', '장례 실행 AI 매니저', '관리자 대시보드']}
            />
            <PricingCard
              name="Enterprise"
              price="협의"
              audience="대형 (100명+)"
              features={['Pro 전체', '전담 매니저', '커스텀 연동 · API', '온프레미스 옵션']}
            />
          </div>
        </div>
      </section>

      {/* ── CONTACT / CTA ──────────────────────────────────── */}
      <section id="contact" className="border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            파일럿 상조사 1곳을 모집합니다.
          </h2>
          <p className="mt-4 text-slate-600 text-lg">
            첫 달 무료. 해약 방지 성과는 함께 측정합니다.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <a
              href="mailto:hello@gaon.app"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-12 px-8 bg-indigo-600 text-white hover:bg-indigo-700 [a&]:hover:bg-indigo-700',
              )}
            >
              이메일로 문의
            </a>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'h-12 px-8')}
            >
              로그인해서 둘러보기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-black text-slate-900">{value}</div>
      <div className="mt-1 text-xs md:text-sm text-slate-500">{label}</div>
    </div>
  );
}

const TINTS = {
  indigo: 'bg-indigo-100 text-indigo-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
} as const;

function FeatureCard({
  icon,
  tint,
  title,
  subtitle,
  body,
}: {
  icon: React.ReactNode;
  tint: keyof typeof TINTS;
  title: string;
  subtitle: string;
  body: string;
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${TINTS[tint]}`}>
          {icon}
        </div>
        <h3 className="mt-4 text-xl font-bold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
        <p className="mt-4 text-slate-600 leading-relaxed">{body}</p>
      </CardContent>
    </Card>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-6">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
          {icon}
        </div>
        <div className="mt-4 text-3xl font-black text-slate-900">{value}</div>
        <div className="mt-2 text-sm text-slate-600 leading-relaxed">{label}</div>
      </CardContent>
    </Card>
  );
}

function PricingCard({
  name,
  price,
  audience,
  features,
  highlight,
}: {
  name: string;
  price: string;
  audience: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-indigo-600 shadow-lg shadow-indigo-600/10 relative' : 'border-slate-200'}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-indigo-600 hover:bg-indigo-600">가장 많이 선택</Badge>
        </div>
      )}
      <CardContent className="p-6">
        <div className="text-sm text-slate-500">{audience}</div>
        <div className="mt-1 text-xl font-bold">{name}</div>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-black">₩{price}</span>
          {price !== '협의' && <span className="text-sm text-slate-500">/플래너/월</span>}
        </div>
        <ul className="mt-6 space-y-2 text-sm text-slate-700">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-600" />
              {f}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
