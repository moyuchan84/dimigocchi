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

/**
 * 모의고사 문항 (UC-03 / FR-3, 요구사양서 7.2). 파일 경로: `src/content/exams/{setId}.json`
 *
 * `schedule` 과 같은 "파일 1개 = 엔티티 1개" 패턴이다. 다만 엔티티가 개별 문항이 아니라
 * **세트**다 — `listExamSets()`/`getExamSet()` 이 요구하는 title/area/areaTitle/limitMinutes 는
 * 세트 단위 정보라 문항 배열만으로는 만들 수 없기 때문이다. `questions[]` 각 원소가 7.2 의
 * 문항 스키마(id/category/subcategory/type/question/choices/answer/explanation/difficulty)다.
 *
 * type 에 따라 choices/answer 모양이 달라져 discriminatedUnion 으로 분기한다.
 * "answer 인덱스가 choices 범위 안인지" 같은 교차 필드 검증은 discriminatedUnion 이 표현하지
 * 못하므로(분기마다 .refine() 을 걸면 ZodEffects 가 되어 discriminatedUnion 배열에 넣을 수 없다)
 * union 을 만든 뒤 별도 superRefine 으로 보강한다.
 */
const examQuestionBase = {
	/** 문항 고유 id. 세트 안에서 유일해야 하며 관례상 `{setId}-q{NN}` 형태를 쓴다. */
	id: z.string(),
	category: z.enum(['aptitude', 'hacking-defense']),
	/** 이론 챕터의 subcategory 와 같은 값 체계 — 결과 화면의 소분류별 정답률 집계 키로 쓰인다. */
	subcategory: z.string(),
	question: z.string(),
	explanation: z.string(),
	difficulty: z.enum(['easy', 'medium', 'hard']),
};

const singleChoiceQuestion = z.object({
	...examQuestionBase,
	type: z.literal('single-choice'),
	choices: z.array(z.string()).min(2),
	/** choices 배열의 0-based 인덱스. */
	answer: z.number().int().nonnegative(),
});

const multiChoiceQuestion = z.object({
	...examQuestionBase,
	type: z.literal('multi-choice'),
	choices: z.array(z.string()).min(2),
	/** choices 배열의 0-based 인덱스 목록. 채점은 순서 무관 완전 일치(부분점수 없음). */
	answer: z.array(z.number().int().nonnegative()).min(1),
});

const shortAnswerQuestion = z.object({
	...examQuestionBase,
	type: z.literal('short-answer'),
	// short-answer 는 choices 필드를 갖지 않는다.
	/** 허용 답안(정규화 전 원문) 목록. 채점 시 trim/공백축약/소문자화 후 비교한다. */
	answer: z.array(z.string().min(1)).min(1),
});

const examQuestionSchema = z
	.discriminatedUnion('type', [singleChoiceQuestion, multiChoiceQuestion, shortAnswerQuestion])
	.superRefine((q, ctx) => {
		if (q.type === 'single-choice' && (q.answer < 0 || q.answer >= q.choices.length)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['answer'],
				message: `answer 인덱스(${q.answer})가 choices 범위(0~${q.choices.length - 1})를 벗어났습니다.`,
			});
		}
		if (q.type === 'multi-choice') {
			const seen = new Set<number>();
			for (const idx of q.answer) {
				if (idx < 0 || idx >= q.choices.length) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['answer'],
						message: `answer 인덱스(${idx})가 choices 범위(0~${q.choices.length - 1})를 벗어났습니다.`,
					});
				}
				if (seen.has(idx)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['answer'],
						message: `answer 에 중복 인덱스(${idx})가 있습니다.`,
					});
				}
				seen.add(idx);
			}
		}
	});

const exams = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/exams' }),
	schema: z
		.object({
			/** 파일명과 같아야 한다(파일명이 곧 컬렉션 id). `/exam/{setId}` 라우트로 쓰인다. */
			setId: z.string(),
			title: z.string(),
			area: z.enum(['math-reasoning', 'problem-solving', 'it-trend', 'hd-concept', 'mock-full']),
			areaTitle: z.string(),
			limitMinutes: z.number().int().positive(),
			questions: z.array(examQuestionSchema).min(1),
		})
		.superRefine((set, ctx) => {
			// 문항 id 전역 고유성은 "{setId}-" 접두어 컨벤션으로 보장한다(zod 스키마 함수는
			// 다른 파일의 내용을 알 수 없어 파일 간 교차 검증은 불가능하다).
			const seenIds = new Set<string>();
			set.questions.forEach((q, i) => {
				if (!q.id.startsWith(`${set.setId}-`)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['questions', i, 'id'],
						message: `문항 id는 "${set.setId}-"로 시작해야 합니다(실제: ${q.id}).`,
					});
				}
				if (seenIds.has(q.id)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['questions', i, 'id'],
						message: `세트 내 중복된 문항 id: ${q.id}`,
					});
				}
				seenIds.add(q.id);
			});
		}),
});

/**
 * 면접 질문 (UC-05 / FR-5, 요구사양서 7.3). 파일 경로: `src/content/interview/{category}.json`
 *
 * `exams` 와 같은 "파일 1개 = 엔티티 1개" 패턴이다. 다만 엔티티가 개별 질문이 아니라
 * **카테고리**다 — `listInterviewCategories()`/`getInterviewCategory()` 가 요구하는
 * title/description 은 카테고리 단위 정보라 질문 배열만으로는 만들 수 없기 때문이다
 * (exams 의 setId/title/area/areaTitle 과 동일한 이유).
 */
const interviewQuestionSchema = z.object({
	/** 문항 고유 id. 카테고리 안에서 유일해야 하며 관례상 `iv-{category}-{NN}` 형태를 쓴다. */
	id: z.string(),
	question: z.string(),
	/** 출제 의도/평가 포인트. */
	intent: z.string(),
	/** 결론 → 근거 → 경험사례 구조의 답변 작성 가이드. */
	answerGuide: z.string(),
});

const interview = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/interview' }),
	schema: z
		.object({
			/** 파일명과 같아야 한다. `/interview/{category}` 라우트로 쓰인다. */
			category: z.enum(['motivation', 'portfolio', 'career', 'personality', 'security-news']),
			/** 카테고리 표시 제목(한국어). */
			title: z.string(),
			/** 카테고리 한 줄 설명. */
			description: z.string(),
			questions: z.array(interviewQuestionSchema).min(1),
		})
		.superRefine((cat, ctx) => {
			// 문항 id 전역 고유성은 "iv-{category}-" 접두어 컨벤션으로 보장한다(exams 의 {setId}- 와 동일한 이유).
			const seenIds = new Set<string>();
			const prefix = `iv-${cat.category}-`;
			cat.questions.forEach((q, i) => {
				if (!q.id.startsWith(prefix)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['questions', i, 'id'],
						message: `문항 id는 "${prefix}"로 시작해야 합니다(실제: ${q.id}).`,
					});
				}
				if (seenIds.has(q.id)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ['questions', i, 'id'],
						message: `카테고리 내 중복된 문항 id: ${q.id}`,
					});
				}
				seenIds.add(q.id);
			});
		}),
});

export const collections = { theory, guide, schedule, exams, interview };
