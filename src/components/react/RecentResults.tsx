/**
 * "최근 결과" 막대 리스트 (FR-3.5, 간단한 차트). `/exam` 에 client:load 로 마운트된다.
 * 별도 차트 라이브러리 없이 div 하나로 막대를 그린다.
 */
import { useEffect, useState } from 'react';

import { getExamResults, type ExamResultRecord } from '@lib/storage';
import type { ExamSetRef } from '@lib/taxonomy';

interface RecentResultsProps {
	sets: ExamSetRef[];
}

const MAX_SHOWN = 8;

export default function RecentResults({ sets }: RecentResultsProps) {
	const [results, setResults] = useState<ExamResultRecord[] | undefined>(undefined);

	useEffect(() => {
		setResults(getExamResults());
	}, []);

	if (results === undefined) {
		return <p className="text-sm text-slate-500">불러오는 중...</p>;
	}

	if (results.length === 0) {
		return (
			<div className="rounded-lg border border-slate-200 bg-white p-5">
				<p className="text-sm text-slate-600">아직 응시 기록이 없습니다.</p>
				<p className="mt-2 text-sm leading-relaxed text-slate-600">
					응시를 마치면 세트별 점수와 영역별 정답률이 이 자리에 쌓입니다. 틀린 문항은 자동으로
					오답노트로 모입니다.
				</p>
				<p className="mt-3 text-sm">
					<a className="font-semibold text-brand-700 underline underline-offset-2" href="/wrongnote">
						오답노트 보기
					</a>
				</p>
			</div>
		);
	}

	const recent = [...results].slice(-MAX_SHOWN).reverse();

	return (
		<div className="rounded-lg border border-slate-200 bg-white p-5">
			<ul className="list-none space-y-4 p-0">
				{recent.map((r, i) => {
					const set = sets.find((s) => s.setId === r.setId);
					return (
						<li key={`${r.setId}-${r.date}-${i}`}>
							<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
								<span className="font-semibold text-slate-900">{set?.title ?? r.setId}</span>
								<span className="text-slate-500">
									{r.date} · {r.score}점
								</span>
							</div>
							<div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
								<div className="h-full rounded-full bg-brand-600" style={{ width: `${r.score}%` }} />
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
