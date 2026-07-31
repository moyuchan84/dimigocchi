/**
 * 통합 검색 정적 인덱스 (UC-08 / FR-8.1). 빌드 시 한 번 생성되는 JSON 엔드포인트 —
 * `/search-index.json` 으로 정적 파일이 나가며, SiteSearch(React 아일랜드)가 클라이언트에서
 * fetch 해 전량 로드한 뒤 브라우저 안에서만 검색한다(검색어는 서버로 전송되지 않는다).
 *
 * FR-8.1(고도화 이후)은 "제목·태그 및 본문 일부"를 검색 대상으로 규정한다. 콘텐츠 종류별로
 * "제목에 준하는 필드"를 `title`, 부가 검색어(카테고리/소분류/태그)를 `keywords`,
 * 본문에 준하는 필드(이론 챕터 마크다운 본문/문항 해설/면접 답변 가이드)를 `body` 로 정규화했다.
 * `body`는 title/keywords 매칭에 실패한 토큰의 폴백 매칭 및 결과 스니펫 표시에만 쓰이고,
 * 퍼지(오타 허용) 매칭 후보에는 포함하지 않는다(SiteSearch.tsx 참고 — 성능/정확도 트레이드오프).
 *
 * 이론 챕터 본문은 원본 마크다운을 그대로 넣지 않고 `stripMarkdownForSearch()`로 가공한다:
 * 코드펜스(```...```)는 통째로 제거한다 — 리버싱/웹해킹 챕터의 헥스 덤프나 비유적 "공격
 * 문자열" 예시가 전후 문맥 없이 검색 스니펫으로만 잘려 나오면 핵심 원칙 3(개념/방어적 관점)의
 * 취지에 어긋나 보일 수 있기 때문이다. 헤딩/강조/링크 등 인라인 마크다운 문법도 가볍게 벗겨
 * 순수 텍스트에 가깝게 만든다.
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
	/** 본문에 준하는 텍스트(이론 본문/문항 해설/면접 답변 가이드). 폴백 매칭·스니펫 표시용. */
	body: string;
}

/** 이론 챕터 원본 마크다운을 검색·스니펫용 순수 텍스트로 가공한다. */
function stripMarkdownForSearch(markdown: string): string {
	return markdown
		.replace(/```[\s\S]*?```/g, ' ') // 코드펜스 블록 통째로 제거(핵심 원칙 3 — 문맥 없는 노출 방지)
		.replace(/^#{1,6}\s+/gm, '') // 헤딩 마커
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [텍스트](링크) → 텍스트
		.replace(/[*_`>]/g, '') // 강조/인용 기호
		.replace(/\s+/g, ' ')
		.trim();
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
				body: stripMarkdownForSearch(c.body),
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
				body: q.explanation,
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
				body: q.answerGuide,
			}),
		),
	];

	return new Response(JSON.stringify(docs), {
		headers: { 'Content-Type': 'application/json' },
	});
};
