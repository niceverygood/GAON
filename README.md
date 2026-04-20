# 가온 (Gaon)

한국 상조 플래너를 위한 올인원 엔딩 플래닝 SaaS.

> 전체 프로젝트 스펙·의사결정은 [`CLAUDE.md`](./CLAUDE.md) 참고.

## 핵심 기능

- **엔딩 시나리오** — 고객 엔딩 플래닝을 AI가 통계 기반으로 시각화
- **해약 방지 AI** — 매일 리스크 스코어링, 해약 위험 Top 10 제공
- **장례 실행 AI 매니저** — 3일간 유족·플래너 동행 안내

## 시작하기

```bash
cp .env.example .env.local   # 필수 키 채우기
npm install
npm run dev
```

`http://localhost:3000` 에서 확인.

## DB 마이그레이션

Supabase 프로젝트 생성 후 SQL 에디터에서:

```sql
-- scripts/001_initial_schema.sql 내용 그대로 실행
```

## 스택

Next.js (App Router) · Supabase · Claude Sonnet 4.5 · shadcn/ui · Tailwind v4

## 문서

- [CLAUDE.md](./CLAUDE.md) — Single Source of Truth
- [scripts/](./scripts) — DB 마이그레이션
- [.env.example](./.env.example) — 환경 변수 템플릿
