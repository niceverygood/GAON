/**
 * Demo seed dataset — the same content previously in scripts/seed_demo.sql,
 * ported to TypeScript so the test-login server action can inject it without
 * requiring a manual SQL editor run.
 *
 * Keep this file data-only (no side effects). The seeder in `./seed.ts`
 * resolves ids at runtime and issues service-role inserts.
 */

import type { ClientAssets, ClientFamily, Gender } from '@/types/db';
import type { ScenarioResult } from '@/types/scenario';

export type SeedClient = {
  /** Stable key for cross-table references below. */
  key: string;
  name: string;
  birth_date: string;
  gender: Gender;
  phone: string;
  address: string;
  occupation: string;
  family_json: ClientFamily;
  asset_json: ClientAssets;
  notes: string;
  /** Days ago created_at offset — gives the list a realistic staggered feel. */
  created_days_ago: number;
};

export type SeedContract = {
  key: string;
  client_key: string;
  product_name: string;
  monthly_payment: number;
  total_months: number;
  paid_months: number;
  /** Days ago contract date. */
  contract_days_ago: number;
  status: 'active' | 'paused' | 'terminated' | 'event';
};

export type SeedScenario = {
  client_key: string;
  result: ScenarioResult;
  model: string;
  created_days_ago: number;
};

export type SeedRetentionScore = {
  contract_key: string;
  score: number;
  tier: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{ key: string; label: string; points: number; hint?: string }>;
  recommended_action: string;
};

