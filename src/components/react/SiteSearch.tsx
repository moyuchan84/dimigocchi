/**
 * 통합 검색 (UC-08 / FR-8.1 ~ FR-8.4). `/search` 에 client:load 로 마운트된다.
 *
 * 빌드 시 생성된 `/search-index.json` 을 한 번 fetch 해 전량 메모리에 올린 뒤, 모든 매칭은
 * 브라우저 안에서만 일어난다 — 검색어는 어디로도 전송되지 않는다. 이론 챕터 13개 + 모의고사
 * 문항 180개 + 면접 질문 38개, 총 200여 개 문서라 별도 검색 라이브러리 없이 매 입력마다
 * 전체를 훑어도(단순 부분 문자열 매칭 + 소규모 퍼지 매칭) 체감 지연이 없다.
 *
 * 매칭 규칙(토큰 단위 AND, 토큰 하나라도 실패하면 문서 제외): title 정확 일치(3점) >
 * keywords/body 정확 일치(1점) > title 단어 퍼지 일치(2점) > keywords 단어 퍼지 일치(1점).
 * body 는 퍼지 매칭 후보에서 제외한다 — 이론 챕터 본문이 수백 단어라 매 입력마다 레벤슈타인을
 * 전부 돌리면 체감 지연이 생길 수 있고, 어차피 title/keywords에 없는 본문 속 오타 하나를
 * 잡아주는 이득보다 그 비용이 크다(정확 일치 폴백은 유지).
 *
 * 하이라이트는 정확 일치 구간에만 적용한다(퍼지로만 맞은 경우 문자열 경계가 애매해 강조하지
 * 않음). title 은 항상 하이라이트해 보여주고, 어떤 토큰이 title/keywords 어디에도 없이
 * body 에서만(정확 일치로) 걸렸다면 그 지점 주변을 스니펫으로 잘라 보여준다.
 *
 * 페이지 새로고침 없이 입력 즉시 갱신되며(FR-8.1 "즉시 표시"), 현재 검색어는
 * `history.replaceState` 로 URL(`?q=`)에 반영해 결과를 북마크·공유할 수 있게 한다.
 */
import { Fragment, useEffect, useMemo, useState } from 'react';

interface SearchDoc {
	type: 'theory' | 'exam' | 'interview';
	id: string;
	title: string;
	meta: string;
	href: string;
	keywords: string;
	body: string;
}

const TYPE_LABEL: Record<SearchDoc['type'], string> = {
	theory: '이론 챕터',
	exam: '모의고사 문항',
	interview: '면접 질문',
};

const TYPE_HREF: Record<SearchDoc['type'], string> = {
	theory: '/theory',
	exam: '/exam',
	interview: '/interview',
};

/** 결과 그룹 표시 순서(FR-8.2 카테고리별 그룹핑). */
const TYPE_ORDER: readonly SearchDoc['type'][] = ['theory', 'exam', 'interview'];

/** 결과가 너무 길어지는 것을 막는 그룹당 상한. 200여 개 문서 규모에서는 사실상 거의 걸리지 않는다. */
const MAX_PER_GROUP = 30;

/** body 스니펫에서 매칭 지점 앞뒤로 잘라낼 글자 수. */
const SNIPPET_RADIUS = 60;

/** 문자열에서 유니코드 문자/숫자 단위 "단어"만 추출한다(한글 포함, 조사가 붙은 채로도 무방). */
function extractWords(text: string): string[] {
	return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** 표준 레벤슈타인 편집 거리(행 단위 DP, 짧은 단어 비교용이라 O(len) 메모리로 충분). */
function levenshtein(a: string, b: string): number {
	if (a === b) return 0;
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;

	let prevRow = Array.from({ length: b.length + 1 }, (_, j) => j);
	for (let i = 1; i <= a.length; i++) {
		const currRow = [i];
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			currRow.push(Math.min(currRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost));
		}
		prevRow = currRow;
	}
	return prevRow[b.length];
}

/** 토큰 길이별 허용 편집 거리. 너무 짧은 토큰은 오탐이 늘어나므로 퍼지 매칭을 아예 끈다. */
function fuzzyThreshold(tokenLength: number): number {
	if (tokenLength < 3) return -1;
	if (tokenLength <= 5) return 1;
	return 2;
}

function hasFuzzyMatch(token: string, words: readonly string[], threshold: number): boolean {
	for (const word of words) {
		if (Math.abs(word.length - token.length) > threshold) continue;
		if (levenshtein(token, word) <= threshold) return true;
	}
	return false;
}

interface IndexedDoc {
	doc: SearchDoc;
	titleLower: string;
	keywordsLower: string;
	bodyLower: string;
	/** 퍼지 매칭 후보 — title/keywords 에서만 추출(“매칭 규칙” 주석 참고, body 는 제외). */
	titleWords: string[];
	keywordWords: string[];
}

