# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code(및 향후 세션)를 위한 프로젝트 가이드입니다. 코드를 작성하기 전에 이 파일을 먼저 읽고, 필요한 세부사항은 `docs/` 하위의 기획 문서를 참조하세요.

## 프로젝트 개요

- **이름(가칭)**: DIMIGO PREP
- **목적**: 2027학년도 한국디지털미디어고등학교(디미고) **해킹방어과** 진학을 목표로 하는 중3 수험생을 위한, 소질·적성검사 대비 + 해킹방어과 특화 기초 이론 + 면접 준비 + 입시 가이드를 한 곳에서 제공하는 **static 학습 웹사이트**
- **사용자**: 수험생 본인(주 사용자, 모바일도 사용), 학부모(진행상황 확인)
- **배포**: Vercel, GitHub 연동 자동 배포
- **서버/DB 없음**: 모든 학습 데이터(진도, 모의고사 결과, 오답노트, 면접 답변 초안)는 브라우저 `localStorage`에만 저장한다. 절대 외부 서버로 전송하지 않는다.

## 현재 상태

- [x] **P0 저장소/Vercel 연결 — 완료 (2026-07-30)**
  - 배포 URL: **https://dimigocchi.vercel.app** (Vercel 프로젝트 `thegada/dimigocchi`)
  - GitHub `moyuchan84/dimigocchi` 연결됨 → `main` push 시 자동 재배포, PR 시 Preview 배포
  - Astro 7 (static) + React 19 아일랜드 + Tailwind v4 스캐폴딩 완료, 홈은 P1까지 플레이스홀더
- [x] **P1 라우팅/레이아웃 — 완료 (2026-07-30)**
  - 사이트맵 14개 라우트 + 404 전부 구현 → 빌드 산출 HTML **47개**(홈 1, 404 1, guide 2, theory 1 + 챕터 13, exam 1 + 세트 9 + 결과 9, wrongnote 1, interview 1 + 카테고리 5 + timeattack 1, checklist 1, search 1)
  - 공통 레이아웃 완성: `BaseLayout` + sticky `Header`(주 내비 6개, 모바일은 네이티브 `<details>` 드로어) + `Footer`(4그룹 사이트맵) + `Breadcrumb` + skip link(`#main`). 전 페이지 h1 정확히 1개, `aria-current="page"`는 breadcrumb 마지막 항목에만
  - 각 페이지는 빈 껍데기가 아니라 `src/lib/taxonomy.ts` 데이터로 실제 정보 구조(목록/카드)를 렌더하고, 미구현 영역은 `PlaceholderCard`(Phase/UC/FR 표기)로 안내한다. 동작하지 않는 폼/입력/버튼은 노출하지 않음
  - **React 아일랜드 0개 — 페이지가 로드하는 JS 0 bytes**(P3에서 처음 도입됨, 아래 P3 항목 참고). 모바일 내비는 React 대신 네이티브 `<details>` + ESC 닫기용 `is:inline` 스크립트 8줄로 구현
  - 참고: `@astrojs/react` 6.x는 아일랜드가 없어도 `dist/_astro/client.*.js`(약 188KB)를 방출한다. 단 **이를 참조하는 HTML이 0개**라 브라우저가 요청하지 않으므로 초기 로딩·Lighthouse에 영향이 없다. 스택을 임의 변경하지 않기 위해 `integrations: [react()]`는 그대로 유지한다 (상세는 `astro.config.mjs` 주석)
- [x] **P2 콘텐츠 스키마 + 입시 가이드 이식 — 완료 (2026-07-31)**
  - `src/content.config.ts` 신설: `theory`/`guide`/`schedule` 3개 컬렉션, zod 스키마로 형식 강제 (`exams`는 P3, `interview`는 P4에서 등록 예정 — 지금 등록하면 빈 컬렉션 경고가 뜬다)
  - 이론 챕터 13개 md 전량 작성(`aptitude` 5 + `hacking-defense` 8), 입시 가이드 9섹션 + 출처(`sources`) md 총 10개 작성, 전형 일정 `src/content/schedule/2027.json` 1개
  - `src/lib/taxonomy.ts`의 조회 함수 본문을 `getCollection()` 기반으로 교체, **시그니처/반환 타입은 P1과 동일하게 유지** → `src/pages/theory/index.astro`, `theory/[category]/[chapter].astro`, `guide/index.astro`, `guide/schedule.astro`의 `getStaticPaths` 무수정
  - 빌드 47페이지 유지, 경고/에러 0건. FR-10.2(콘텐츠 파일 추가만으로 반영) 회귀 테스트 통과 — 임시 md 1개 추가 시 라우트 47→48, 삭제 시 47 복귀, 코드 수정 0줄
  - 보안 콘텐츠 감사(핵심 원칙 3) 완료: `web-hacking-01`/`reversing-01`/`pwnable-01`/`crypto-01` 등 해킹방어 챕터 전량 검토, 실행 가능한 공격 코드·페이로드 0건 확인. 방어 결론 보강(명령어 삽입 방어 단락 추가 등) 및 사실관계 정정(저작권법 조문 번호, C11 표준 명시 등) 소수 반영
  - 브랜치 `feat/p2-content-pipeline`에서 작업 중 — 아직 `main` 미병합