// ─── Clients ──────────────────────────────────────────────────────────────
export const SEED_CLIENTS: SeedClient[] = [
  {
    key: 'hong',
    name: '김영호',
    birth_date: '1958-03-15',
    gender: 'male',
    phone: '010-1234-5001',
    address: '서울특별시 강남구 역삼동',
    occupation: '자영업 (가구 유통)',
    family_json: {
      spouse: true,
      children: 2,
      parents_alive: 0,
      members: [
        { id: crypto.randomUUID(), relation: 'spouse', name: '이옥자', age: 65, gender: 'female', health_note: '고혈압·갑상선 관리 중' },
        { id: crypto.randomUUID(), relation: 'child', name: '김민수', age: 38, gender: 'male', financial_note: '분가, 맞벌이 · 서초구' },
        { id: crypto.randomUUID(), relation: 'child', name: '김민아', age: 35, gender: 'female', financial_note: '결혼 예정' },
      ],
    },
    asset_json: {
      monthly_income: 5_500_000,
      financial: 180_000_000,
      real_estate: 1_200_000_000,
      debt: 150_000_000,
      existing_sangjo_monthly: 39_900,
      insurance_monthly: 250_000,
    },
    notes: '당뇨 15년 · 최근 허리디스크 시술 · 부인도 고혈압 · 손주 예정',
    created_days_ago: 42,
  },
  {
    key: 'lee_sj',
    name: '이순자',
    birth_date: '1962-11-22',
    gender: 'female',
    phone: '010-2345-6002',
    address: '서울특별시 성북구 안암동',
    occupation: '주부',
    family_json: {
      spouse: true,
      children: 1,
      parents_alive: 1,
      members: [
        { id: crypto.randomUUID(), relation: 'spouse', name: '박철수', age: 66, gender: 'male', health_note: '경도 인지장애 진단' },
        { id: crypto.randomUUID(), relation: 'child', name: '박서영', age: 36, gender: 'female' },
        { id: crypto.randomUUID(), relation: 'grandchild', name: '박지훈', age: 5, gender: 'male' },
        { id: crypto.randomUUID(), relation: 'parent', name: '이정자', age: 89, gender: 'female', health_note: '요양원 거주' },
      ],
    },
    asset_json: {
      monthly_income: 0,
      financial: 80_000_000,
      real_estate: 650_000_000,
      debt: 0,
      existing_sangjo_monthly: 29_900,
      insurance_monthly: 180_000,
    },
    notes: '남편 치매 초기 진단 · 모친 요양원 · 간병 이슈가 복합적',
    created_days_ago: 35,
  },
  {
    key: 'park_jh',
    name: '박정호',
    birth_date: '1971-05-09',
    gender: 'male',
    phone: '010-3456-7003',
    address: '경기도 성남시 분당구',
    occupation: '공무원 (국세청)',
    family_json: {
      spouse: true,
      children: 2,
      parents_alive: 2,
      members: [
        { id: crypto.randomUUID(), relation: 'spouse', name: '최윤희', age: 52, gender: 'female' },
        { id: crypto.randomUUID(), relation: 'child', name: '박도윤', age: 23, gender: 'male' },
        { id: crypto.randomUUID(), relation: 'child', name: '박하은', age: 19, gender: 'female' },
        { id: crypto.randomUUID(), relation: 'parent', name: '박정수', age: 82, gender: 'male', health_note: '당뇨·심장질환' },
        { id: crypto.randomUUID(), relation: 'parent', name: '김영애', age: 79, gender: 'female' },
      ],
    },
    asset_json: {
      monthly_income: 6_500_000,
      financial: 220_000_000,
      real_estate: 950_000_000,
      debt: 350_000_000,
      existing_sangjo_monthly: 0,
      insurance_monthly: 420_000,
    },
    notes: '정년 7년 남음 · 자녀 2명 교육비 부담 · 아버지 병원비 증가 중',
    created_days_ago: 28,
  },
  {
    key: 'choi_mk',
    name: '최미경',
    birth_date: '1975-08-30',
    gender: 'female',
    phone: '010-4567-8004',
    address: '서울특별시 마포구 상암동',
    occupation: '초등학교 교사',
    family_json: { spouse: true, children: 1, parents_alive: 2 },
    asset_json: {
      monthly_income: 4_800_000,
      financial: 130_000_000,
      real_estate: 780_000_000,
      debt: 220_000_000,
      existing_sangjo_monthly: 0,
      insurance_monthly: 320_000,
    },
    notes: '건강검진 결과 특이사항 없음',
    created_days_ago: 22,
  },
  {
    key: 'jung_jw',
    name: '정재욱',
    birth_date: '1968-01-12',
    gender: 'male',
    phone: '010-5678-9005',
    address: '부산광역시 해운대구',
    occupation: '회사원 (조선업)',
    family_json: {
      spouse: true,
      children: 1,
      parents_alive: 1,
      members: [
        { id: crypto.randomUUID(), relation: 'spouse', name: '김은경', age: 56, gender: 'female' },
        { id: crypto.randomUUID(), relation: 'child', name: '정수민', age: 28, gender: 'female', financial_note: '유학 중' },
        { id: crypto.randomUUID(), relation: 'parent', name: '정대호', age: 86, gender: 'male', health_note: '독거, 간병 필요' },
      ],
    },
    asset_json: {
      monthly_income: 7_200_000,
      financial: 95_000_000,
      real_estate: 580_000_000,
      debt: 180_000_000,
      existing_sangjo_monthly: 49_900,
      insurance_monthly: 380_000,
    },
    notes: '명예퇴직 언급 시작 · 유학 중인 딸 송금 부담',
    created_days_ago: 18,
  },
  {
    key: 'kang_jy',
    name: '강지연',
    birth_date: '1980-09-18',
    gender: 'female',
    phone: '010-6789-0006',
    address: '경기도 수원시 영통구',
    occupation: '간호사',
    family_json: { spouse: true, children: 2, parents_alive: 2 },
    asset_json: {
      monthly_income: 5_100_000,
      financial: 70_000_000,
      real_estate: 520_000_000,
      debt: 280_000_000,
      existing_sangjo_monthly: 0,
      insurance_monthly: 290_000,
    },
    notes: '맞벌이 · 교대근무 · 시어머니 치매 걱정',
    created_days_ago: 15,
  },
  {
    key: 'yoon_ts',
    name: '윤태식',
    birth_date: '1955-12-07',
    gender: 'male',
    phone: '010-7890-1007',
    address: '전라남도 광주광역시 북구',
    occupation: '농업 (은퇴)',
    family_json: { spouse: true, children: 3, parents_alive: 0 },
    asset_json: {
      monthly_income: 1_200_000,
      financial: 45_000_000,
      real_estate: 380_000_000,
      debt: 20_000_000,
      existing_sangjo_monthly: 0,
      insurance_monthly: 90_000,
    },
    notes: '국민연금 · 기초연금 생활 · 자녀 3남매 모두 외지 거주',
    created_days_ago: 12,
  },
  {
    key: 'han_sy',
    name: '한소영',
    birth_date: '1983-04-25',
    gender: 'female',
    phone: '010-8901-2008',
    address: '서울특별시 송파구 잠실동',
    occupation: '변호사 (개인사무소)',
    family_json: {
      spouse: true,
      children: 1,
      parents_alive: 2,
      members: [
        { id: crypto.randomUUID(), relation: 'spouse', name: '김태현', age: 43, gender: 'male', financial_note: '대기업 임원' },
        { id: crypto.randomUUID(), relation: 'child', name: '김주원', age: 9, gender: 'male' },
        { id: crypto.randomUUID(), relation: 'parent', name: '한상식', age: 71, gender: 'male' },
        { id: crypto.randomUUID(), relation: 'parent', name: '서명숙', age: 68, gender: 'female' },
      ],
    },
    asset_json: {
      monthly_income: 14_500_000,
      financial: 480_000_000,
      real_estate: 1_850_000_000,
      debt: 600_000_000,
      existing_sangjo_monthly: 0,
      insurance_monthly: 850_000,
    },
    notes: '고소득 · 고자산 · 상속세 설계 관심 높음',
    created_days_ago: 9,
  },
  {
    key: 'cho_hj',
    name: '조현준',
    birth_date: '1972-07-14',
    gender: 'male',
    phone: '010-9012-3009',
    address: '대전광역시 유성구',
    occupation: '자영업 (음식점)',
    family_json: { spouse: true, children: 2, parents_alive: 1 },
    asset_json: {
      monthly_income: 3_800_000,
      financial: 38_000_000,
      real_estate: 420_000_000,
      debt: 380_000_000,
      existing_sangjo_monthly: 59_000,
      insurance_monthly: 120_000,
    },
    notes: '코로나 이후 매출 회복 더딤 · 대출 이자 부담',
    created_days_ago: 7,
  },
  {
    key: 'oh_ms',
    name: '오민수',
    birth_date: '1988-06-11',
    gender: 'male',
    phone: '010-0123-4010',
    address: '서울특별시 강서구 마곡동',
    occupation: 'IT 개발자 (스타트업)',
    family_json: { spouse: false, children: 0, parents_alive: 2 },
    asset_json: {
      monthly_income: 6_800_000,
      financial: 85_000_000,
      real_estate: 0,
      debt: 45_000_000,
      existing_sangjo_monthly: 0,
      insurance_monthly: 180_000,
    },
    notes: '미혼 · 부모님 대상 상조 검토 중',
    created_days_ago: 4,
  },
];