interface MatchResult {
	score: number;
	/** title/keywords 어디에도 없이 body 에서만 정확 일치로 걸린 첫 토큰(있다면 스니펫 트리거). */
	bodySnippetToken?: string;
}

function matchDoc(idoc: IndexedDoc, tokens: readonly string[]): MatchResult | null {
	let score = 0;
	let bodySnippetToken: string | undefined;

	for (const token of tokens) {
		if (idoc.titleLower.includes(token)) {
			score += 3;
			continue;
		}
		if (idoc.keywordsLower.includes(token)) {
			score += 1;
			continue;
		}
		if (idoc.bodyLower.includes(token)) {
			score += 1;
			if (bodySnippetToken === undefined) bodySnippetToken = token;
			continue;
		}
		const threshold = fuzzyThreshold(token.length);
		if (threshold >= 0 && hasFuzzyMatch(token, idoc.titleWords, threshold)) {
			score += 2;
			continue;
		}
		if (threshold >= 0 && hasFuzzyMatch(token, idoc.keywordWords, threshold)) {
			score += 1;
			continue;
		}
		return null; // 토큰 하나라도 전부 실패하면 문서 전체 제외(AND)
	}

	return { score, bodySnippetToken };
}

/** 여러 토큰의 정확 일치 구간을 한 문자열에 대해 한 번에 찾아 겹치지 않게 병합한다. */
function findMatchRanges(text: string, tokens: readonly string[]): Array<[number, number]> {
	const lower = text.toLowerCase();
	const ranges: Array<[number, number]> = [];
	for (const token of tokens) {
		if (!token) continue;
		let from = 0;
		let idx = lower.indexOf(token, from);
		while (idx !== -1) {
			ranges.push([idx, idx + token.length]);
			from = idx + token.length;
			idx = lower.indexOf(token, from);
		}
	}
	if (ranges.length === 0) return [];

	ranges.sort((a, b) => a[0] - b[0]);
	const merged: Array<[number, number]> = [ranges[0]];
	for (const [start, end] of ranges.slice(1)) {
		const last = merged[merged.length - 1];
		if (start <= last[1]) last[1] = Math.max(last[1], end);
		else merged.push([start, end]);
	}
	return merged;
}

/** 하이라이트 대상 문자열을 일반/강조 구간으로 나눈다(겹치는 토큰 매칭에도 안전). */
function Highlighted({ text, tokens }: { text: string; tokens: readonly string[] }) {
	const ranges = findMatchRanges(text, tokens);
	if (ranges.length === 0) return <>{text}</>;

	const segments: { text: string; hit: boolean }[] = [];
	let cursor = 0;
	for (const [start, end] of ranges) {
		if (start > cursor) segments.push({ text: text.slice(cursor, start), hit: false });
		segments.push({ text: text.slice(start, end), hit: true });
		cursor = end;
	}
	if (cursor < text.length) segments.push({ text: text.slice(cursor), hit: false });

	return (
		<>
			{segments.map((seg, i) =>
				seg.hit ? (
					<mark key={i} className="rounded-sm bg-amber-200 px-0.5 text-inherit">
						{seg.text}
					</mark>
				) : (
					<Fragment key={i}>{seg.text}</Fragment>
				),
			)}
		</>
	);
}

/** body 에서 token 첫 등장 지점 주변을 잘라낸다. 못 찾으면(방어적) 빈 문자열. */
function extractSnippet(body: string, token: string): string {
	const idx = body.toLowerCase().indexOf(token);
	if (idx === -1) return '';
	const start = Math.max(0, idx - SNIPPET_RADIUS);
	const end = Math.min(body.length, idx + token.length + SNIPPET_RADIUS);
	let snippet = body.slice(start, end).trim();
	if (start > 0) snippet = `…${snippet}`;
	if (end < body.length) snippet = `${snippet}…`;
	return snippet;
}