- [x] **P3 모의고사 엔진 — 완료 (2026-07-31)**
  - `src/content.config.ts`에 `exams` 컬렉션 등록: 세트 1파일(`src/content/exams/{setId}.json`)에 `setId/title/area/areaTitle/limitMinutes/questions[]`. 문항 스키마는 `type`(single-choice/multi-choice/short-answer)에 따라 `choices`/`answer` 모양이 달라지는 `discriminatedUnion` + 인덱스 범위·중복·id접두어 검증용 `superRefine`
  - `src/lib/taxonomy.ts`: 리터럴 `EXAM_SETS` 삭제, `listExamSets`/`getExamSet`을 `getCollection('exams')` 기반으로 교체(시그니처 불변), `getExamQuestions`/`listAllExamQuestions` 신설
  - `src/lib/grading.ts`(신규): `gradeQuestion`/`gradeExam` 순수 함수. 단답형은 trim/공백축약/소문자화 후 비교, 복수선택은 순서무관 완전일치. 소분류(subcategory) 기준으로 세부 정답률 집계
  - `src/lib/storage.ts`(신규, 로드맵 이탈 — 원래 P5 예정이었으나 P3에 조기 생성): `dimigo-prep:progress` 읽기/쓰기 최소 헬퍼(`getExamResults`/`appendExamResult`/`getWrongNoteReviewed`/`setWrongNoteReviewed`). P5는 이 위에 대시보드 집계 함수를 추가하는 것으로 범위가 좁아짐
  - React 아일랜드 5개 최초 도입(`src/components/react/`): `QuestionCard`(문항 렌더+응답 캡처, 정오답 표시는 부모 책임), `ExamRunner`(타이머+자동채점+자동제출), `ExamResult`(재채점 기반 결과·해설), `RecentResults`(FR-3.5 간단 막대 차트), `WrongNoteList`(FR-4.1/4.2 오답노트, 최근순/영역별 토글, 재풀이+복습완료 뱃지 — 목록에서 제거하지 않음)
  - `exam/index.astro`, `exam/[setId]/index.astro`, `exam/[setId]/result.astro`, `wrongnote.astro`의 `PlaceholderCard`/정적 플레이스홀더 전부 제거하고 실제 기능으로 교체
  - 문제은행 9세트 180문항 전량 작성(수리추론 15×2, 문제해결·알고리즘 15×2, IT상식 20×2, 해킹방어개념종합 20×2, 종합모의고사 40×1) — 세트별 유형 배분(단일/복수/단답)까지 목표대로 채움. `math-reasoning-set1`/`hd-concept-set1`은 엔진 검증용으로 직접 작성, 나머지 7세트는 병렬 에이전트로 배치 작성
  - 브라우저에서 타이머 자동제출, 3종 문항 채점(단일/복수/단답), 결과 화면 재채점, 오답노트 누적·재풀이·복습완료 유지를 실제 응시로 end-to-end 검증 완료
  - `npm run build` 47페이지 유지, 경고/에러 0건("빈 컬렉션" 경고 소멸 확인). 문항 180개 구조 검증(id 접두어/중복, 인덱스 범위, 타입별 필드 형태) 스크립트 통과, 해킹방어 카테고리 문항 전량 공격 코드 유출 여부 감사(자동 패턴 스캔 + 수동 재검토) 완료 — 실행 가능한 공격 코드 0건
