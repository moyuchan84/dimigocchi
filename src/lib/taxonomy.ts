/**
 * 택소노미 — Content Collections 와 UI 사이의 매핑 계층.
 *
 * 페이지(`getStaticPaths` 포함)는 콘텐츠 컬렉션을 직접 부르지 않고 이 파일의
 * list* / get* 함수만 바라본다. 모든 조회 함수가 async 인 이유가 이것이며,
 * 덕분에 각 Phase 에서 리터럴 → 컬렉션 전환을 **함수 본문만 바꿔서** 끝낼 수 있다.
 *
 * ── 현재 이관 상태 (P2 완료) ──
 * - `theory` : ✅ Content Collections 이관 완료. `src/content/theory/{category}/{id}.md`
 *              의 frontmatter 가 유일한 소스다(리터럴 THEORY_CHAPTERS 는 삭제됨).
 * - `guide`  : ✅ 이관 완료. `src/content/guide/{id}.md` → `listGuideSections()`
 *              (하드코딩 상수 GUIDE_SECTIONS 는 삭제됨).
 * - `exams`  : ✅ P3 완료. `src/content/exams/{setId}.json`(세트 1파일)의
 *              setId/title/area/areaTitle/limitMinutes/questions 가 유일한 소스다
 *              (리터럴 EXAM_SETS 는 삭제됨). questionCount 는 questions.length 로 파생한다.
 * - `interview` : ✅ P4 완료. `src/content/interview/{category}.json`(카테고리 1파일)의
 *              category/title/description/questions 가 유일한 소스다(리터럴 INTERVIEW_CATEGORIES 는
 *              삭제됨). targetCount 는 questions.length 로 파생한다.
 *
 * ── THEORY_CATEGORIES 를 상수로 남긴 이유 (삭제 금지) ──
 * 카테고리 2개 / 소분류 13개는 챕터 파일에서 파생되는 데이터가 아니라 **사이트 IA** 다.
 * 1) 소분류 slug 는 `/theory#{slug}` 앵커의 소유자다 — 챕터 파일이 바뀌어도 앵커는 불변이어야 한다.
 * 2) 표시 순서와 카테고리/소분류의 한국어 제목·설명은 콘텐츠가 아니라 내비게이션 문구다.
 * 3) 아직 챕터가 0개인 소분류도 목록에 노출해야 한다(P7 콘텐츠 채우기 전까지의 로드맵 역할).
 *    컬렉션에서 집계하면 빈 소분류가 통째로 사라진다.
 */

import { getCollection } from 'astro:content';

/* ------------------------------------------------------------------ *
 * 타입
 * ------------------------------------------------------------------ */

export type TheoryCategory = 'aptitude' | 'hacking-defense';

export interface TheorySubcategoryRef {
	slug: string;
	title: string;
}

export interface TheoryCategoryRef {
	slug: TheoryCategory;
	title: string;
	description: string;
	subcategories: readonly TheorySubcategoryRef[];
}

export interface TheoryChapterRef {
	id: string;
	category: TheoryCategory;
	subcategory: string;
	title: string;
	order: number;
	/** 검색 키워드(요구사양서 7.1). P6 통합 검색 인덱스에서 사용한다. */
	tags: string[];
	estMinutes: number;
}

export type ExamArea =
	| 'math-reasoning'
	| 'problem-solving'
	| 'it-trend'
	| 'hd-concept'
	| 'mock-full';

export interface ExamSetRef {
	setId: string;
	title: string;
	area: ExamArea;
	areaTitle: string;
	questionCount: number;
	limitMinutes: number;
}

export type ExamQuestionType = 'single-choice' | 'multi-choice' | 'short-answer';
export type ExamDifficulty = 'easy' | 'medium' | 'hard';

interface ExamQuestionBase {
	id: string;
	category: TheoryCategory;
	subcategory: string;
	question: string;
	explanation: string;
	difficulty: ExamDifficulty;
}

export interface SingleChoiceQuestion extends ExamQuestionBase {
	type: 'single-choice';
	choices: string[];
	answer: number;
}

export interface MultiChoiceQuestion extends ExamQuestionBase {
	type: 'multi-choice';
	choices: string[];
	answer: number[];
}

export interface ShortAnswerQuestion extends ExamQuestionBase {
	type: 'short-answer';
	answer: string[];
}

/** 모의고사 문항 판별 유니온. `question.type` 으로 좁혀서 choices/answer 모양을 구분한다. */
export type ExamQuestion = SingleChoiceQuestion | MultiChoiceQuestion | ShortAnswerQuestion;

export type InterviewCategorySlug =
	| 'motivation'
	| 'portfolio'
	| 'career'
	| 'personality'
	| 'security-news';

