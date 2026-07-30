/**
 * Content Collections 스키마 정의 (요구사양서 7장 / FR-10.2).
 *
 * Astro 7 의 정식 경로는 `src/content.config.ts` 다.
 * (`src/content/config.ts` 는 deprecated 경로라 빌드마다 경고가 뜬다.)
 *
 * 목적: 새 이론/문제/질문을 **코드 수정 없이 파일 추가만으로** 반영하되,
 * zod 스키마로 빌드 타임에 형식을 강제해 잘못된 콘텐츠가 배포되지 않게 한다.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 이론 챕터 (UC-02 / FR-2). 파일 경로: `src/content/theory/{category}/{id}.md`
 *
 * ⚠️ generateId 를 반드시 지정해야 한다.
 * 이론 md 파일은 `aptitude/`, `hacking-defense/` 같은 카테고리 하위 디렉터리에 들어간다.
 * glob 로더의 기본 generateId 는 base 기준 **경로 slug** 를 id 로 쓰므로,
 * 그대로 두면 id 가 `aptitude/info-basics-01` 이 되어
 * `/theory/[category]/[chapter]` 라우트에서 category 가 이중으로 들어간
 * `/theory/aptitude/aptitude/info-basics-01` 같은 깨진 URL 이 만들어진다.
 * frontmatter 의 `id` 를 그대로 쓰게 해서 URL 을 파일 위치와 분리한다.
 */
const theory = defineCollection({
	loader: glob({
		pattern: '**/*.md',
		base: './src/content/theory',
		generateId: ({ data }) => String(data.id),
	}),
	schema: z.object({
		/** URL 세그먼트로 쓰이는 챕터 식별자. `src/lib/taxonomy.ts` 시드와 일치해야 한다. */
		id: z.string(),
		/** 대분류 — 라우트의 첫 세그먼트(`/theory/{category}/...`)이자 파일이 놓인 디렉터리명. */
		category: z.enum(['aptitude', 'hacking-defense']),
		/** 중분류 — `/theory` 허브에서 챕터를 묶는 단위. */
		subcategory: z.string(),
		title: z.string(),
		/** 같은 category 안에서의 표시 순서(1부터). */
		order: z.number().int().positive(),
		tags: z.array(z.string()).default([]),
		/** 예상 학습 시간(분). 목록/헤더에 "약 N분" 으로 표시한다. */
		estMinutes: z.number().int().positive(),
	}),
});

/**
 * 입시 가이드 (UC-09 / FR-9). 파일 경로: `src/content/guide/{id}.md`
 *
 * 가이드는 섹션 10개가 한 페이지(`/guide`)에 이어 붙는 구조라,
 * `id` 는 URL 세그먼트가 아니라 **`/guide#{id}` 앵커**로 쓰인다.
 * 파일이 평면 구조라 경로 slug 와 frontmatter id 가 어차피 같지만,
 * 앵커가 파일명 변경에 흔들리지 않도록 theory 와 같은 방식으로 명시한다.
 */
const guide = defineCollection({
	loader: glob({
		pattern: '*.md',
		base: './src/content/guide',
		generateId: ({ data }) => String(data.id),
	}),
	schema: z.object({
		/** `/guide#{id}` 앵커 및 목차 링크에 쓰인다. */
		id: z.string(),
		title: z.string(),
		/** 페이지 내 섹션 순서(1부터). */
		order: z.number().int().positive(),
		/** 목차 카드에 노출되는 한 줄 요약. P1 에서 `pages/guide/index.astro` 에 하드코딩돼 있던 값을 이관한 것. */
		summary: z.string(),
	}),
});

/**
 * 전형 일정 (UC-06 / FR-6, 요구사양서 7.4). 파일 경로: `src/content/schedule/{year}.json`
 *
 * id 는 파일명(`2027`)을 그대로 쓰므로 generateId 를 지정하지 않는다.
 * 2027학년도 요강 확정 발표 시 **이 JSON 파일만 교체**하면 되도록 코드와 분리한다(NFR-7).
 */
const schedule = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/schedule' }),
	schema: z.object({
		/** 학년도. */
		year: z.number().int(),
		/** 공식 요강으로 확정된 일정인지. false 인 동안에는 "예정(가안)" 배지를 노출한다(핵심 원칙 4). */
		confirmed: z.boolean(),
		/** 조사/확인 시점 (예: "2026년 7월"). 미확정 안내 문구에 함께 표기한다. */
		checkedAt: z.string(),
		events: z.array(
			z.object({
				label: z.string(),
				/** 미확정 항목은 "미정". 날짜를 추측해 넣지 않는다. */
				date: z.string(),
				status: z.enum(['예정', '확정']),
				note: z.string().optional(),
			})
		),
	}),
});

export const collections = { theory, guide, schedule };

// ── 이후 Phase 에서 추가할 컬렉션 ────────────────────────────────────────────
// P3 에서 등록: exams — 7.2 스키마
//   id, setId, category, subcategory, type('single-choice'|'multi-choice'|'short-answer'),
//   question, choices[], answer, explanation, difficulty
// P4 에서 등록: interview — 7.3 스키마
//   id, category, question, intent, answerGuide
// 지금 등록하면 콘텐츠가 없어 매 빌드마다 빈 컬렉션 경고가 뜨므로 해당 Phase 에서 함께 추가한다.