- [x] **P4 면접 준비 모듈 — 완료 (2026-07-31)**
  - `src/content.config.ts`에 `interview` 컬렉션 등록: 카테고리 1파일(`src/content/interview/{category}.json`)에 `category/title/description/questions[]`. `superRefine`으로 문항 id 접두어(`iv-{category}-`)와 카테고리 내 중복 검증(exams의 `{setId}-` 패턴과 동일)
  - `src/lib/taxonomy.ts`: 리터럴 `INTERVIEW_CATEGORIES` 삭제, `listInterviewCategories`/`getInterviewCategory`를 `getCollection('interview')` 기반으로 교체(시그니처 불변, targetCount는 questions.length로 파생), `getInterviewQuestions`/`listAllInterviewQuestions` 신설
  - `src/lib/storage.ts`: `getInterviewAnswers`/`setInterviewAnswer` 추가(기존 `wrongNoteReviewed` 헬퍼와 동일한 read-modify-write 패턴). `ProgressData.interviewAnswers` 필드는 P3에서 이미 스캐폴딩돼 있어 스키마 변경 없음
  - React 아일랜드 2개 신규 도입: `InterviewAnswerEditor`(카테고리별 질문 목록 + 답변 초안 작성, 매 keystroke마다 즉시 저장 — 디바운스 없음), `TimeAttack`(setup/running/ended 상태머신, `ExamRunner`와 동일한 `Date.now()` 기반 카운트다운, 시간 종료 시 자동으로 다음 질문). `InterviewQuestionCard`는 `QuestionCard`와 같은 역할의 순수 표시 컴포넌트(글자수 카운터 포함, FR-5.5)
  - `interview/index.astro`, `[category].astro`, `timeattack.astro`의 `PlaceholderCard`/스켈레톤 전부 제거하고 실제 기능으로 교체
  - 면접 질문 5카테고리 38문항 전량 자체 작성(지원동기 8·포트폴리오 6·진로계획 10·인성 8·보안시사 6 — 요구사양서 6.4 목표치와 정확히 일치). `security-news` 카테고리는 사건의 원인/피해/대응에 대한 견해를 묻는 질문만 작성(공격 기법 설명 요구 없음, 핵심 원칙 3 준수)
  - 브라우저에서 답변 작성 후 새로고침 시 유지, 타임어택 카운트다운 자동/수동 진행(다음 질문·종료) 실제 조작으로 end-to-end 검증 완료. Network 탭에서 답변 텍스트를 포함한 요청 없음(서버 미전송) 확인
  - `npm run build` 47페이지 유지, 경고/에러 0건. 카테고리별 문항 수 8/6/10/8/6=38 확인
- [x] **P5 대시보드/D-day/체크리스트 — 완료 (2026-07-31)**
  - `src/lib/storage.ts`: `getTheoryProgress`/`setTheoryComplete`, `getChecklist`/`setChecklistItem` 추가(기존 read-modify-write 패턴과 동일)
  - `src/lib/checklist.ts`(신규): 체크리스트 4단계·18항목 데이터를 `checklist.astro`(P1)에서 이관. 항목마다 안정적인 `id`(`${stageId}-${n}`)를 부여해 `dimigo-prep:progress.checklist` 키로 쓴다 — 홈 대시보드도 같은 id 목록을 진행률 분모로 재사용하므로 두 화면이 항목 수·id 로 어긋나지 않는다
  - `src/lib/dday.ts`(신규): `computeNearestEvent` 순수 함수(FR-6.3, 오늘 이후 날짜 중 가장 가까운 이벤트). `date` 가 `YYYY-MM-DD` 형식일 때만 계산 대상 — 지금은 전 이벤트가 "미정"이라 계산 결과가 항상 없음(null)이며, 확정 날짜가 JSON에 반영되면 코드 변경 없이 D-day가 뜬다
  - **로드맵 이탈**: FR-2.3(이론 챕터 "학습 완료" 버튼)은 원래 P2/UC-02 범위였지만 이 값을 쓰는 화면이 없어 P2에서 만들지 않았다. 대시보드 이론 진행률의 유일한 데이터 소스가 이 버튼이라 P5에서 함께 추가했다(`ChapterCompleteToggle`, `theory/[category]/[chapter].astro` 하단)
  - React 아일랜드 4개 신규 도입: `Dashboard`(홈 진행률 5종·온보딩·추천 학습·최근 오답 요약을 한 아일랜드가 소유 — WrongNoteList와 같은 이유로 스냅샷 분리 안 함), `DdayWidget`(홈+`/guide/schedule` 공유), `ChecklistBoard`(체크리스트 전체를 소유, `/checklist`), `ChapterCompleteToggle`(이론 챕터 하단)
  - **헤더 D-day 칩은 React 를 쓰지 않는다**: `Header.astro`는 설계상 React 아일랜드가 없어(P1 설계 메모) 모든 페이지에 노출되는 D-day 칩은 `is:inline` 순수 JS로 구현했다 — `computeNearestEvent`와 동일한 로직을 번들러 없이 손으로 다시 적은 것(의도적 중복, 주석에 명시). 이 칩이 모든 페이지에 렌더되므로 P1의 "0 JS" 서술은 이제 홈/체크리스트/이론 챕터/전형일정 외의 순수 정적 페이지(guide, guide 섹션, 404 등)에만 해당한다
  - 대시보드 진행률은 FR-1.1의 4영역(적성검사 이론/해킹방어 이론/모의고사/면접)에 **체크리스트**를 5번째 카드로 추가(FR-7.2가 명시적으로 요구). 모의고사 진행률은 "응시한 세트 수/전체 9세트", 면접은 "작성한 문항 수(공백 아님)/전체 38문항"으로 정의
  - `index.astro`/`checklist.astro`/`guide/schedule.astro`/`theory/[category]/[chapter].astro`의 `PlaceholderCard` 전부 제거하고 실제 기능으로 교체
  - 브라우저에서 체크리스트 체크·이론 학습완료 토글이 새로고침 후에도 유지되고 홈 대시보드 진행률·추천 학습(완료 챕터 자동 제외)에 즉시 반영됨을 실제 조작으로 end-to-end 검증. D-day 계산은 가짜 미래 날짜를 주입해 "D-N" 표시와 확정/예정 배지 전환을 검증(실제 콘텐츠는 여전히 전부 "미정" — 핵심 원칙 4 유지, 날짜를 추측해 넣지 않음)
  - `npm run build` 47페이지 유지, 경고/에러 0건