export interface InterviewCategoryRef {
	slug: InterviewCategorySlug;
	title: string;
	description: string;
	targetCount: number;
}

export interface InterviewQuestionRef {
	id: string;
	category: InterviewCategorySlug;
	question: string;
	intent: string;
	answerGuide: string;
}

export interface GuideSectionRef {
	/** `/guide#{slug}` 앵커. 콘텐츠 파일의 frontmatter `id` 와 같은 값이다. */
	slug: string;
	title: string;
	/** 페이지 내 섹션 순서(1부터). */
	order: number;
	/** 목차 카드에 노출되는 한 줄 요약. */
	summary: string;
}

/* ------------------------------------------------------------------ *
 * 이론 (UC-02)
 * ------------------------------------------------------------------ */

/** 이론 카테고리 2개 / 소분류 13개. 소분류 slug 는 /theory 앵커(#slug)로도 쓰인다. */
export const THEORY_CATEGORIES: readonly TheoryCategoryRef[] = [
	{
		slug: 'aptitude',
		title: '적성검사 공통',
		description: '어느 학과에 지원하든 필요한 수리·논리·정보 기초를 다지는 영역이에요.',
		subcategories: [
			{ slug: 'info-basics', title: '정보교과 기초' },
			{ slug: 'math-reasoning', title: '수리추론' },
			{ slug: 'problem-solving', title: '문제해결·알고리즘 사고' },
			{ slug: 'creative-math', title: '창의사고력 수학' },
			{ slug: 'it-trend', title: 'IT 시사상식' },
		],
	},
	{
		slug: 'hacking-defense',
		title: '해킹방어과 특화 입문',
		description: '해킹방어과에서 배우게 될 내용을 중학생 눈높이에서 미리 맛보는 영역이에요.',
		subcategories: [
			{ slug: 'infosec', title: '정보보호개론' },
			{ slug: 'network', title: '네트워크 기초' },
			{ slug: 'linux', title: '리눅스/CLI 기초' },
			{ slug: 'c-ds', title: 'C언어·자료구조 기초' },
			{ slug: 'web-hacking', title: '웹 해킹 입문' },
			{ slug: 'reversing', title: '리버싱 입문' },
			{ slug: 'pwnable', title: '포너블 입문' },
			{ slug: 'crypto', title: '암호학 기초' },
		],
	},
] as const;

/* ------------------------------------------------------------------ *
 * 모의고사 (UC-03)
 * ------------------------------------------------------------------ */

/**
 * area 표시 순서. 세트 콘텐츠(`src/content/exams/*.json`)에는 순서 필드가 없으므로,
 * `listExamSets()` 가 이 순서 + setId 문자열 비교(set1 < set2)로 정의 순서를 재구성한다.
 */
const AREA_ORDER: readonly ExamArea[] = [
	'math-reasoning',
	'problem-solving',
	'it-trend',
	'hd-concept',
	'mock-full',
];

/* ------------------------------------------------------------------ *
 * 면접 (UC-05)
 * ------------------------------------------------------------------ */

/**
 * 카테고리 표시 순서. 콘텐츠(`src/content/interview/*.json`)에는 순서 필드가 없으므로,
 * `listInterviewCategories()` 가 이 순서로 정의 순서를 재구성한다(AREA_ORDER 와 동일한 이유).
 *
 * ⚠️ `timeattack` 을 이 배열에 절대 넣지 말 것 —
 * `/interview/timeattack` 은 별도 정적 라우트(pages/interview/timeattack.astro)이며,
 * 여기에 들어가면 `[category].astro` 의 getStaticPaths 와 충돌해 빌드 경고가 난다.
 */
const INTERVIEW_CATEGORY_ORDER: readonly InterviewCategorySlug[] = [
	'motivation',
	'portfolio',
	'career',
	'personality',
	'security-news',
];

/* ------------------------------------------------------------------ *
 * 입시 가이드 (UC-09)
 * ------------------------------------------------------------------ */

/*
 * 가이드 섹션 목록은 상수가 아니라 `listGuideSections()` 로 조회한다.
 * 소스는 `src/content/guide/{id}.md` 의 frontmatter(id/title/order/summary).
 */

/* ------------------------------------------------------------------ *
 * 조회 API — 시그니처 고정. 컬렉션 이관 시 본문만 교체한다.
 * ------------------------------------------------------------------ */

/** 전체 이론 챕터를 order 오름차순으로 반환한다. */
export async function listTheoryChapters(): Promise<TheoryChapterRef[]> {
	const entries = await getCollection('theory');
	return entries
		.map((e) => ({
			id: e.data.id,
			category: e.data.category,
			subcategory: e.data.subcategory,
			title: e.data.title,
			order: e.data.order,
			tags: e.data.tags,
			estMinutes: e.data.estMinutes,
		}))
		.sort((a, b) => a.order - b.order);
}

