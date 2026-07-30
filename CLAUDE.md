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
- **다음 작업: P1 라우팅/레이아웃** — 나머지 Phase(P1~P8)는 아래 "개발 로드맵" 참고
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
| 콘텐츠 관리 | Astro Content Collections (`src/content/config.ts`, zod 스키마) — Markdown(이론) + JSON(문제/면접질문/일정) |
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
├─ content/
│  ├─ config.ts              # zod 스키마 정의 (아래 "콘텐츠 스키마" 참고)
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
│  ├─ storage.ts               # localStorage 유틸
│  └─ grading.ts               # 채점 로직
└─ styles/
```

새 콘텐츠(이론/문제/질문)는 **코드를 건드리지 않고 파일 추가만으로 반영**되어야 한다(FR-10.2). 새 카테고리를 추가할 때만 `config.ts` 스키마 수정이 필요하다.

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

- **이론 챕터**(md frontmatter): `id, category(aptitude|hacking-defense), subcategory, title, order, tags[], estMinutes`
- **문제**(json): `id, setId, category, subcategory, type(single-choice|multi-choice|short-answer), question, choices[], answer, explanation, difficulty`
- **면접 질문**(json): `id, category, question, intent, answerGuide`
- **전형 일정**(json): `year, confirmed(bool), events[{label, date, status}]`
- **localStorage 키**: `dimigo-prep:progress` → `{ theory, checklist, examResults[], wrongNoteReviewed, interviewAnswers }`

콘텐츠 파일을 추가/수정할 때는 반드시 `config.ts`의 zod 스키마를 통과하는지 빌드로 확인할 것.

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