- [x] **P6 검색/UI 폴리싱 — 완료 (2026-07-31)**
  - `src/pages/search-index.json.ts`(신규 엔드포인트): 빌드 시 이론 13/문항 180/면접질문 38 = 총 231개 문서를 `{type, id, title, meta, href, keywords}`로 평탄화해 정적 JSON으로 출력. FR-8.1이 "제목·태그"만 검색 대상으로 규정하지만 문항 콘텐츠엔 title/tags가 없어, `question` 텍스트를 title로, 카테고리/소분류/tags를 keywords로 매핑(본문·해설은 인덱싱하지 않음 — 인덱스 크기와 FR-8.1 범위를 넘지 않기 위해)
  - `src/components/react/SiteSearch.tsx`(신규): `/search`의 유일한 아일랜드. 인덱스를 fetch해 전량 메모리에 올리고 모든 매칭을 브라우저 안에서만 수행(검색어 서버 미전송). 토큰화 AND 매칭 + title 가중치(×3) > keywords(×1) 스코어링, 결과는 FR-8.2대로 이론/문항/면접 3그룹으로 묶어 표시. Fuse.js 등 외부 라이브러리 없이 자체 구현 — 문서 231개 규모에서 한글 fuzzy 매칭 라이브러리보다 단순 부분문자열 매칭이 더 예측 가능하다고 판단. `history.replaceState`로 `?q=`를 URL에 반영해 북마크/공유 가능
  - `Header.astro`: xl(1280px) 이상에서 실제 입력 가능한 `<form action="/search" method="get">` 검색창 추가(제출 시 `/search?q=...`로 이동 → SiteSearch가 그 쿼리로 즉시 검색). xl 미만은 공간 부족으로 기존 아이콘 링크 유지 — D-day 칩과 같은 "두 벌 렌더, 하나는 CSS로 숨김" 패턴(NavLinks desktop/mobile과 동일 이유)
  - **UI 폴리싱**: 별도 Explore 에이전트로 반응형/접근성/일관성/데드코드 감사를 병렬 실행해 확인된 실제 버그만 수정 — (1) `WrongNoteList`/`TimeAttack`의 터치 타깃이 28~32px로 모바일 44px 권장치 미달이던 것을 `py-2` 이상으로 확대, (2) `CardLink`가 `badge` 텍스트를 항상 `Badge variant="neutral"`로 하드코딩해 `guide/index.astro`의 "예정(가안)" 배지가 회색으로 렌더되던 핵심 원칙 4 위반을 `badgeVariant` prop 추가로 수정, (3) 사이트 전역 h2 섹션 제목이 `font-semibold`(다수)와 `font-bold tracking-tight`(소수, P1~P3 페이지 잔존)로 갈라져 있던 것을 `font-semibold`로 통일, (4) `WrongNoteList`의 오답 재풀이 카드가 항상 "Q1"로 표시되던 버그를 세트 내 실제 순번을 계산하도록 수정, (5) `ExamResult`의 로딩 문구를 다른 아일랜드와 같은 casual체로 통일
  - **데드코드 제거**: 어떤 페이지에서도 더 이상 import되지 않던 `PlaceholderCard.astro`(P2~P5를 거치며 실기능으로 전부 교체됨)와, 그것 전용이던 `Badge`의 `phase` variant를 삭제. 관련 잔존 주석(global.css, 404.astro)도 함께 정리
  - `npm run build` 47페이지 유지(json 엔드포인트는 페이지 카운트에 안 잡힘), 경고/에러 0건. 브라우저에서 영문(XSS)·한글(리눅스/지원동기) 검색, 헤더 검색창→결과 페이지 이동, 오답노트 터치 타깃/Q번호 수정, guide 배지 색상을 실제 조작으로 end-to-end 검증
  - 다크모드는 요구사양서에 "선택" 항목으로 남아 있어 이번 Phase에서는 구현하지 않음(범위 밖으로 명시적 보류)
  - **후속 고도화 (2026-07-31, P6 완료 이후)**: FR-8.1 범위를 "제목·태그"에서 "제목·태그+본문 일부"로 확장하고 FR-8.3(퍼지/하이라이트)·FR-8.4(단축키)를 신설. `TheoryChapterRef`에 `body`(원본 마크다운) 필드 추가, `search-index.json.ts`가 이론 본문(코드펜스 제거 후)/문항 해설/면접 답변가이드를 `SearchDoc.body`로 인덱싱. `SiteSearch.tsx`는 title 정확일치(3점) > keywords·body 정확일치(1점) > title 단어 퍼지일치(2점) > keywords 단어 퍼지일치(1점) 순으로 토큰별 채점하는 자체 레벤슈타인 매칭으로 개편(body는 퍼지 후보에서 제외 — 성능/정확도 트레이드오프), 결과 제목에 `<mark>` 하이라이트, title/keywords에 없이 body에서만 걸린 토큰은 주변 스니펫을 하이라이트와 함께 노출. `Header.astro`에 `/`·Ctrl/Cmd+K 검색 단축키 `is:inline` 스크립트 추가(기존 드로어 ESC/D-day 칩 스크립트와 나란히). 코드펜스(리버싱 헥스 덤프, 웹해킹 비유적 "공격 문자열" 등)는 검색 인덱스 생성 단계에서 통째로 제거해 문맥 없는 스니펫 노출을 방지(핵심 원칙 3 관련)
