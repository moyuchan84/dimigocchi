/**
 * 통합 검색 (UC-08 / FR-8.1 ~ FR-8.2). `/search` 에 client:load 로 마운트된다.
 *
 * 빌드 시 생성된 `/search-index.json` 을 한 번 fetch 해 전량 메모리에 올린 뒤, 모든 매칭은
 * 브라우저 안에서만 일어난다 — 검색어는 어디로도 전송되지 않는다. 이론 챕터 13개 + 모의고사
 * 문항 180개 + 면접 질문 38개, 총 200여 개 문서라 별도 검색 라이브러리 없이 매 입력마다
 * 전체를 훑어도(단순 부분 문자열 매칭) 체감 지연이 없다.
 *
 * 매칭 규칙: 검색어를 공백으로 토큰화하고, 모든 토큰이 title 또는 keywords 어딘가에 부분
 * 문자열로 있어야 매치(AND). title 매치가 keywords 매치보다 점수가 높아 상위에 온다.
 * 페이지 새로고침 없이 입력 즉시 갱신되며(FR-8.1 "즉시 표시"), 현재 검색어는
 * `history.replaceState` 로 URL(`?q=`)에 반영해 결과를 북마크·공유할 수 있게 한다.
 */
import { useEffect, useMemo, useState } from 'react';

interface SearchDoc {
	type: 'theory' | 'exam' | 'interview';
	id: string;
	title: string;
	meta: string;
	href: string;
	keywords: string;
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

function scoreDoc(doc: SearchDoc, tokens: string[]): number {
	const title = doc.title.toLowerCase();
	const keywords = doc.keywords.toLowerCase();
	let score = 0;
	for (const token of tokens) {
		if (title.includes(token)) score += 3;
		else if (keywords.includes(token)) score += 1;
		else return 0;
	}
	return score;
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

	const grouped = useMemo(() => {
		if (!docs) return undefined;
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return undefined;
		const tokens = trimmed.split(/\s+/).filter(Boolean);

		const scored = docs
			.map((doc) => ({ doc, score: scoreDoc(doc, tokens) }))
			.filter((s) => s.score > 0)
			.sort((a, b) => b.score - a.score);

		const byType = new Map<SearchDoc['type'], SearchDoc[]>();
		for (const { doc } of scored) {
			const list = byType.get(doc.type) ?? [];
			list.push(doc);
			byType.set(doc.type, list);
		}
		return byType;
	}, [docs, query]);

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
				) : grouped === undefined ? (
					<div>
						<h2 className="text-lg font-semibold text-slate-900">검색 대상</h2>
						<p className="mt-1 text-sm text-slate-600">
							키워드를 입력하면 이론 챕터, 모의고사 문항, 면접 질문을 한 번에 찾습니다.
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
				) : grouped.size === 0 ? (
					<p className="text-sm leading-relaxed text-slate-600">
						&ldquo;{query}&rdquo;에 대한 검색 결과가 없어요. 다른 키워드로 다시 시도해보세요.
					</p>
				) : (
					<div className="space-y-8">
						{TYPE_ORDER.filter((type) => grouped.has(type)).map((type) => {
							const results = grouped.get(type) ?? [];
							return (
								<section key={type} aria-labelledby={`result-${type}-heading`}>
									<h2 id={`result-${type}-heading`} className="text-lg font-semibold text-slate-900">
										{TYPE_LABEL[type]}
										<span className="ml-2 text-sm font-normal text-slate-500">{results.length}건</span>
									</h2>
									<ul className="mt-3 list-none space-y-2 p-0">
										{results.slice(0, MAX_PER_GROUP).map((doc) => (
											<li key={`${doc.type}-${doc.id}`}>
												<a
													href={doc.href}
													className="group flex flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
												>
													<span className="font-medium text-slate-900 group-hover:text-brand-700">
														{doc.title}
													</span>
													<span className="mt-1 text-xs text-slate-500">{doc.meta}</span>
												</a>
											</li>
										))}
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
