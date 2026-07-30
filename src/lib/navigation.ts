/**
 * 사이트 전역 내비게이션 상수 및 활성상태 헬퍼.
 *
 * ── 접근성 규칙 (NFR-4) ──
 * **정확 일치에만 `aria-current="page"` 를 붙인다.**
 * 예를 들어 `/theory/hacking-defense/network-basics-01` 에서 헤더의 "이론 학습"(`/theory`)
 * 링크에 `aria-current="page"` 를 붙이면, 스크린리더 사용자에게 "지금 보고 있는 페이지가
 * 이론 학습 목록이다" 라고 거짓말을 하게 된다. 조상 섹션은 `data-active` 속성으로
 * **시각 강조만** 하고, `aria-current` 는 `isCurrentPage()` 가 true 일 때만 출력한다.
 *
 *   - `isCurrentPage(pathname, href)`  → aria-current="page" 판정용 (정확 일치)
 *   - `isActiveSection(pathname, href)` → data-active 판정용 (하위 경로 포함)
 */

export const SITE_NAME = 'DIMIGO PREP';
export const SITE_TAGLINE = '디미고 해킹방어과 입시 준비';
export const SITE_DESCRIPTION = '2027학년도 한국디지털미디어고 해킹방어과 입시 준비 사이트';

export interface NavItem {
	label: string;
	href: string;
}

/** href 가 없으면 링크가 아닌 일반 텍스트로 렌더한다(= 현재 페이지). */
export interface Crumb {
	label: string;
	href?: string;
}

/**
 * 헤더 주 내비게이션.
 *
 * 한글 2~5자 라벨 6개는 768px(태블릿)에서 가로 한 줄 배치가 가능하다.
 * 드롭다운(= 추가 JS + 포커스 트랩)을 피하기 위한 상한이 6이므로 **7개로 늘리지 말 것.**
 * 항목이 더 필요해지면 FOOTER_NAV 로 보내거나 해당 섹션의 하위 페이지로 편입시킨다.
 */
export const PRIMARY_NAV: readonly NavItem[] = [
	{ label: '이론 학습', href: '/theory' },
	{ label: '모의고사', href: '/exam' },
	{ label: '오답노트', href: '/wrongnote' },
	{ label: '면접 준비', href: '/interview' },
	{ label: '입시 가이드', href: '/guide' },
	{ label: '체크리스트', href: '/checklist' },
] as const;

/**
 * 푸터 내비게이션 — 정적 라우트 10개를 4그룹으로 전부 나열한다.
 *
 * 헤더(PRIMARY_NAV)에 없는 `/guide/schedule` · `/interview/timeattack` · `/search` 도
 * 푸터를 통해 사이트 어디에서든 항상 도달 가능해야 한다(고아 페이지 방지).
 */
export const FOOTER_NAV: readonly { title: string; items: readonly NavItem[] }[] = [
	{
		title: '학습',
		items: [
			{ label: '이론 학습', href: '/theory' },
			{ label: '입시 가이드', href: '/guide' },
		],
	},
	{
		title: '실전',
		items: [
			{ label: '모의고사', href: '/exam' },
			{ label: '오답노트', href: '/wrongnote' },
		],
	},
	{
		title: '면접',
		items: [
			{ label: '면접 준비', href: '/interview' },
			{ label: '타임어택', href: '/interview/timeattack' },
		],
	},
	{
		title: '정보',
		items: [
			{ label: '전형 일정', href: '/guide/schedule' },
			{ label: '준비 체크리스트', href: '/checklist' },
			{ label: '통합 검색', href: '/search' },
			{ label: '홈', href: '/' },
		],
	},
] as const;

/**
 * 경로 끝의 슬래시를 제거해 비교 가능한 형태로 정규화한다.
 * `'/theory/'` → `'/theory'`, 루트 `'/'` 는 그대로 `'/'` 를 유지한다.
 */
export function normalizePath(pathname: string): string {
	if (!pathname) return '/';
	const trimmed = pathname.replace(/\/+$/, '');
	return trimmed === '' ? '/' : trimmed;
}

/**
 * 현재 페이지인지(정확 일치) 판정한다. `aria-current="page"` 출력 조건.
 */
export function isCurrentPage(pathname: string, href: string): boolean {
	return normalizePath(pathname) === normalizePath(href);
}

/**
 * 현재 경로가 해당 섹션에 속하는지(하위 경로 포함) 판정한다. `data-active` 시각 강조용.
 * `href === '/'` 는 모든 경로의 조상이 되어버리므로 항상 false 를 반환한다.
 */
export function isActiveSection(pathname: string, href: string): boolean {
	const target = normalizePath(href);
	if (target === '/') return false;
	const current = normalizePath(pathname);
	return current === target || current.startsWith(`${target}/`);
}