// ─── Contracts ────────────────────────────────────────────────────────────
export const SEED_CONTRACTS: SeedContract[] = [
  { key: 'k_hong',    client_key: 'hong',    product_name: '프리미엄 A형 (1인 3일장)',   monthly_payment: 49_900, total_months: 120, paid_months: 78, contract_days_ago: 2360, status: 'active' },
  { key: 'k_lee_sj',  client_key: 'lee_sj',  product_name: '스탠다드 B형',                monthly_payment: 29_900, total_months: 120, paid_months: 18, contract_days_ago:  900, status: 'active' },
  { key: 'k_park_jh', client_key: 'park_jh', product_name: '프리미엄 A형',                monthly_payment: 59_900, total_months: 120, paid_months:  6, contract_days_ago:  210, status: 'active' },
  { key: 'k_choi_mk', client_key: 'choi_mk', product_name: '스탠다드 B형',                monthly_payment: 39_900, total_months: 120, paid_months: 24, contract_days_ago:  720, status: 'active' },
  { key: 'k_jung_jw', client_key: 'jung_jw', product_name: '프리미엄 플러스 (가족형)',     monthly_payment: 89_900, total_months: 120, paid_months: 36, contract_days_ago: 1200, status: 'active' },
  { key: 'k_kang_jy', client_key: 'kang_jy', product_name: '스탠다드 B형',                monthly_payment: 39_900, total_months: 120, paid_months: 12, contract_days_ago:  390, status: 'active' },
  { key: 'k_yoon_ts', client_key: 'yoon_ts', product_name: '이코노미 C형',                monthly_payment: 19_900, total_months: 180, paid_months: 48, contract_days_ago: 1560, status: 'active' },
  { key: 'k_han_sy',  client_key: 'han_sy',  product_name: '프리미엄 플러스 (가족형)',     monthly_payment: 99_900, total_months:  60, paid_months:  9, contract_days_ago:  300, status: 'active' },
  { key: 'k_cho_hj',  client_key: 'cho_hj',  product_name: '스탠다드 B형',                monthly_payment: 39_900, total_months: 120, paid_months: 42, contract_days_ago: 1530, status: 'active' },
  { key: 'k_oh_ms',   client_key: 'oh_ms',   product_name: '프리미엄 A형 (부모동반)',      monthly_payment: 79_900, total_months: 120, paid_months:  2, contract_days_ago:   70, status: 'active' },
];