export default function SiteSearch() {
	const [docs, setDocs] = useState<SearchDoc[] | undefined>(undefined);
	const [query, setQuery] = useState('');

	useEffect(() => {
		fetch('/search-index.json')
			.then((res) => res.json())
			.then(setDocs)
			.catch(() => setDocs([]));

		const initialQuery = new URLSearchParams(window.location.search).get('q');
		if (initialQuery) setQuery(initialQuery);
	}, []);

	useEffect(() => {
		const url = query ? `/search?q=${encodeURIComponent(query)}` : '/search';
		window.history.replaceState(null, '', url);
	}, [query]);

	const scopeCounts = useMemo(() => {
		if (!docs) return undefined;
		const counts = new Map<SearchDoc['type'], number>();
		for (const doc of docs) counts.set(doc.type, (counts.get(doc.type) ?? 0) + 1);
		return counts;
	}, [docs]);

	/** 문서별 소문자 캐시 + 퍼지 매칭용 단어 목록을 docs 로드 시 한 번만 계산한다(키 입력마다 X). */
	const indexed = useMemo<IndexedDoc[] | undefined>(() => {
		if (!docs) return undefined;
		return docs.map((doc) => ({
			doc,
			titleLower: doc.title.toLowerCase(),
			keywordsLower: doc.keywords.toLowerCase(),
			bodyLower: doc.body.toLowerCase(),
			titleWords: Array.from(new Set(extractWords(doc.title))),
			keywordWords: Array.from(new Set(extractWords(doc.keywords))),
		}));
	}, [docs]);

	const searchResult = useMemo(() => {
		if (!indexed) return undefined;
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return undefined;
		const tokens = trimmed.split(/\s+/).filter(Boolean);

		const scored = indexed
			.map((idoc) => ({ idoc, match: matchDoc(idoc, tokens) }))
			.filter((s): s is { idoc: IndexedDoc; match: MatchResult } => s.match !== null)
			.sort((a, b) => b.match.score - a.match.score);

		const byType = new Map<SearchDoc['type'], Array<{ doc: SearchDoc; bodySnippetToken?: string }>>();
		for (const { idoc, match } of scored) {
			const list = byType.get(idoc.doc.type) ?? [];
			list.push({ doc: idoc.doc, bodySnippetToken: match.bodySnippetToken });
			byType.set(idoc.doc.type, list);
		}
		return { byType, tokens };
	}, [indexed, query]);

	return (
		<div>
			<form role="search" onSubmit={(e) => e.preventDefault()}>
				<label htmlFor="search-input" className="sr-only">
					검색어
				</label>
				<input
					id="search-input"
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="예: XSS, 수리추론, 지원동기"
					autoFocus
					className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 focus:outline-none"
				/>
			</form>

			<div className="mt-6">
				{docs === undefined ? (
					<p className="text-sm text-slate-500">검색 인덱스를 불러오는 중...</p>
				) : searchResult === undefined ? (
					<div>
						<h2 className="text-lg font-semibold text-slate-900">검색 대상</h2>
						<p className="mt-1 text-sm text-slate-600">
							키워드를 입력하면 이론 챕터, 모의고사 문항, 면접 질문을 한 번에 찾습니다. 오타나
							부분 일치도 어느 정도 허용해요.
						</p>
						<ul className="mt-4 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
							{TYPE_ORDER.map((type) => (
								<li key={type}>
									<a
										href={TYPE_HREF[type]}
										className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
									>
										<span className="font-semibold text-slate-900 group-hover:text-brand-700">
											{TYPE_LABEL[type]}
										</span>
										<span className="mt-auto pt-3 text-xs text-slate-500">
											{scopeCounts?.get(type) ?? 0}개 문서 검색 대상
										</span>
									</a>
								</li>
							))}
						</ul>
					</div>
				) : searchResult.byType.size === 0 ? (
					<p className="text-sm leading-relaxed text-slate-600">
						&ldquo;{query}&rdquo;에 대한 검색 결과가 없어요. 다른 키워드로 다시 시도해보세요.
					</p>
				) : (
					<div className="space-y-8">
						{TYPE_ORDER.filter((type) => searchResult.byType.has(type)).map((type) => {
							const results = searchResult.byType.get(type) ?? [];
							return (
								<section key={type} aria-labelledby={`result-${type}-heading`}>
									<h2 id={`result-${type}-heading`} className="text-lg font-semibold text-slate-900">
										{TYPE_LABEL[type]}
										<span className="ml-2 text-sm font-normal text-slate-500">{results.length}건</span>
									</h2>
									<ul className="mt-3 list-none space-y-2 p-0">
										{results.slice(0, MAX_PER_GROUP).map(({ doc, bodySnippetToken }) => {
											const snippet = bodySnippetToken
												? extractSnippet(doc.body, bodySnippetToken)
												: '';
											return (
												<li key={`${doc.type}-${doc.id}`}>
													<a
														href={doc.href}
														className="group flex flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
													>
														<span className="font-medium text-slate-900 group-hover:text-brand-700">
															<Highlighted text={doc.title} tokens={searchResult.tokens} />
														</span>
														<span className="mt-1 text-xs text-slate-500">{doc.meta}</span>
														{snippet && (
															<span className="mt-1 text-xs text-slate-500 italic">
																<Highlighted text={snippet} tokens={searchResult.tokens} />
															</span>
														)}
													</a>
												</li>
											);
										})}
									</ul>
									{results.length > MAX_PER_GROUP && (
										<p className="mt-2 text-xs text-slate-500">
											{results.length - MAX_PER_GROUP}건을 더 찾았지만 상위 {MAX_PER_GROUP}건만
											보여줘요. 검색어를 조금 더 구체적으로 입력해보세요.
										</p>
									)}
								</section>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