- **다음 작업: P7 콘텐츠 채우기** — 나머지 Phase(P7~P8)는 아래 "개발 로드맵" 참고
- 작업을 시작하거나 재개할 때는 이 섹션의 체크박스 상태를 확인하고, Phase를 완료하면 이 파일의 체크박스도 함께 갱신할 것

## 참고 문서 (반드시 확인)

| 문서 | 용도 |
|---|---|
| `docs/01_유즈케이스명세서.md` | 액터, 10개 유즈케이스(UC-01~UC-10), 흐름, 우선순위 |
| `docs/02_요구사양서.md` | 기능/비기능 요구사항(FR/NFR), 사이트맵, 콘텐츠 상세 목차, **데이터 모델(7장) — 콘텐츠 스키마 작업 시 필수 참고** |
| `docs/03_개발계획서.md` | 기술스택 근거, 폴더 구조, Phase별 일정, Vercel 배포 절차, QA 체크리스트 |
| `디미고_입시_준비_가이드.md` (저장소 루트) | 디미고 전형 구조 조사 결과(전형 종류/평가항목/적성검사/면접) — `/guide` 페이지 콘텐츠 원본 |

기능을 구현하기 전에 관련 UC/FR 번호를 확인하고 구현할 것 (예: 모의고사 기능 작업 시 `02_요구사양서.md`의 FR-3 전체를 먼저 읽기).

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | **Astro 7** — static output(기본값이므로 `astro.config.mjs`에 `output`을 명시하지 않는다). **Vercel 어댑터는 사용하지 않는다**: 순수 static 사이트에는 불필요하며 Vercel이 Astro를 자동 감지해 zero-config로 배포한다. Web Analytics / Image Optimization이 필요해지면 그때 `astro add vercel` |
| 인터랙티브 컴포넌트 | React 19, Astro Islands (`client:load`) — 모의고사 엔진, 타이머, 대시보드 위젯 등 상태가 필요한 부분에만 사용. 그 외는 순수 Astro 컴포넌트로 |
| 스타일 | **Tailwind CSS v4** (`@tailwindcss/vite` 플러그인). `@astrojs/tailwind`는 Tailwind 3 레거시 호환용이므로 사용하지 않는다. 전역 스타일은 `src/styles/global.css`이며 **자동 import되지 않으므로** 레이아웃에서 직접 `import '../styles/global.css'` 할 것 (현재 `src/layouts/BaseLayout.astro`가 담당) |
| 콘텐츠 관리 | Astro Content Collections (**`src/content.config.ts`** — Astro 7 기준 위치, zod 스키마) — Markdown(이론) + JSON(문제/면접질문/일정). P2에서 도입 |
| 로컬 저장 | 커스텀 훅 `useLocalStorage` (직접 구현, 외부 상태관리 라이브러리 불필요) |
| 검색 | 클라이언트 사이드 인덱스 (Pagefind 또는 Fuse.js + 자체 JSON 인덱스) |
| 배포 | Vercel (GitHub push 시 자동 배포) |

