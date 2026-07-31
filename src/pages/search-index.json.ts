/**
 * 통합 검색 정적 인덱스 (UC-08 / FR-8.1). 빌드 시 한 번 생성되는 JSON 엔드포인트 —
 * `/search-index.json` 으로 정적 파일이 나가며, SiteSearch(React 아일랜드)가 클라이언트에서
 * fetch 해 전량 로드한 뒤 브라우저 안에서만 검색한다(검색어는 서버로 전송되지 않는다).
 *
 * FR-8.1 은 "제목·태그"만 검색 대상으로 규정하지만, 문항 콘텐츠(모의고사/면접)에는 title이나
 * tags 필드가 없다 — 대신 question 텍스트 자체가 그 역할을 한다. 그래서 콘텐츠 종류별로
 * "제목에 준하는 필드"를 `title`, 나머지 부가 검색어(카테고리/소분류/태그)를 `keywords` 로
 * 정규화했다. 본문(마크다운/해설) 전체는 인덱싱하지 않는다 — 인덱스 크기를 작게 유지하고,
 * FR-8.1 의 "제목·태그" 범위를 넘지 않기 위해서다.
 */
import type { APIRoute } from 'astro';

import {
	THEORY_CATEGORIES,
	listAllExamQuestions,
	listAllInterviewQuestions,
	listTheoryChapters,
} from '@lib/taxonomy';

export const prerender = true;

export interface SearchDoc {
	type: 'theory' | 'exam' | 'interview';
	id: string;
	/** 목록에 굵게 표시되는 제목(이론은 챕터 제목, 문항류는 질문 텍스트). */
	title: string;
	/** 결과 카드의 보조 설명(카테고리/영역 등). */
	meta: string;
	href: string;
	/** title 과 함께 매칭 대상이 되는 부가 검색어(태그/카테고리/소분류). 소문자 비교는 클라이언트가 한다. */
	keywords: string;
}

export const GET: APIRoute = async () => {
	const categoryTitle = new Map(THEORY_CATEGORIES.map((c) => [c.slug, c.title] as const));
	const subcategoryTitle = new Map(
		THEORY_CATEGORIES.flatMap((c) => c.subcategories.map((s) => [s.slug, s.title] as const)),
	);

	const chapters = await listTheoryChapters();
	const examQuestions = await listAllExamQuestions();
	const interviewQuestions = await listAllInterviewQuestions();

	const docs: SearchDoc[] = [
		...chapters.map(
			(c): SearchDoc => ({
				type: 'theory',
				id: c.id,
				title: c.title,
				meta: `${categoryTitle.get(c.category) ?? c.category} · ${subcategoryTitle.get(c.subcategory) ?? c.subcategory}`,
				href: `/theory/${c.category}/${c.id}`,
				keywords: [subcategoryTitle.get(c.subcategory), categoryTitle.get(c.category), ...c.tags]
					.filter(Boolean)
					.join(' '),
			}),
		),
		...examQuestions.map(
			(q): SearchDoc => ({
				type: 'exam',
				id: q.id,
				title: q.question,
				meta: `${q.areaTitle} · ${q.setId}`,
				href: `/exam/${q.setId}`,
				keywords: [q.areaTitle, q.subcategory].filter(Boolean).join(' '),
			}),
		),
		...interviewQuestions.map(
			(q): SearchDoc => ({
				type: 'interview',
				id: q.id,
				title: q.question,
				meta: q.categoryTitle,
				href: `/interview/${q.category}`,
				keywords: q.categoryTitle,
			}),
		),
	];

	return new Response(JSON.stringify(docs), {
		headers: { 'Content-Type': 'application/json' },
	});
};
