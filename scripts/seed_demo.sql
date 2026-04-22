-- ============================================================
-- Gaon — Demo seed (idempotent)
-- ============================================================
-- 데모 플래너(`demo@gaon.app`) 앞에 한국 현장감이 드러나는 샘플
-- 고객 10명 · 계약 10건 · 가족 구성원 · 엔딩 시나리오 2건 · 해약 스코어 8건
-- 을 주입합니다.
--
-- 안전장치:
--   * 실행 시 기존 demo 플래너의 고객/계약/시나리오/스코어를 먼저 삭제
--     → 반복 실행해도 깨지지 않습니다 (다른 실 계정에는 영향 없음).
--   * demo@gaon.app 가 auth.users 에 아직 없으면 raise exception.
-- ============================================================

do $$
declare
  v_planner  uuid;
  v_now      timestamptz := now();

  -- Client ids (pre-alloc so contracts / scenarios can reference them)
  c_hong     uuid := gen_random_uuid();
  c_lee_sj   uuid := gen_random_uuid();
  c_park_jh  uuid := gen_random_uuid();
  c_choi_mk  uuid := gen_random_uuid();
  c_jung_jw  uuid := gen_random_uuid();
  c_kang_jy  uuid := gen_random_uuid();
  c_yoon_ts  uuid := gen_random_uuid();
  c_han_sy   uuid := gen_random_uuid();
  c_cho_hj   uuid := gen_random_uuid();
  c_oh_ms    uuid := gen_random_uuid();

  -- Contract ids
  k_hong     uuid := gen_random_uuid();
  k_lee_sj   uuid := gen_random_uuid();
  k_park_jh  uuid := gen_random_uuid();
  k_choi_mk  uuid := gen_random_uuid();
  k_jung_jw  uuid := gen_random_uuid();
  k_kang_jy  uuid := gen_random_uuid();
  k_yoon_ts  uuid := gen_random_uuid();
  k_han_sy   uuid := gen_random_uuid();
  k_cho_hj   uuid := gen_random_uuid();
  k_oh_ms    uuid := gen_random_uuid();