> Next.js static export로 전환 가능성을 열어두기 위해, 콘텐츠(Markdown/JSON) 스키마는 프레임워크에 종속되지 않게 설계한다. 프레임워크 자체를 바꾸는 결정은 반드시 먼저 논의 후 진행할 것 — 임의로 스택을 변경하지 말 것.

## 개발 환경 주의사항 (Windows)

- **`node`/`npm`/`git`/`vercel`이 PowerShell PATH에 없다. 모든 명령은 Bash(Git Bash) 툴로 실행할 것.**
- Bash에서 `npm`/`npx`가 내부적으로 `cmd.exe`를 spawn하는데 PATH에 없어 실패한다(`spawn cmd.exe ENOENT`). 명령 앞에 `export PATH="$PATH:/c/Windows/System32";`를 붙일 것. `astro add`, 의존성 설치가 여기에 해당한다.
- `vercel` CLI는 Bash PATH에도 없다 → `"$APPDATA/npm/vercel.cmd"`로 호출. URL 인자를 넘길 때는 Git Bash의 경로 변환을 막기 위해 `MSYS_NO_PATHCONV=1`을 앞에 붙인다.

## P0 셋업 (완료 — 기록용)

```bash
# create-astro는 비어있지 않은 디렉터리를 거부한다(--force 없음, --yes는 랜덤 하위 디렉터리에 스캐폴딩해버림).
# .git/docs/.gitignore는 safelist이므로, 루트의 .md 파일만 docs/로 잠시 옮긴 뒤 실행했다.
npm create astro@latest . -- --template minimal --install --no-git --no-ai --skip-houston
npm install
npx astro add react tailwind --yes

vercel link --yes                 # Astro 자동 감지 + GitHub 저장소 자동 연결
vercel git connect <repo-url> --yes   # 멱등 — 연결 성공 여부 재확인용
vercel --prod                     # 최초 배포 시딩
```

- `.gitignore`에 `.vercel`, `.env*` 포함 필수 (`.vercel/project.json`에 orgId/projectId가 들어 있음)
- 이후에는 `main`에 push하면 Vercel이 자동 재배포한다 — 배포용으로 `vercel --prod`를 다시 실행할 필요 없음

## 폴더 구조 컨벤션

```
src/
├─ content.config.ts          # ⚠️ Astro 7 기준 위치는 src/ 바로 아래(src/content/config.ts 는 deprecated 경고). P2에서 여기에 zod 스키마 작성
├─ content/
│  ├─ theory/aptitude/        # 적성검사 공통 이론 (md)
│  ├─ theory/hacking-defense/ # 해킹방어과 특화 이론 (md)
│  ├─ exams/                  # 문제은행 (json, 세트별)
│  ├─ interview/              # 면접 질문 (json, 카테고리별)
│  ├─ guide/                  # 입시 가이드 (md)
│  └─ schedule/                # 전형 일정 (json)
├─ layouts/
├─ components/
│  ├─ react/                  # 상태가 필요한 인터랙티브 컴포넌트
│  └─ astro/                  # 정적 UI 컴포넌트
├─ pages/                      # 아래 "사이트맵" 그대로 라우팅
├─ lib/
│  ├─ navigation.ts            # 내비/브레드크럼 정의, Crumb 타입 (P1)
│  ├─ taxonomy.ts              # 이론/모의고사/면접/가이드 택소노미 조회 API (아래 "콘텐츠 스키마" 참고)
│  ├─ storage.ts               # localStorage 유틸 — ⚠️ 원래 P5 산출물로 계획했으나 모의고사 결과 저장이
│  │                           #   당장 필요해 P3에서 조기 생성했다(`dimigo-prep:progress` 읽기/쓰기 최소 헬퍼).
│  │                           #   P5는 이 위에 대시보드 집계용 함수를 추가하는 것으로 범위가 좁아졌다.
│  └─ grading.ts               # 채점 로직 (P3에서 생성)
└─ styles/
```

새 콘텐츠(이론/문제/질문)는 **코드를 건드리지 않고 파일 추가만으로 반영**되어야 한다(FR-10.2). 새 카테고리를 추가할 때만 `content.config.ts` 스키마 수정이 필요하다.

### 경로 별칭 (P1에서 `tsconfig.json`에 추가 — 새 파일은 상대경로 대신 반드시 별칭 사용)

| 별칭 | 실제 경로 |
|---|---|
| `@/*` | `./src/*` |
| `@layouts/*` | `./src/layouts/*` |
| `@components/*` | `./src/components/*` |
| `@lib/*` | `./src/lib/*` |

예: `import BaseLayout from '@layouts/BaseLayout.astro';`, `import { listExamSets } from '@lib/taxonomy';`

