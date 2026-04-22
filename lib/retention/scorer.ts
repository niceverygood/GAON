/**
 * Deterministic retention risk scorer — v1.
 *
 * CLAUDE.md defines the factor mix:
 *   - 미납 경고 (30일 이상 → +30점)
 *   - 경제 상황 (CODEF 연동 전까진 asset/debt 시그널)
 *   - 연락 무응답 일수
 *   - 가족 변동
 *   - 타사 상조 가입 탐지
 *   - 건강 변화
 *
 * v1은 DB에 있는 값만으로 계산. CODEF·연락기록은 Phase 2에서 factors에 합산.
 *
 * 합산 후 0~100으로 클램프. 각 요인은 FactorKey로 별도 저장해서
 * 플래너가 왜 점수가 높은지 즉시 볼 수 있게 한다.
 */

import type { Client, ClientAssets, ClientFamily, SangjoContract } from '@/types/db';

export type FactorKey =
  | 'overdue'
  | 'low_progress'
  | 'tenure_risk'
  | 'debt_ratio'
  | 'income_gap'
  | 'competing_sangjo'
  | 'missing_info';

export type Factor = { key: FactorKey; label: string; points: number; hint?: string };

export type RiskTier = 'low' | 'medium' | 'high' | 'critical';

export type ScoreResult = {
  score: number;
  tier: RiskTier;
  factors: Factor[];
  recommended_action: string;
};

export type ScoreInput = {
  contract: Pick<
    SangjoContract,
    'id' | 'monthly_payment' | 'total_months' | 'paid_months' | 'contract_date' | 'status'
  >;
  client: Pick<Client, 'family_json' | 'asset_json' | 'phone' | 'notes'>;
  /** Days since planner last made contact. Optional — Phase 2 hooks this up. */
  last_contact_days?: number;
};

export function scoreContract(input: ScoreInput): ScoreResult {
  const factors: Factor[] = [];

  // ── 1. 납입 진도 / 미납 ──────────────────────────────────
  const total = input.contract.total_months ?? 0;
  const paid = input.contract.paid_months ?? 0;
  const expected = expectedPaidMonths(input.contract.contract_date);

  if (expected != null && paid < expected) {
    const gap = expected - paid;
    const pts = Math.min(40, gap * 10);
    factors.push({
      key: 'overdue',
      label: '납입 지연',
      points: pts,
      hint: `계약일 기준 예상 ${expected}개월 대비 ${paid}개월 납입 (${gap}개월 지연)`,
    });
  }

  if (total > 0) {
    const progress = paid / total;
    if (progress > 0.2 && progress < 0.6) {
      factors.push({
        key: 'low_progress',
        label: '중도 이탈 구간',
        points: 15,
        hint: `납입 진도 ${Math.round(progress * 100)}% — 해약이 가장 많이 발생하는 구간`,
      });
    }
  }

  // ── 2. 계약 초기 리스크 (첫 12개월) ──────────────────────
  const tenureMonths = monthsSince(input.contract.contract_date);
  if (tenureMonths != null && tenureMonths <= 12) {
    factors.push({
      key: 'tenure_risk',
      label: '계약 초기',
      points: 10,
      hint: `체결 ${tenureMonths}개월 — 신규 계약은 조기 해약 확률이 상대적으로 높음`,
    });
  }

  // ── 3. 재무 시그널 ─────────────────────────────────────
  const assets: ClientAssets = input.client.asset_json ?? {};
  const income = assets.monthly_income ?? 0;
  const debt = assets.debt ?? 0;
  const monthly = input.contract.monthly_payment ?? 0;

  if (income > 0 && monthly > 0) {
    const ratio = monthly / income;
    if (ratio > 0.08) {
      factors.push({
        key: 'income_gap',
        label: '소득 대비 납입 부담',
        points: Math.min(15, Math.round(ratio * 100)),
        hint: `월 소득의 ${(ratio * 100).toFixed(1)}% 를 상조에 납입 — 부담 구간`,
      });
    }
  }

  if (income > 0 && debt > 0) {
    const ratio = debt / (income * 12);
    if (ratio > 3) {
      factors.push({
        key: 'debt_ratio',
        label: '고부채',
        points: 12,
        hint: `연 소득 대비 부채 ${ratio.toFixed(1)}배`,
      });
    }
  }

  // ── 4. 타사 상조 경쟁 ───────────────────────────────────
  if ((assets.existing_sangjo_monthly ?? 0) > 0) {
    factors.push({
      key: 'competing_sangjo',
      label: '타사 상조 가입',
      points: 10,
      hint: `타사 월 납입 ${(assets.existing_sangjo_monthly ?? 0).toLocaleString('ko-KR')}원 확인`,
    });
  }

  // ── 5. 연락 기록 (Phase 2 훅) ──────────────────────────
  if (input.last_contact_days != null && input.last_contact_days > 90) {
    factors.push({
      key: 'overdue',
      label: '연락 무응답',
      points: Math.min(15, Math.floor(input.last_contact_days / 30) * 3),
      hint: `${input.last_contact_days}일간 연락 기록 없음`,
    });
  }

  // ── 6. 정보 결손 ────────────────────────────────────────
  const family: ClientFamily = input.client.family_json ?? {};
  const missingInfo =
    !input.client.phone || (!family.spouse && family.children == null && family.parents_alive == null);
  if (missingInfo) {
    factors.push({
      key: 'missing_info',
      label: '정보 결손',
      points: 5,
      hint: '연락처·가족 구성 정보가 부족 — 선제 대응 난이도 상승',
    });
  }

  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  const score = Math.max(0, Math.min(100, raw));
  const tier = tierOf(score);

  return {
    score,
    tier,
    factors: factors.sort((a, b) => b.points - a.points),
    recommended_action: recommend(tier, factors),
  };
}

export function tierOf(score: number): RiskTier {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

function expectedPaidMonths(contractDate: string | null): number | null {
  const months = monthsSince(contractDate);
  return months;
}

function monthsSince(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)));
}

function recommend(tier: RiskTier, factors: Factor[]): string {
  const lead = factors[0];
  if (tier === 'critical') {
    return lead
      ? `즉시 대면·전화 연락 필요 — 주요 요인: ${lead.label}`
      : '즉시 대면·전화 연락 필요 — 해약 임박 구간';
  }
  if (tier === 'high') {
    return lead
      ? `이번 주 안에 안부 연락 권장 — ${lead.label} 해소 대화 준비`
      : '이번 주 안에 안부 연락 권장';
  }
  if (tier === 'medium') {
    return '이번 달 정기 터치포인트 유지';
  }
  return '유지 단계 — 자동 케어로 충분';
}
