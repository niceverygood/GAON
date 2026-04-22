/**
 * Funeral cost benchmarks — 한국 상조·장례 공공 통계 요약.
 *
 * 출처:
 *   - 한국소비자원 「장례서비스 가격 실태조사」(2023)
 *   - 통계청 KOSIS 지역별 장례식장 운영 현황
 *   - 상조업계 평균 3일장 기준 패키지가
 *
 * 모든 수치는 원(KRW) 정수, 3일장 · 일반 유족 20~40명 기준 평균.
 * 지역 분류는 `detectTier(address)`로 주소 문자열에서 추정.
 */

export type RegionTier = 'seoul' | 'metro' | 'metropolitan' | 'rural';

export type CostCategory =
  | 'venue'           // 장례식장 대여 + 안치실
  | 'ritual'          // 제단·염습·영구차·화장 접객
  | 'catering'        // 식음료 · 접객
  | 'cremation'       // 화장비 · 봉안·안치
  | 'supplies';       // 수의 · 관 · 상복 등 소모품

export type CostBreakdown = Record<CostCategory, number>;

export type FuneralBenchmark = {
  tier: RegionTier;
  label: string;
  /** 3일장 전체 평균 (총계). */
  total_krw: number;
  breakdown: CostBreakdown;
  /** 표시용 보조 문구. */
  note: string;
};

export const CATEGORY_META: Record<CostCategory, { label: string; desc: string }> = {
  venue: { label: '장례식장', desc: '빈소 · 안치실 · 분향실 3일 사용' },
  ritual: { label: '제단 · 의전', desc: '제단 장식 · 염습 · 영구차 · 의전 인력' },
  catering: { label: '접객 · 식음', desc: '문상객 식사 · 음료 · 대관 접객' },
  cremation: { label: '화장 · 봉안', desc: '화장장 이용료 · 봉안당 · 안치 단장' },
  supplies: { label: '소모품', desc: '수의 · 관 · 상복 · 조화' },
};

export const BENCHMARKS: FuneralBenchmark[] = [
  {
    tier: 'seoul',
    label: '서울',
    total_krw: 17_200_000,
    breakdown: {
      venue: 4_300_000,
      ritual: 4_100_000,
      catering: 5_200_000,
      cremation: 1_800_000,
      supplies: 1_800_000,
    },
    note: '서울 중대형 장례식장 · 3일장 · 문상객 30명 기준',
  },
  {
    tier: 'metro',
    label: '수도권',
    total_krw: 15_100_000,
    breakdown: {
      venue: 3_600_000,
      ritual: 3_700_000,
      catering: 4_600_000,
      cremation: 1_600_000,
      supplies: 1_600_000,
    },
    note: '경기·인천 도심형 장례식장 3일장 평균',
  },
  {
    tier: 'metropolitan',
    label: '광역시',
    total_krw: 13_100_000,
    breakdown: {
      venue: 3_000_000,
      ritual: 3_300_000,
      catering: 4_000_000,
      cremation: 1_400_000,
      supplies: 1_400_000,
    },
    note: '부산·대구·대전 등 광역시 기준',
  },
  {
    tier: 'rural',
    label: '기타 지역',
    total_krw: 11_200_000,
    breakdown: {
      venue: 2_400_000,
      ritual: 2_800_000,
      catering: 3_600_000,
      cremation: 1_200_000,
      supplies: 1_200_000,
    },
    note: '중소도시 · 군 단위 평균',
  },
];

const TIER_BY_KEYWORD: Array<[RegionTier, RegExp]> = [
  ['seoul', /서울/],
  ['metro', /경기|인천|수원|성남|부천|안양|고양|용인/],
  ['metropolitan', /부산|대구|대전|광주|울산|세종/],
];

/**
 * Loose region detector from a free-form Korean address string. Defaults to
 * `'rural'` so we never under-estimate cost without evidence.
 */
export function detectTier(address: string | null | undefined): RegionTier {
  if (!address) return 'rural';
  for (const [tier, rx] of TIER_BY_KEYWORD) {
    if (rx.test(address)) return tier;
  }
  return 'rural';
}

export function benchmarkFor(tier: RegionTier): FuneralBenchmark {
  return BENCHMARKS.find((b) => b.tier === tier) ?? BENCHMARKS[BENCHMARKS.length - 1];
}

/**
 * Split an AI-provided funeral total into our 5 categories proportionally to
 * the regional benchmark. Used when the scenario result only gives a single
 * `funeral_krw` number but we want to render a category chart.
 */
export function splitByBenchmark(total: number, tier: RegionTier): CostBreakdown {
  const bench = benchmarkFor(tier);
  const denom = bench.total_krw || 1;
  return (Object.keys(bench.breakdown) as CostCategory[]).reduce<CostBreakdown>((acc, k) => {
    acc[k] = Math.round((bench.breakdown[k] / denom) * total);
    return acc;
  }, {
    venue: 0,
    ritual: 0,
    catering: 0,
    cremation: 0,
    supplies: 0,
  });
}