## 사이트맵 (요구사양서 5장 요약)

```
/                        홈(대시보드, UC-01)
/guide, /guide/schedule  입시 가이드, 전형 일정/D-day (UC-09, UC-06)
/theory, /theory/[category]/[chapter]   이론 학습 (UC-02)
/exam, /exam/[setId], /exam/[setId]/result   모의고사 (UC-03)
/wrongnote                오답노트 (UC-04)
/interview, /interview/[category], /interview/timeattack   면접 준비 (UC-05)
/checklist                준비 체크리스트 (UC-07)
/search                   통합 검색 (UC-08)
```

## 콘텐츠 스키마 (요약 — 전체 예시는 `02_요구사양서.md` 7장)

> ⚠️ **P2 진입 시 정정 필요**: Astro 7의 콘텐츠 설정 파일 경로는 **`src/content.config.ts`** 다. 기존 문서·예제에 흔히 보이는 `src/content/config.ts`는 deprecated 경고를 낸다. P2에서 스키마 파일을 만들 때는 `src/content.config.ts`로 만들고, 위 폴더 구조 표기와 아래 문장들의 파일명도 함께 정정할 것.

- **이론 챕터**(md frontmatter): `id, category(aptitude|hacking-defense), subcategory, title, order, tags[], estMinutes`
- **모의고사 세트**(json, 1파일 = 1세트, `src/content/exams/{setId}.json`): `setId, title, area, areaTitle, limitMinutes, questions[]`. `questions[]`의 각 원소가 문항 하나: `id({setId}-q01 형식), category, subcategory, type(single-choice|multi-choice|short-answer), question, explanation, difficulty` 공통 + 타입별로 `choices`/`answer` 모양이 다르다 — single-choice는 `choices[]` + `answer`(0-based 인덱스 number), multi-choice는 `choices[]` + `answer`(인덱스 number[]), short-answer는 `choices` 없이 `answer`(허용 답안 string[])
- **면접 질문**(json): `id, category, question, intent, answerGuide`
- **전형 일정**(json): `year, confirmed(bool), events[{label, date, status}]`
- **localStorage 키**: `dimigo-prep:progress` → `{ theory, checklist, examResults[], wrongNoteReviewed, interviewAnswers }`

콘텐츠 파일을 추가/수정할 때는 반드시 `content.config.ts`의 zod 스키마를 통과하는지 빌드로 확인할 것.

### `src/lib/taxonomy.ts` — 조회 API

모든 페이지(`getStaticPaths` 포함)는 `@lib/taxonomy`의 조회 함수만 바라본다. 조회 함수는 전부 `async`로 선언돼 있어, 리터럴 → Content Collections 전환을 **본문만 바꿔서** 끝낼 수 있다. `theory`/`guide`/`exams`/`interview`는 이미 전환 완료(P2, P3, P4). 리터럴 상수 `EXAM_SETS`(P3)/`INTERVIEW_CATEGORIES`(P4)는 삭제됨(세트/카테고리의 title/area 등은 이제 각 `src/content/{exams,interview}/*.json` 파일이 유일한 소스). `THEORY_CATEGORIES`와 `GUIDE_SECTIONS`는 카테고리/앵커 정의이므로 유지.

확정 슬러그(라우트에 그대로 노출되므로 콘텐츠 파일을 만들 때 반드시 일치시킬 것):

- **이론 카테고리 2 / 소분류 13** (소분류 slug는 `/theory#{slug}` 앵커로도 쓰인다). 괄호 안은 시드 챕터 id = `/theory/{category}/{id}` 라우트
  - `aptitude` 적성검사 공통: `info-basics`(info-basics-01) · `math-reasoning`(math-reasoning-01) · `problem-solving`(problem-solving-01) · `creative-math`(creative-math-01) · `it-trend`(it-trend-01)
  - `hacking-defense` 해킹방어과 특화 입문: `infosec`(infosec-01) · `network`(**network-basics-01**) · `linux`(**linux-cli-01**) · `c-ds`(c-ds-01) · `web-hacking`(web-hacking-01) · `reversing`(reversing-01) · `pwnable`(pwnable-01) · `crypto`(crypto-01)
  - ※ `network` / `linux`는 소분류 slug와 챕터 id의 접두어가 다르다(network-basics-, linux-cli-)