// ─── Retention scores ─────────────────────────────────────────────────────
export const SEED_SCORES: SeedRetentionScore[] = [
  {
    contract_key: 'k_hong', score: 15, tier: 'low',
    factors: [
      { key: 'tenure_risk', label: '계약 초기', points: 0, hint: '계약 6년차' },
      { key: 'missing_info', label: '정보 결손', points: 5, hint: '재무 세부 항목 미기재' },
    ],
    recommended_action: '유지 단계 — 자동 케어로 충분',
  },
  {
    contract_key: 'k_lee_sj', score: 68, tier: 'high',
    factors: [
      { key: 'overdue', label: '납입 지연', points: 40, hint: '계약일 기준 예상 30개월 대비 18개월 납입 (12개월 지연)' },
      { key: 'low_progress', label: '중도 이탈 구간', points: 15, hint: '납입 진도 15% — 해약이 가장 많이 발생하는 구간' },
      { key: 'competing_sangjo', label: '타사 상조 가입', points: 10, hint: '타사 월 납입 29,900원 확인' },
      { key: 'income_gap', label: '소득 대비 납입 부담', points: 3, hint: '가계소득 0 · 배우자 연금 의존' },
    ],
    recommended_action: '이번 주 안에 안부 연락 권장 — 납입 지연 해소 대화 준비',
  },
  {
    contract_key: 'k_park_jh', score: 25, tier: 'medium',
    factors: [
      { key: 'tenure_risk', label: '계약 초기', points: 10, hint: '체결 7개월 — 신규 계약은 조기 해약 확률이 상대적으로 높음' },
      { key: 'overdue', label: '납입 지연', points: 10, hint: '예상 7개월 대비 6개월 납입 (1개월 지연)' },
      { key: 'income_gap', label: '소득 대비 납입 부담', points: 5, hint: '자녀 교육·부모 간병 복합 부담' },
    ],
    recommended_action: '이번 달 정기 터치포인트 유지',
  },
  {
    contract_key: 'k_jung_jw', score: 72, tier: 'critical',
    factors: [
      { key: 'overdue', label: '납입 지연', points: 30, hint: '계약일 기준 예상 40개월 대비 36개월 납입 (4개월 지연)' },
      { key: 'low_progress', label: '중도 이탈 구간', points: 15, hint: '납입 진도 30% — 해약이 가장 많이 발생하는 구간' },
      { key: 'income_gap', label: '소득 대비 납입 부담', points: 12, hint: '월 소득의 12.5%를 상조에 납입 — 부담 구간' },
      { key: 'competing_sangjo', label: '타사 상조 가입', points: 10, hint: '타사 월 납입 49,900원 확인' },
      { key: 'debt_ratio', label: '고부채', points: 5, hint: '명예퇴직 검토 · 유학비 송금 부담' },
    ],
    recommended_action: '즉시 대면·전화 연락 필요 — 주요 요인: 납입 지연',
  },
  {
    contract_key: 'k_kang_jy', score: 10, tier: 'low',
    factors: [
      { key: 'tenure_risk', label: '계약 초기', points: 10, hint: '체결 13개월 · 정상 납입 중' },
    ],
    recommended_action: '유지 단계 — 자동 케어로 충분',
  },
  {
    contract_key: 'k_yoon_ts', score: 55, tier: 'high',
    factors: [
      { key: 'overdue', label: '납입 지연', points: 30, hint: '예상 52개월 대비 48개월 납입 (4개월 지연)' },
      { key: 'income_gap', label: '소득 대비 납입 부담', points: 15, hint: '연금 소득 대비 납입 비율 높음' },
      { key: 'low_progress', label: '중도 이탈 구간', points: 5, hint: '납입 진도 27%' },
      { key: 'missing_info', label: '정보 결손', points: 5, hint: '자녀 가족 구성 미입력' },
    ],
    recommended_action: '이번 주 안에 안부 연락 권장 — 납입 지연 해소 대화 준비',
  },
  {
    contract_key: 'k_han_sy', score: 8, tier: 'low',
    factors: [
      { key: 'tenure_risk', label: '계약 초기', points: 8, hint: '체결 10개월 · 정상' },
    ],
    recommended_action: '유지 단계 — 자동 케어로 충분',
  },
  {
    contract_key: 'k_cho_hj', score: 78, tier: 'critical',
    factors: [
      { key: 'overdue', label: '납입 지연', points: 30, hint: '예상 51개월 대비 42개월 납입 (9개월 지연)' },
      { key: 'low_progress', label: '중도 이탈 구간', points: 15, hint: '납입 진도 35% — 해약 최다 구간' },
      { key: 'debt_ratio', label: '고부채', points: 12, hint: '연 소득 대비 부채 8.3배' },
      { key: 'income_gap', label: '소득 대비 납입 부담', points: 11, hint: '월 소득의 10.5%를 상조에 납입' },
      { key: 'competing_sangjo', label: '타사 상조 가입', points: 10, hint: '타사 월 납입 59,000원 확인' },
    ],
    recommended_action: '즉시 대면·전화 연락 필요 — 주요 요인: 납입 지연',
  },
];