/** 특정 카테고리·소분류에 속한 이론 챕터를 order 오름차순으로 반환한다. */
export async function listTheoryChaptersBySubcategory(
	category: TheoryCategory,
	subcategory: string,
): Promise<TheoryChapterRef[]> {
	const all = await listTheoryChapters();
	return all.filter((c) => c.category === category && c.subcategory === subcategory);
}

/** 입시 가이드 섹션을 order 오름차순으로 반환한다. slug 는 `/guide#{slug}` 앵커. */
export async function listGuideSections(): Promise<GuideSectionRef[]> {
	const entries = await getCollection('guide');
	return entries
		.map((e) => ({
			slug: e.data.id,
			title: e.data.title,
			order: e.data.order,
			summary: e.data.summary,
		}))
		.sort((a, b) => a.order - b.order);
}

/** 전체 모의고사 세트를 정의 순서대로 반환한다. */
export async function listExamSets(): Promise<ExamSetRef[]> {
	const entries = await getCollection('exams');
	return entries
		.map((e) => ({
			setId: e.data.setId,
			title: e.data.title,
			area: e.data.area,
			areaTitle: e.data.areaTitle,
			questionCount: e.data.questions.length,
			limitMinutes: e.data.limitMinutes,
		}))
		.sort((a, b) => {
			const areaDiff = AREA_ORDER.indexOf(a.area) - AREA_ORDER.indexOf(b.area);
			return areaDiff !== 0 ? areaDiff : a.setId.localeCompare(b.setId);
		});
}

/** setId 로 모의고사 세트 1개를 찾는다. 없으면 undefined. */
export async function getExamSet(setId: string): Promise<ExamSetRef | undefined> {
	const all = await listExamSets();
	return all.find((s) => s.setId === setId);
}

/** 세트 1개의 전체 문항(정답/해설 포함)을 반환한다. 응시 화면·채점·결과 화면에서 쓴다. */
export async function getExamQuestions(setId: string): Promise<ExamQuestion[] | undefined> {
	const entries = await getCollection('exams');
	return entries.find((e) => e.data.setId === setId)?.data.questions;
}

/**
 * 전체 세트의 문항을 setId/areaTitle 을 붙여 평탄화한다.
 * 오답노트가 wrong 문항 id → 문항 데이터(질문/해설/영역)를 역참조할 때 쓴다.
 */
export async function listAllExamQuestions(): Promise<
	(ExamQuestion & { setId: string; areaTitle: string })[]
> {
	const entries = await getCollection('exams');
	return entries.flatMap((e) =>
		e.data.questions.map((q) => ({ ...q, setId: e.data.setId, areaTitle: e.data.areaTitle })),
	);
}

/** 면접 카테고리 5개를 정의 순서대로 반환한다(timeattack 미포함). */
export async function listInterviewCategories(): Promise<InterviewCategoryRef[]> {
	const entries = await getCollection('interview');
	return entries
		.map((e) => ({
			slug: e.data.category,
			title: e.data.title,
			description: e.data.description,
			targetCount: e.data.questions.length,
		}))
		.sort(
			(a, b) => INTERVIEW_CATEGORY_ORDER.indexOf(a.slug) - INTERVIEW_CATEGORY_ORDER.indexOf(b.slug),
		);
}

/** slug 로 면접 카테고리 1개를 찾는다. 없으면 undefined. */
export async function getInterviewCategory(slug: string): Promise<InterviewCategoryRef | undefined> {
	const all = await listInterviewCategories();
	return all.find((c) => c.slug === slug);
}

/** 카테고리 1개의 전체 질문을 반환한다. 없으면 undefined. */
export async function getInterviewQuestions(
	categorySlug: string,
): Promise<InterviewQuestionRef[] | undefined> {
	const entries = await getCollection('interview');
	const found = entries.find((e) => e.data.category === categorySlug);
	return found?.data.questions.map((q) => ({ ...q, category: found.data.category }));
}

/**
 * 전체 카테고리의 질문을 categoryTitle 을 붙여 평탄화한다.
 * 타임어택 모드가 카테고리 범위를 넘나드는 무작위 출제 풀로 쓴다.
 */
export async function listAllInterviewQuestions(): Promise<
	(InterviewQuestionRef & { categoryTitle: string })[]
> {
	const entries = await getCollection('interview');
	return entries.flatMap((e) =>
		e.data.questions.map((q) => ({
			...q,
			category: e.data.category,
			categoryTitle: e.data.title,
		})),
	);
}