begin
  -- 1. Resolve demo planner --------------------------------------------------
  select id into v_planner from auth.users where email = 'demo@gaon.app' limit 1;
  if v_planner is null then
    raise exception '데모 플래너 계정이 없습니다. 로그인 페이지에서 "테스트 계정으로 로그인" 을 먼저 한 번 클릭해 주세요.';
  end if;

  -- planners 행이 없으면 backfill
  insert into public.planners (id, name)
  values (v_planner, '테스트 플래너')
  on conflict (id) do nothing;

  -- 2. Wipe prior demo data --------------------------------------------------
  delete from public.retention_scores
  where contract_id in (select id from public.sangjo_contracts where planner_id = v_planner);
  delete from public.ending_scenarios where planner_id = v_planner;
  delete from public.sangjo_contracts where planner_id = v_planner;
  delete from public.clients where planner_id = v_planner;

  -- 3. Clients ---------------------------------------------------------------
  insert into public.clients (id, planner_id, name, birth_date, gender, phone, address, occupation, family_json, asset_json, notes, created_at) values
    (c_hong, v_planner, '김영호', '1958-03-15', 'male',
      '010-1234-5001', '서울특별시 강남구 역삼동', '자영업 (가구 유통)',
      jsonb_build_object(
        'spouse', true, 'children', 2, 'parents_alive', 0,
        'members', jsonb_build_array(
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'spouse', 'name', '이옥자', 'age', 65, 'gender', 'female', 'health_note', '고혈압·갑상선 관리 중'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'child', 'name', '김민수', 'age', 38, 'gender', 'male', 'financial_note', '분가, 맞벌이 · 서초구'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'child', 'name', '김민아', 'age', 35, 'gender', 'female', 'financial_note', '결혼 예정')
        )
      ),
      jsonb_build_object('monthly_income', 5500000, 'financial', 180000000, 'real_estate', 1200000000, 'debt', 150000000, 'existing_sangjo_monthly', 39900, 'insurance_monthly', 250000),
      '당뇨 15년 · 최근 허리디스크 시술 · 부인도 고혈압 · 손주 예정',
      v_now - interval '42 days'),

    (c_lee_sj, v_planner, '이순자', '1962-11-22', 'female',
      '010-2345-6002', '서울특별시 성북구 안암동', '주부',
      jsonb_build_object(
        'spouse', true, 'children', 1, 'parents_alive', 1,
        'members', jsonb_build_array(
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'spouse', 'name', '박철수', 'age', 66, 'gender', 'male', 'health_note', '경도 인지장애 진단'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'child', 'name', '박서영', 'age', 36, 'gender', 'female'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'grandchild', 'name', '박지훈', 'age', 5, 'gender', 'male'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'parent', 'name', '이정자', 'age', 89, 'gender', 'female', 'health_note', '요양원 거주')
        )
      ),
      jsonb_build_object('monthly_income', 0, 'financial', 80000000, 'real_estate', 650000000, 'debt', 0, 'existing_sangjo_monthly', 29900, 'insurance_monthly', 180000),
      '남편 치매 초기 진단 · 모친 요양원 · 간병 이슈가 복합적',
      v_now - interval '35 days'),

    (c_park_jh, v_planner, '박정호', '1971-05-09', 'male',
      '010-3456-7003', '경기도 성남시 분당구', '공무원 (국세청)',
      jsonb_build_object(
        'spouse', true, 'children', 2, 'parents_alive', 2,
        'members', jsonb_build_array(
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'spouse', 'name', '최윤희', 'age', 52, 'gender', 'female'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'child', 'name', '박도윤', 'age', 23, 'gender', 'male'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'child', 'name', '박하은', 'age', 19, 'gender', 'female'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'parent', 'name', '박정수', 'age', 82, 'gender', 'male', 'health_note', '당뇨·심장질환'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'parent', 'name', '김영애', 'age', 79, 'gender', 'female')
        )
      ),
      jsonb_build_object('monthly_income', 6500000, 'financial', 220000000, 'real_estate', 950000000, 'debt', 350000000, 'existing_sangjo_monthly', 0, 'insurance_monthly', 420000),
      '정년 7년 남음 · 자녀 2명 교육비 부담 · 아버지 병원비 증가 중',
      v_now - interval '28 days'),

    (c_choi_mk, v_planner, '최미경', '1975-08-30', 'female',
      '010-4567-8004', '서울특별시 마포구 상암동', '초등학교 교사',
      jsonb_build_object('spouse', true, 'children', 1, 'parents_alive', 2),
      jsonb_build_object('monthly_income', 4800000, 'financial', 130000000, 'real_estate', 780000000, 'debt', 220000000, 'existing_sangjo_monthly', 0, 'insurance_monthly', 320000),
      '건강검진 결과 특이사항 없음',
      v_now - interval '22 days'),

    (c_jung_jw, v_planner, '정재욱', '1968-01-12', 'male',
      '010-5678-9005', '부산광역시 해운대구', '회사원 (조선업)',
      jsonb_build_object(
        'spouse', true, 'children', 1, 'parents_alive', 1,
        'members', jsonb_build_array(
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'spouse', 'name', '김은경', 'age', 56, 'gender', 'female'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'child', 'name', '정수민', 'age', 28, 'gender', 'female', 'financial_note', '유학 중'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'parent', 'name', '정대호', 'age', 86, 'gender', 'male', 'health_note', '독거, 간병 필요')
        )
      ),
      jsonb_build_object('monthly_income', 7200000, 'financial', 95000000, 'real_estate', 580000000, 'debt', 180000000, 'existing_sangjo_monthly', 49900, 'insurance_monthly', 380000),
      '명예퇴직 언급 시작 · 유학 중인 딸 송금 부담',
      v_now - interval '18 days'),

    (c_kang_jy, v_planner, '강지연', '1980-09-18', 'female',
      '010-6789-0006', '경기도 수원시 영통구', '간호사',
      jsonb_build_object('spouse', true, 'children', 2, 'parents_alive', 2),
      jsonb_build_object('monthly_income', 5100000, 'financial', 70000000, 'real_estate', 520000000, 'debt', 280000000, 'existing_sangjo_monthly', 0, 'insurance_monthly', 290000),
      '맞벌이 · 교대근무 · 시어머니 치매 걱정',
      v_now - interval '15 days'),

    (c_yoon_ts, v_planner, '윤태식', '1955-12-07', 'male',
      '010-7890-1007', '전라남도 광주광역시 북구', '농업 (은퇴)',
      jsonb_build_object('spouse', true, 'children', 3, 'parents_alive', 0),
      jsonb_build_object('monthly_income', 1200000, 'financial', 45000000, 'real_estate', 380000000, 'debt', 20000000, 'existing_sangjo_monthly', 0, 'insurance_monthly', 90000),
      '국민연금 · 기초연금 생활 · 자녀 3남매 모두 외지 거주',
      v_now - interval '12 days'),

    (c_han_sy, v_planner, '한소영', '1983-04-25', 'female',
      '010-8901-2008', '서울특별시 송파구 잠실동', '변호사 (개인사무소)',
      jsonb_build_object(
        'spouse', true, 'children', 1, 'parents_alive', 2,
        'members', jsonb_build_array(
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'spouse', 'name', '김태현', 'age', 43, 'gender', 'male', 'financial_note', '대기업 임원'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'child', 'name', '김주원', 'age', 9, 'gender', 'male'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'parent', 'name', '한상식', 'age', 71, 'gender', 'male'),
          jsonb_build_object('id', gen_random_uuid(), 'relation', 'parent', 'name', '서명숙', 'age', 68, 'gender', 'female')
        )
      ),
      jsonb_build_object('monthly_income', 14500000, 'financial', 480000000, 'real_estate', 1850000000, 'debt', 600000000, 'existing_sangjo_monthly', 0, 'insurance_monthly', 850000),
      '고소득 · 고자산 · 상속세 설계 관심 높음',
      v_now - interval '9 days'),

    (c_cho_hj, v_planner, '조현준', '1972-07-14', 'male',
      '010-9012-3009', '대전광역시 유성구', '자영업 (음식점)',
      jsonb_build_object('spouse', true, 'children', 2, 'parents_alive', 1),
      jsonb_build_object('monthly_income', 3800000, 'financial', 38000000, 'real_estate', 420000000, 'debt', 380000000, 'existing_sangjo_monthly', 59000, 'insurance_monthly', 120000),
      '코로나 이후 매출 회복 더딤 · 대출 이자 부담',
      v_now - interval '7 days'),

    (c_oh_ms, v_planner, '오민수', '1988-06-11', 'male',
      '010-0123-4010', '서울특별시 강서구 마곡동', 'IT 개발자 (스타트업)',
      jsonb_build_object('spouse', false, 'children', 0, 'parents_alive', 2),
      jsonb_build_object('monthly_income', 6800000, 'financial', 85000000, 'real_estate', 0, 'debt', 45000000, 'existing_sangjo_monthly', 0, 'insurance_monthly', 180000),
      '미혼 · 부모님 대상 상조 검토 중',
      v_now - interval '4 days');

  -- 4. Contracts -------------------------------------------------------------
  insert into public.sangjo_contracts (id, client_id, planner_id, product_name, monthly_payment, total_months, paid_months, contract_date, status, created_at) values
    -- 김영호: 중후반 납입 · 지연 없음
    (k_hong, c_hong, v_planner, '프리미엄 A형 (1인 3일장)', 49900, 120, 78, v_now::date - 2360, 'active', v_now - interval '42 days'),
    -- 이순자: 계약일 오래됐는데 납입이 한참 밀림 → high risk
    (k_lee_sj, c_lee_sj, v_planner, '스탠다드 B형', 29900, 120, 18, v_now::date - 900, 'active', v_now - interval '35 days'),
    -- 박정호: 신규 계약 · 초반 리스크 + 타사 없음
    (k_park_jh, c_park_jh, v_planner, '프리미엄 A형', 59900, 120, 6, v_now::date - 210, 'active', v_now - interval '28 days'),
    -- 최미경: 정상 · 리스크 낮음
    (k_choi_mk, c_choi_mk, v_planner, '스탠다드 B형', 39900, 120, 24, v_now::date - 720, 'active', v_now - interval '22 days'),
    -- 정재욱: 중도 이탈 구간 + 소득 대비 부담 (프리미엄+보험) → critical
    (k_jung_jw, c_jung_jw, v_planner, '프리미엄 플러스 (가족형)', 89900, 120, 36, v_now::date - 1200, 'active', v_now - interval '18 days'),
    -- 강지연: 정상
    (k_kang_jy, c_kang_jy, v_planner, '스탠다드 B형', 39900, 120, 12, v_now::date - 390, 'active', v_now - interval '15 days'),
    -- 윤태식: 연세·소득 대비 부담 · 지연 → high
    (k_yoon_ts, c_yoon_ts, v_planner, '이코노미 C형', 19900, 180, 48, v_now::date - 1560, 'active', v_now - interval '12 days'),
    -- 한소영: 고액 계약 · 정상
    (k_han_sy, c_han_sy, v_planner, '프리미엄 플러스 (가족형)', 99900, 60, 9, v_now::date - 300, 'active', v_now - interval '9 days'),
    -- 조현준: 타사+고부채+중도이탈 → critical
    (k_cho_hj, c_cho_hj, v_planner, '스탠다드 B형', 39900, 120, 42, v_now::date - 1530, 'active', v_now - interval '7 days'),
    -- 오민수: 신규 · medium
    (k_oh_ms, c_oh_ms, v_planner, '프리미엄 A형 (부모동반)', 79900, 120, 2, v_now::date - 70, 'active', v_now - interval '4 days');

  -- 5. Ending scenarios (미리 구운 JSON 2건) ---------------------------------
  insert into public.ending_scenarios (client_id, planner_id, result, model, created_at) values
    (c_hong, v_planner,
     jsonb_build_object(
       'headline', '김영호 고객님(67세)께서는 통계적으로 앞으로 15~22년의 생애 구간이 남아 있으며, 당뇨·척추 이슈가 55~65세 남성의 평균적 의료 동선과 맞닿아 있습니다. 간병·장례·상속 준비를 3~5년 내 단계적으로 설계하는 것이 합리적입니다.',
       'life_expectancy_range', jsonb_build_object('low', 82, 'high', 89, 'source', '통계청 2023 생명표'),
       'timeline', jsonb_build_array(
         jsonb_build_object('age', 70, 'category', 'health', 'title', '당뇨 합병증 모니터링 강화기', 'detail', '동년배 남성 기준 망막·신장 합병증 발병 피크. 연 2회 정밀 검진 권장.', 'estimated_cost_krw', 5000000, 'probability', 0.45, 'source', '국민건강보험공단 2022'),
         jsonb_build_object('age', 74, 'category', 'care', 'title', '경증 간병 시작 평균기', 'detail', '당뇨·심혈관 복합 질환 경우 주 3회 방문돌봄 이용 평균 구간.', 'estimated_cost_krw', 3500000, 'probability', 0.35, 'source', 'OECD 2023 고령간병'),
         jsonb_build_object('age', 78, 'category', 'milestone', 'title', '배우자 단독 케어 구간 진입', 'detail', '부인(현 65세)이 70대 중반에 진입 · 상호 간병 부담 재평가 필요.', 'probability', 0.50),
         jsonb_build_object('age', 83, 'category', 'funeral', 'title', '통계 평균 엔딩 구간', 'detail', '서울 강남 3일장 기준 장례 비용 평균 1,720만원.', 'estimated_cost_krw', 17200000, 'source', '한국소비자원 2023'),
         jsonb_build_object('age', 84, 'category', 'inheritance', 'title', '상속세 설계 권장 시점', 'detail', '자산 13.2억원 · 배우자 공제 후 자녀 상속세 약 2,100만원 예상.', 'estimated_cost_krw', 21000000, 'source', '국세청 2023 상속세 공시')
       ),
       'costs', jsonb_build_object(
         'lifetime_medical_krw', 48000000,
         'care_total_krw', 126000000,
         'care_monthly_krw', 3500000,
         'care_avg_months', 36,
         'funeral_krw', 17200000,
         'inheritance_tax_krw', 21000000,
         'total_need_krw', 212000000
       ),
       'coverage_gap', jsonb_build_object(
         'currently_covered_krw', 5988000,
         'shortfall_krw', 206012000,
         'summary', '현재 상조·보험만으로는 간병·장례·상속 합산 수요의 약 3%만 커버됩니다. 간병 대비 장기요양보험 검토와 상속세 사전 증여가 우선.'
       ),
       'planner_talking_points', jsonb_build_array(
         '"15년 뒤 병원비·간병비 합치면 1억 원이 넘어가는 구간이 통계적으로 나옵니다. 지금 월 수입이 여유 있으실 때 분산해서 준비하는 게 가장 효율적이에요."',
         '"따님 결혼 앞두고 계신데, 지금 상속 설계를 5년 단위로 쪼개두면 증여세 한도를 반복해서 쓸 수 있습니다."',
         '"부인께서도 고혈압 관리 중이시라, 부부 동반 상조로 묶으면 단일 가입보다 유족 부담이 눈에 띄게 줄어듭니다."'
       ),
       'disclaimer', '본 시나리오는 통계 기반 참고 자료이며, 의학·법률·세무 자문은 반드시 해당 전문가를 통해 확인해 주세요.'
     ),
     'anthropic/claude-sonnet-4.5',
     v_now - interval '5 days'),

    (c_park_jh, v_planner,
     jsonb_build_object(
       'headline', '박정호 고객님(54세)께서는 정년 전 7년 · 정년 후 25~30년의 두 구간을 분리해 설계해야 합니다. 부모님 간병과 자녀 교육비가 동시에 겹치는 향후 10년이 재무적으로 가장 촘촘한 구간입니다.',
       'life_expectancy_range', jsonb_build_object('low', 84, 'high', 91, 'source', '통계청 2023 생명표'),
       'timeline', jsonb_build_array(
         jsonb_build_object('age', 58, 'category', 'care', 'title', '아버지(82세) 집중 간병 확률 구간', 'detail', '당뇨·심장질환 동반 남성 80대 평균 간병 전환 시점.', 'estimated_cost_krw', 24000000, 'probability', 0.55),
         jsonb_build_object('age', 62, 'category', 'milestone', 'title', '정년 전환 · 소득 30~50% 하락', 'detail', '공무원 평균 정년퇴직 연령. 연금 수급 전 가교 5년 구간 필요.'),
         jsonb_build_object('age', 65, 'category', 'inheritance', 'title', '부모 상속 평균 발생 구간', 'detail', '부모 자산 약 6억원 기준 상속세 0 (공제 내).'),
         jsonb_build_object('age', 72, 'category', 'health', 'title', '퇴행성 질환 관리 본격화', 'detail', '고혈압·무릎 관절염 등 복합 발병 피크.', 'estimated_cost_krw', 18000000),
         jsonb_build_object('age', 86, 'category', 'funeral', 'title', '통계 평균 엔딩 구간', 'detail', '경기 분당 기준 장례 평균 1,510만원.', 'estimated_cost_krw', 15100000)
       ),
       'costs', jsonb_build_object(
         'lifetime_medical_krw', 62000000,
         'care_total_krw', 84000000,
         'care_monthly_krw', 2800000,
         'care_avg_months', 30,
         'funeral_krw', 15100000,
         'inheritance_tax_krw', 0,
         'total_need_krw', 161100000
       ),
       'coverage_gap', jsonb_build_object(
         'currently_covered_krw', 0,
         'shortfall_krw', 161100000,
         'summary', '상조 미가입 상태 · 보험만으로는 간병 커버 어려움. 지금 시점 월 5만원대 중장기 상조가 가장 가성비 높은 옵션입니다.'
       ),
       'planner_talking_points', jsonb_build_array(
         '"자녀 두 분 대학 학자금이랑 아버지 간병이 5~7년 안에 겹쳐서 옵니다. 지금 월 부담 30~40만원으로 분산해두는 게 10년 뒤 수백만 원 단위 충격을 막습니다."',
         '"정년 7년 남으셨는데, 퇴직 후 상조 신규 가입은 월 납입이 30% 이상 비싸집니다. 재직 중 가입이 가성비 차이가 크죠."',
         '"부모님 상속은 공제 안쪽이지만, 본인 세대는 자산 규모가 다릅니다. 지금부터 15년 단위 증여 전략을 같이 설계해 두시면 좋습니다."'
       ),
       'disclaimer', '본 시나리오는 통계 기반 참고 자료이며, 의학·법률·세무 자문은 반드시 해당 전문가를 통해 확인해 주세요.'
     ),
     'anthropic/claude-sonnet-4.5',
     v_now - interval '2 days');

  -- 6. Retention scores ------------------------------------------------------
  insert into public.retention_scores (contract_id, score, factors, recommended_action, computed_at) values
    -- 김영호: 정상 · low
    (k_hong, 15,
      jsonb_build_object('tier', 'low', 'items', jsonb_build_array(
        jsonb_build_object('key', 'tenure_risk', 'label', '계약 초기', 'points', 0, 'hint', '계약 6년차'),
        jsonb_build_object('key', 'missing_info', 'label', '정보 결손', 'points', 5, 'hint', '재무 세부 항목 미기재')
      )),
      '유지 단계 — 자동 케어로 충분', v_now - interval '6 hours'),

    -- 이순자: 납입 지연 심각 · high
    (k_lee_sj, 68,
      jsonb_build_object('tier', 'high', 'items', jsonb_build_array(
        jsonb_build_object('key', 'overdue', 'label', '납입 지연', 'points', 40, 'hint', '계약일 기준 예상 30개월 대비 18개월 납입 (12개월 지연)'),
        jsonb_build_object('key', 'low_progress', 'label', '중도 이탈 구간', 'points', 15, 'hint', '납입 진도 15% — 해약이 가장 많이 발생하는 구간'),
        jsonb_build_object('key', 'competing_sangjo', 'label', '타사 상조 가입', 'points', 10, 'hint', '타사 월 납입 29,900원 확인'),
        jsonb_build_object('key', 'income_gap', 'label', '소득 대비 납입 부담', 'points', 3, 'hint', '가계소득 0 · 배우자 연금 의존')
      )),
      '이번 주 안에 안부 연락 권장 — 납입 지연 해소 대화 준비',
      v_now - interval '6 hours'),

    -- 박정호: 계약 초기 리스크 · medium
    (k_park_jh, 25,
      jsonb_build_object('tier', 'medium', 'items', jsonb_build_array(
        jsonb_build_object('key', 'tenure_risk', 'label', '계약 초기', 'points', 10, 'hint', '체결 7개월 — 신규 계약은 조기 해약 확률이 상대적으로 높음'),
        jsonb_build_object('key', 'overdue', 'label', '납입 지연', 'points', 10, 'hint', '예상 7개월 대비 6개월 납입 (1개월 지연)'),
        jsonb_build_object('key', 'income_gap', 'label', '소득 대비 납입 부담', 'points', 5, 'hint', '자녀 교육·부모 간병 복합 부담')
      )),
      '이번 달 정기 터치포인트 유지',
      v_now - interval '6 hours'),

    -- 정재욱: 소득 대비 부담 + 중도이탈 + 타사 · critical
    (k_jung_jw, 72,
      jsonb_build_object('tier', 'critical', 'items', jsonb_build_array(
        jsonb_build_object('key', 'income_gap', 'label', '소득 대비 납입 부담', 'points', 12, 'hint', '월 소득의 12.5%를 상조에 납입 — 부담 구간'),
        jsonb_build_object('key', 'low_progress', 'label', '중도 이탈 구간', 'points', 15, 'hint', '납입 진도 30% — 해약이 가장 많이 발생하는 구간'),
        jsonb_build_object('key', 'competing_sangjo', 'label', '타사 상조 가입', 'points', 10, 'hint', '타사 월 납입 49,900원 확인'),
        jsonb_build_object('key', 'overdue', 'label', '납입 지연', 'points', 30, 'hint', '계약일 기준 예상 40개월 대비 36개월 납입 (4개월 지연)'),
        jsonb_build_object('key', 'debt_ratio', 'label', '고부채', 'points', 5, 'hint', '명예퇴직 검토 · 유학비 송금 부담')
      )),
      '즉시 대면·전화 연락 필요 — 주요 요인: 납입 지연',
      v_now - interval '6 hours'),

    -- 강지연: 정상 · low
    (k_kang_jy, 10,
      jsonb_build_object('tier', 'low', 'items', jsonb_build_array(
        jsonb_build_object('key', 'tenure_risk', 'label', '계약 초기', 'points', 10, 'hint', '체결 13개월 · 정상 납입 중')
      )),
      '유지 단계 — 자동 케어로 충분', v_now - interval '6 hours'),

    -- 윤태식: 지연 + 저소득 · high
    (k_yoon_ts, 55,
      jsonb_build_object('tier', 'high', 'items', jsonb_build_array(
        jsonb_build_object('key', 'overdue', 'label', '납입 지연', 'points', 30, 'hint', '예상 52개월 대비 48개월 납입 (4개월 지연)'),
        jsonb_build_object('key', 'income_gap', 'label', '소득 대비 납입 부담', 'points', 15, 'hint', '연금 소득 대비 납입 비율 높음'),
        jsonb_build_object('key', 'missing_info', 'label', '정보 결손', 'points', 5, 'hint', '자녀 가족 구성 미입력'),
        jsonb_build_object('key', 'low_progress', 'label', '중도 이탈 구간', 'points', 5, 'hint', '납입 진도 27%')
      )),
      '이번 주 안에 안부 연락 권장 — 납입 지연 해소 대화 준비',
      v_now - interval '6 hours'),

    -- 한소영: 정상 · low
    (k_han_sy, 8,
      jsonb_build_object('tier', 'low', 'items', jsonb_build_array(
        jsonb_build_object('key', 'tenure_risk', 'label', '계약 초기', 'points', 8, 'hint', '체결 10개월 · 정상')
      )),
      '유지 단계 — 자동 케어로 충분', v_now - interval '6 hours'),

    -- 조현준: 복합 리스크 · critical
    (k_cho_hj, 78,
      jsonb_build_object('tier', 'critical', 'items', jsonb_build_array(
        jsonb_build_object('key', 'overdue', 'label', '납입 지연', 'points', 30, 'hint', '예상 51개월 대비 42개월 납입 (9개월 지연)'),
        jsonb_build_object('key', 'low_progress', 'label', '중도 이탈 구간', 'points', 15, 'hint', '납입 진도 35% — 해약 최다 구간'),
        jsonb_build_object('key', 'competing_sangjo', 'label', '타사 상조 가입', 'points', 10, 'hint', '타사 월 납입 59,000원 확인'),
        jsonb_build_object('key', 'debt_ratio', 'label', '고부채', 'points', 12, 'hint', '연 소득 대비 부채 8.3배'),
        jsonb_build_object('key', 'income_gap', 'label', '소득 대비 납입 부담', 'points', 11, 'hint', '월 소득의 10.5%를 상조에 납입')
      )),
      '즉시 대면·전화 연락 필요 — 주요 요인: 납입 지연',
      v_now - interval '6 hours');

  raise notice '✓ 데모 시드 주입 완료 · 고객 10명 · 계약 10건 · 시나리오 2건 · 해약 스코어 8건';
end $$;
