/**
 * P1 임시 택소노미 소스.
 *
 * ── P2 교체 규약 ──
 * 이 파일의 list* / get* 함수는 전부 async 다(P1 에선 불필요해 보여도 의도적).
 * P2 에서 Content Collections 도입 시 **함수 본문만** getCollection() 으로 교체한다.
 * 반환 타입과 시그니처는 유지 → 페이지의 getStaticPaths 는 수정 불필요.
 * 아래 리터럴 상수(THEORY_CHAPTERS 등)는 P2 에서 통째로 삭제한다.
 */

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

export interface GuideSectionRef {
	slug: string;
	title: string;
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

/**
 * 시드 챕터 13개 — 소분류당 1개.
 * order 는 카테고리 내 1부터의 연번(aptitude 1~5, hacking-defense 1~8).
 * 보안 소분류(web-hacking / reversing / pwnable / crypto)의 제목은 반드시
 * 개념·방어 관점으로 유지한다(핵심 원칙 3).
 * P2 에서 실제 Markdown frontmatter 로 대체된다.
 */
const THEORY_CHAPTERS: readonly TheoryChapterRef[] = [
	// category=aptitude
	{
		id: 'info-basics-01',
		category: 'aptitude',
		subcategory: 'info-basics',
		title: '컴퓨터는 정보를 어떻게 표현할까 — 2진수와 자료의 단위',
		order: 1,
		estMinutes: 15,
	},
	{
		id: 'math-reasoning-01',
		category: 'aptitude',
		subcategory: 'math-reasoning',
		title: '규칙 찾기와 수열 추론',
		order: 2,
		estMinutes: 18,
	},
	{
		id: 'problem-solving-01',
		category: 'aptitude',
		subcategory: 'problem-solving',
		title: '알고리즘이란 무엇인가 — 순서도로 생각 정리하기',
		order: 3,
		estMinutes: 16,
	},
	{
		id: 'creative-math-01',
		category: 'aptitude',
		subcategory: 'creative-math',
		title: '경우의 수와 논리 퍼즐 접근법',
		order: 4,
		estMinutes: 20,
	},
	{
		id: 'it-trend-01',
		category: 'aptitude',
		subcategory: 'it-trend',
		title: 'AI·클라우드·개인정보 — 요즘 IT 뉴스 읽는 법',
		order: 5,
		estMinutes: 14,
	},

	// category=hacking-defense
	{
		id: 'infosec-01',
		category: 'hacking-defense',
		subcategory: 'infosec',
		title: '정보보호의 3요소 — 기밀성·무결성·가용성',
		order: 1,
		estMinutes: 15,
	},
	{
		id: 'network-basics-01',
		category: 'hacking-defense',
		subcategory: 'network',
		title: 'OSI 7계층과 TCP/IP',
		order: 2,
		estMinutes: 20,
	},
	{
		id: 'linux-cli-01',
		category: 'hacking-defense',
		subcategory: 'linux',
		title: '터미널 첫걸음 — 디렉터리 이동과 파일 권한',
		order: 3,
		estMinutes: 18,
	},
	{
		id: 'c-ds-01',
		category: 'hacking-defense',
		subcategory: 'c-ds',
		title: '변수와 메모리 — C언어로 보는 자료의 크기',
		order: 4,
		estMinutes: 20,
	},
	{
		id: 'web-hacking-01',
		category: 'hacking-defense',
		subcategory: 'web-hacking',
		title: '웹 취약점은 왜 생기고 어떻게 막나',
		order: 5,
		estMinutes: 17,
	},
	{
		id: 'reversing-01',
		category: 'hacking-defense',
		subcategory: 'reversing',
		title: '프로그램이 실행되는 과정을 이해하면 보이는 것들',
		order: 6,
		estMinutes: 16,
	},
	{
		id: 'pwnable-01',
		category: 'hacking-defense',
		subcategory: 'pwnable',
		title: '메모리를 지키는 안전한 코딩 습관',
		order: 7,
		estMinutes: 16,
	},
	{
		id: 'crypto-01',
		category: 'hacking-defense',
		subcategory: 'crypto',
		title: '암호는 무엇을 지켜주나 — 대칭키와 공개키',
		order: 8,
		estMinutes: 18,
	},
] as const;

/* ------------------------------------------------------------------ *
 * 모의고사 (UC-03)
 * ------------------------------------------------------------------ */

/** 모의고사 9세트. questionCount / limitMinutes 는 요구사양서 6.3 콘텐츠 목표치 기준. */
const EXAM_SETS: readonly ExamSetRef[] = [
	{
		setId: 'math-reasoning-set1',
		title: '수리추론 1회',
		area: 'math-reasoning',
		areaTitle: '수리추론',
		questionCount: 15,
		limitMinutes: 25,
	},
	{
		setId: 'math-reasoning-set2',
		title: '수리추론 2회',
		area: 'math-reasoning',
		areaTitle: '수리추론',
		questionCount: 15,
		limitMinutes: 25,
	},
	{
		setId: 'problem-solving-set1',
		title: '문제해결·알고리즘 1회',
		area: 'problem-solving',
		areaTitle: '문제해결·알고리즘',
		questionCount: 15,
		limitMinutes: 25,
	},
	{
		setId: 'problem-solving-set2',
		title: '문제해결·알고리즘 2회',
		area: 'problem-solving',
		areaTitle: '문제해결·알고리즘',
		questionCount: 15,
		limitMinutes: 25,
	},
	{
		setId: 'it-trend-set1',
		title: 'IT 상식 1회',
		area: 'it-trend',
		areaTitle: 'IT 상식',
		questionCount: 20,
		limitMinutes: 20,
	},
	{
		setId: 'it-trend-set2',
		title: 'IT 상식 2회',
		area: 'it-trend',
		areaTitle: 'IT 상식',
		questionCount: 20,
		limitMinutes: 20,
	},
	{
		setId: 'hd-concept-set1',
		title: '해킹방어 개념 종합 1회',
		area: 'hd-concept',
		areaTitle: '해킹방어 개념 종합',
		questionCount: 20,
		limitMinutes: 25,
	},
	{
		setId: 'hd-concept-set2',
		title: '해킹방어 개념 종합 2회',
		area: 'hd-concept',
		areaTitle: '해킹방어 개념 종합',
		questionCount: 20,
		limitMinutes: 25,
	},
	{
		setId: 'mock-full-set1',
		title: '종합 모의고사 1회',
		area: 'mock-full',
		areaTitle: '종합 모의고사',
		questionCount: 40,
		limitMinutes: 60,
	},
] as const;

/* ------------------------------------------------------------------ *
 * 면접 (UC-05)
 * ------------------------------------------------------------------ */

/**
 * 면접 카테고리 5개. targetCount 는 요구사양서 6.4 목표 문항 수.
 *
 * ⚠️ `timeattack` 을 이 배열에 절대 넣지 말 것 —
 * `/interview/timeattack` 은 별도 정적 라우트(pages/interview/timeattack.astro)이며,
 * 여기에 들어가면 `[category].astro` 의 getStaticPaths 와 충돌해 빌드 경고가 난다.
 */
const INTERVIEW_CATEGORIES: readonly InterviewCategoryRef[] = [
	{
		slug: 'motivation',
		title: '지원동기·학교 이해',
		description: '왜 디미고 해킹방어과인지를 자기 경험과 연결해 설명하는 연습이에요.',
		targetCount: 8,
	},
	{
		slug: 'portfolio',
		title: '실적물·포트폴리오 설명',
		description: '내가 만들고 참여한 결과물을 처음 듣는 사람에게 쉽게 설명하는 연습이에요.',
		targetCount: 6,
	},
	{
		slug: 'career',
		title: '진로계획·직무이해',
		description: '보안 분야에는 어떤 일이 있고 나는 어디로 가고 싶은지 정리해요.',
		targetCount: 10,
	},
	{
		slug: 'personality',
		title: '인성·태도',
		description: '협업·갈등·실패 경험을 솔직하고 성숙하게 말하는 연습이에요.',
		targetCount: 8,
	},
	{
		slug: 'security-news',
		title: '보안 시사이슈 견해',
		description: '최근 보안 사건을 이해하고 자기 생각을 근거와 함께 말하는 연습이에요.',
		targetCount: 6,
	},
] as const;

/* ------------------------------------------------------------------ *
 * 입시 가이드 (UC-09)
 * ------------------------------------------------------------------ */

/** `디미고_입시_준비_가이드.md` 의 실제 헤딩 9개. slug 는 /guide 내 앵커로 사용. */
export const GUIDE_SECTIONS: readonly GuideSectionRef[] = [
	{ slug: 'school-character', title: '학교 성격' },
	{ slug: 'departments', title: '모집 학과 (4개과)' },
	{ slug: 'admission-types', title: '전형 종류' },
	{ slug: 'evaluation', title: '평가 항목' },
	{ slug: 'aptitude-test', title: '적성검사 — 무엇을 공부해야 하나' },
	{ slug: 'interview', title: '면접 — 무엇을 준비해야 하나' },
	{ slug: 'special-admission', title: '특별전형 준비' },
	{ slug: 'timeline', title: '전반적인 준비 시기와 포인트' },
	{ slug: 'checklist', title: '체크리스트' },
] as const;

/* ------------------------------------------------------------------ *
 * 조회 API — 시그니처 고정. P2 에서 본문만 교체한다.
 * ------------------------------------------------------------------ */

/** 전체 이론 챕터를 order 오름차순으로 반환한다. */
export async function listTheoryChapters(): Promise<TheoryChapterRef[]> {
	// P2: getCollection('theory') 로 교체하고 data.{id,category,subcategory,title,order,estMinutes} 를 매핑한다.
	// P2: 반환 타입(TheoryChapterRef[])과 order 정렬은 그대로 유지할 것.
	return [...THEORY_CHAPTERS].sort((a, b) => a.order - b.order);
}

/** 특정 카테고리·소분류에 속한 이론 챕터를 order 오름차순으로 반환한다. */
export async function listTheoryChaptersBySubcategory(
	category: TheoryCategory,
	subcategory: string,
): Promise<TheoryChapterRef[]> {
	// P2: getCollection('theory', ({ data }) => data.category === category && data.subcategory === subcategory)
	const all = await listTheoryChapters();
	return all.filter((c) => c.category === category && c.subcategory === subcategory);
}

/** 전체 모의고사 세트를 정의 순서대로 반환한다. */
export async function listExamSets(): Promise<ExamSetRef[]> {
	// P2: getCollection('exams') 로 교체. 세트별 JSON 에서 setId/title/area/questionCount/limitMinutes 를 읽는다.
	return [...EXAM_SETS];
}

/** setId 로 모의고사 세트 1개를 찾는다. 없으면 undefined. */
export async function getExamSet(setId: string): Promise<ExamSetRef | undefined> {
	// P2: listExamSets() 결과에서 찾는 방식 그대로 유지 — 컬렉션 교체 시 자동으로 따라온다.
	const all = await listExamSets();
	return all.find((s) => s.setId === setId);
}

/** 면접 카테고리 5개를 정의 순서대로 반환한다(timeattack 미포함). */
export async function listInterviewCategories(): Promise<InterviewCategoryRef[]> {
	// P2: getCollection('interview') 의 카테고리별 JSON 에서 집계한다.
	// P2: 이때도 timeattack 은 카테고리가 아니므로 결과에 포함시키지 말 것.
	return [...INTERVIEW_CATEGORIES];
}

/** slug 로 면접 카테고리 1개를 찾는다. 없으면 undefined. */
export async function getInterviewCategory(slug: string): Promise<InterviewCategoryRef | undefined> {
	// P2: listInterviewCategories() 결과에서 찾는 방식 그대로 유지.
	const all = await listInterviewCategories();
	return all.find((c) => c.slug === slug);
}
