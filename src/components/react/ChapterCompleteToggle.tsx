/**
 * 챕터 "학습 완료" 토글 (UC-02 / FR-2.3). `/theory/[category]/[chapter]` 하단에
 * client:load 로 마운트된다. 상태는 `dimigo-prep:progress.theory[chapterId]` 에 저장되며,
 * 홈 대시보드(P5 Dashboard)의 이론 진행률이 이 값을 집계한다.
 */
import { useEffect, useState } from 'react';

import { getTheoryProgress, setTheoryComplete } from '@lib/storage';

interface ChapterCompleteToggleProps {
	chapterId: string;
}

export default function ChapterCompleteToggle({ chapterId }: ChapterCompleteToggleProps) {
	const [completed, setCompleted] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		setCompleted(getTheoryProgress()[chapterId] === true);
	}, [chapterId]);

	if (completed === undefined) {
		return <p className="text-sm text-slate-500">불러오는 중...</p>;
	}

	function handleClick() {
		const next = !completed;
		setCompleted(next);
		setTheoryComplete(chapterId, next);
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			aria-pressed={completed}
			className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition ${
				completed
					? 'border-emerald-300 bg-emerald-50 text-emerald-800'
					: 'border-slate-300 bg-white text-slate-700 hover:border-brand-300'
			}`}
		>
			<span
				aria-hidden="true"
				className={`h-4 w-4 shrink-0 rounded-sm border-2 ${
					completed ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400 bg-white'
				}`}
			/>
			{completed ? '학습 완료' : '학습 완료로 표시'}
		</button>
	);
}