- **모의고사 세트 9** — `src/content/exams/{setId}.json` 1파일 = 1세트. 새 세트를 추가할 때 아래 메타데이터를 그대로 참고할 것(문항수는 `questions[]`의 실제 길이로 파생되므로 파일에 저장하지 않는다):
  - `math-reasoning-set1`, `math-reasoning-set2` — 수리추론 1·2회, area `math-reasoning`, 15문항 25분
  - `problem-solving-set1`, `problem-solving-set2` — 문제해결·알고리즘 1·2회, area `problem-solving`, 15문항 25분
  - `it-trend-set1`, `it-trend-set2` — IT 상식 1·2회, area `it-trend`, 20문항 20분
  - `hd-concept-set1`, `hd-concept-set2` — 해킹방어 개념 종합 1·2회, area `hd-concept`, 20문항 25분
  - `mock-full-set1` — 종합 모의고사 1회, area `mock-full`, 40문항 60분
- **면접 카테고리 5** (`/interview/{slug}`): `motivation` 지원동기·학교 이해(8) · `portfolio` 실적물·포트폴리오 설명(6) · `career` 진로계획·직무이해(10) · `personality` 인성·태도(8) · `security-news` 보안 시사이슈 견해(6)
  - ⚠️ `timeattack`은 **카테고리가 아니다**. `/interview/timeattack`은 별도 정적 라우트이므로 `src/content/interview/`에 `timeattack.json` 같은 파일을 만들지 말 것 — `[category].astro`의 `getStaticPaths`와 충돌한다.
- **입시 가이드 9섹션** (`/guide` 내 앵커, `디미고_입시_준비_가이드.md`의 실제 헤딩): `school-character`, `departments`, `admission-types`, `evaluation`, `aptitude-test`, `interview`, `special-admission`, `timeline`, `checklist`

## 핵심 원칙 (반드시 지킬 것 — 위반 시 콘텐츠/코드 재작업)

1. **서버 없음**: 로그인, 서버 API, DB, 외부로의 사용자 데이터 전송을 추가하지 않는다. 모든 개인 학습 데이터는 `localStorage`에만.
2. **저작권**: 디미고 실제 기출문제, 대회(전국 중학생 IT 올림피아드 등)의 원문 기출문제를 그대로 게재하지 않는다. 문제은행은 **자체 제작한 예상문제**만 사용하고, 참고 대회/자료는 링크로만 안내한다.
3. **보안 콘텐츠는 개념·방어적 관점 중심**: 웹 해킹/리버싱/포너블 이론은 "무엇인지, 왜 위험한지, 어떻게 방어하는지"를 설명하는 개념 중심으로 작성한다. 실행 가능한 공격 코드(익스플로잇 스크립트 등)를 작성하거나 문제로 출제하지 않는다. 대상은 중학생임을 항상 염두에 둘 것.
4. **미확정 정보 표시**: 2027학년도 전형 요강은 조사 시점 기준 미확정(예정안)이다. 일정/배점 관련 콘텐츠에는 반드시 "예정(가안)" 배지와 확인 시점을 표기한다.
5. **콘텐츠와 코드 분리**: 새 문제/이론/질문을 추가하는 작업은 코드 수정이 아니라 `src/content/` 내 파일 추가로 처리한다.

## 개발 로드맵 (Phase, 상세는 `03_개발계획서.md` 4장)

P0 저장소/Vercel 연결 → P1 라우팅/레이아웃 → P2 콘텐츠 스키마+가이드 이식 → P3 모의고사 엔진 → P4 면접 모듈 → P5 대시보드/D-day/체크리스트 → P6 검색/UI 폴리싱 → P7 콘텐츠 채우기(지속) → P8 최종 QA/배포

각 Phase 종료 시: `03_개발계획서.md` 7장 QA 체크리스트와 대조하고, 이 파일의 "현재 상태" 체크박스를 갱신한다.

## 콘텐츠 목표치 (요구사양서 6.3~6.4, MVP 기준)

- 문제은행: 수리추론 15문항×2세트, 문제해결·알고리즘 15문항×2세트, IT상식 20문항×2세트, 해킹방어 개념종합 20문항×2세트, 종합 모의고사 40문항×1세트
- 면접 질문: 지원동기 8, 실적물설명 6, 진로계획 10, 인성·태도 8, 보안시사 6

## 명령어

```bash
npm run dev       # 로컬 개발 서버
npm run build     # 프로덕션 빌드 (콘텐츠 스키마 검증 포함)
npm run preview   # 빌드 결과 로컬 미리보기
```

## 작업 시 체크리스트 (매 기능 구현 전)

- [ ] 관련 UC(01)와 FR(02) 번호를 확인했는가
- [ ] 콘텐츠 변경이라면 코드가 아닌 `src/content/` 파일 추가/수정으로 처리했는가
- [ ] 개인 데이터를 서버로 보내는 코드를 추가하지 않았는가
- [ ] 보안 관련 콘텐츠라면 개념/방어적 관점을 유지했는가
- [ ] 실제 기출문제 원문을 복제하지 않았는가