// ─── Pre-baked ending scenarios ───────────────────────────────────────────
export const SEED_SCENARIOS: SeedScenario[] = [
  {
    client_key: 'hong',
    model: 'anthropic/claude-sonnet-4.5',
    created_days_ago: 5,
    result: {
      headline:
        '김영호 고객님(67세)께서는 통계적으로 앞으로 15~22년의 생애 구간이 남아 있으며, 당뇨·척추 이슈가 55~65세 남성의 평균적 의료 동선과 맞닿아 있습니다. 간병·장례·상속 준비를 3~5년 내 단계적으로 설계하는 것이 합리적입니다.',
      life_expectancy_range: { low: 82, high: 89, source: '통계청 2023 생명표' },
      timeline: [
        { age: 70, category: 'health', title: '당뇨 합병증 모니터링 강화기', detail: '동년배 남성 기준 망막·신장 합병증 발병 피크. 연 2회 정밀 검진 권장.', estimated_cost_krw: 5_000_000, probability: 0.45, source: '국민건강보험공단 2022' },
        { age: 74, category: 'care', title: '경증 간병 시작 평균기', detail: '당뇨·심혈관 복합 질환 경우 주 3회 방문돌봄 이용 평균 구간.', estimated_cost_krw: 3_500_000, probability: 0.35, source: 'OECD 2023 고령간병' },
        { age: 78, category: 'milestone', title: '배우자 단독 케어 구간 진입', detail: '부인(현 65세)이 70대 중반에 진입 · 상호 간병 부담 재평가 필요.', probability: 0.5 },
        { age: 83, category: 'funeral', title: '통계 평균 엔딩 구간', detail: '서울 강남 3일장 기준 장례 비용 평균 1,720만원.', estimated_cost_krw: 17_200_000, source: '한국소비자원 2023' },
        { age: 84, category: 'inheritance', title: '상속세 설계 권장 시점', detail: '자산 13.2억원 · 배우자 공제 후 자녀 상속세 약 2,100만원 예상.', estimated_cost_krw: 21_000_000, source: '국세청 2023 상속세 공시' },
      ],
      costs: {
        lifetime_medical_krw: 48_000_000,
        care_total_krw: 126_000_000,
        care_monthly_krw: 3_500_000,
        care_avg_months: 36,
        funeral_krw: 17_200_000,
        inheritance_tax_krw: 21_000_000,
        total_need_krw: 212_000_000,
      },
      coverage_gap: {
        currently_covered_krw: 5_988_000,
        shortfall_krw: 206_012_000,
        summary: '현재 상조·보험만으로는 간병·장례·상속 합산 수요의 약 3%만 커버됩니다. 간병 대비 장기요양보험 검토와 상속세 사전 증여가 우선.',
      },
      planner_talking_points: [
        '"15년 뒤 병원비·간병비 합치면 1억 원이 넘어가는 구간이 통계적으로 나옵니다. 지금 월 수입이 여유 있으실 때 분산해서 준비하는 게 가장 효율적이에요."',
        '"따님 결혼 앞두고 계신데, 지금 상속 설계를 5년 단위로 쪼개두면 증여세 한도를 반복해서 쓸 수 있습니다."',
        '"부인께서도 고혈압 관리 중이시라, 부부 동반 상조로 묶으면 단일 가입보다 유족 부담이 눈에 띄게 줄어듭니다."',
      ],
      disclaimer: '본 시나리오는 통계 기반 참고 자료이며, 의학·법률·세무 자문은 반드시 해당 전문가를 통해 확인해 주세요.',
    },
  },
  {
    client_key: 'park_jh',
    model: 'anthropic/claude-sonnet-4.5',
    created_days_ago: 2,
    result: {
      headline:
        '박정호 고객님(54세)께서는 정년 전 7년 · 정년 후 25~30년의 두 구간을 분리해 설계해야 합니다. 부모님 간병과 자녀 교육비가 동시에 겹치는 향후 10년이 재무적으로 가장 촘촘한 구간입니다.',
      life_expectancy_range: { low: 84, high: 91, source: '통계청 2023 생명표' },
      timeline: [
        { age: 58, category: 'care', title: '아버지(82세) 집중 간병 확률 구간', detail: '당뇨·심장질환 동반 남성 80대 평균 간병 전환 시점.', estimated_cost_krw: 24_000_000, probability: 0.55 },
        { age: 62, category: 'milestone', title: '정년 전환 · 소득 30~50% 하락', detail: '공무원 평균 정년퇴직 연령. 연금 수급 전 가교 5년 구간 필요.' },
        { age: 65, category: 'inheritance', title: '부모 상속 평균 발생 구간', detail: '부모 자산 약 6억원 기준 상속세 0 (공제 내).' },
        { age: 72, category: 'health', title: '퇴행성 질환 관리 본격화', detail: '고혈압·무릎 관절염 등 복합 발병 피크.', estimated_cost_krw: 18_000_000 },
        { age: 86, category: 'funeral', title: '통계 평균 엔딩 구간', detail: '경기 분당 기준 장례 평균 1,510만원.', estimated_cost_krw: 15_100_000 },
      ],
      costs: {
        lifetime_medical_krw: 62_000_000,
        care_total_krw: 84_000_000,
        care_monthly_krw: 2_800_000,
        care_avg_months: 30,
        funeral_krw: 15_100_000,
        inheritance_tax_krw: 0,
        total_need_krw: 161_100_000,
      },
      coverage_gap: {
        currently_covered_krw: 0,
        shortfall_krw: 161_100_000,
        summary: '상조 미가입 상태 · 보험만으로는 간병 커버 어려움. 지금 시점 월 5만원대 중장기 상조가 가장 가성비 높은 옵션입니다.',
      },
      planner_talking_points: [
        '"자녀 두 분 대학 학자금이랑 아버지 간병이 5~7년 안에 겹쳐서 옵니다. 지금 월 부담 30~40만원으로 분산해두는 게 10년 뒤 수백만 원 단위 충격을 막습니다."',
        '"정년 7년 남으셨는데, 퇴직 후 상조 신규 가입은 월 납입이 30% 이상 비싸집니다. 재직 중 가입이 가성비 차이가 크죠."',
        '"부모님 상속은 공제 안쪽이지만, 본인 세대는 자산 규모가 다릅니다. 지금부터 15년 단위 증여 전략을 같이 설계해 두시면 좋습니다."',
      ],
      disclaimer: '본 시나리오는 통계 기반 참고 자료이며, 의학·법률·세무 자문은 반드시 해당 전문가를 통해 확인해 주세요.',
    },
  },
];
