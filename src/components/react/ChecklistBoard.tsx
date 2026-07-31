/**
 * 준비 체크리스트 (UC-07). `/checklist` 에 client:load 로 마운트되며, 요약 진행률과
 * 단계별 체크박스 목록을 한 아일랜드가 함께 소유한다(WrongNoteList 와 같은 이유 — 두 조각으로
 * 나누면 상단 요약 카운트와 실제 체크 상태가 어긋날 수 있다).
 */
import { useEffect, useState } from 'react';

import { getChecklist, setChecklistItem } from '@lib/storage';
import type { ChecklistStage } from '@lib/checklist';

interface ChecklistBoardProps {
	stages: readonly ChecklistStage[];
}

export default function ChecklistBoard({ stages }: ChecklistBoardProps) {
	const [checked, setChecked] = useState<Record<string, boolean> | undefined>(undefined);

	useEffect(() => {
		setChecked(getChecklist());
	}, []);

	const totalItems = stages.reduce((sum, stage) => sum + stage.items.length, 0);

	if (checked === undefined) {
		return <p className="text-sm text-slate-500">불러오는 중...</p>;
	}

	function toggle(itemId: string, next: boolean) {
		setChecked((prev) => ({ ...(prev ?? {}), [itemId]: next }));
		setChecklistItem(itemId, next);
	}

	const doneCount = stages.flatMap((stage) => stage.items).filter((item) => checked[item.id]).length;
	const donePercent = totalItems === 0 ? 0 : Math.round((doneCount / totalItems) * 100);

	return (
		<div>
			<div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
				<p className="text-sm leading-relaxed text-slate-600">
					전체 <strong className="font-semibold text-slate-900">{totalItems}개</strong> 항목 중{' '}
					<strong className="font-semibold text-brand-700">{doneCount}개</strong> 완료했어요 (
					{stages.length}단계).
				</p>
				<div aria-hidden="true" className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
					<div className="h-full rounded-full bg-brand-600" style={{ width: `${donePercent}%` }} />
				</div>
			</div>

			<ol className="mt-8 list-none space-y-8 p-0">
				{stages.map((stage, index) => {
					const stageDone = stage.items.filter((item) => checked[item.id]).length;
					return (
						<li key={stage.id}>
							<section aria-labelledby={`stage-${stage.id}`}>
								<h2 id={`stage-${stage.id}`} className="text-lg font-semibold text-slate-900">
									<span className="mr-2 font-mono text-sm text-brand-700">{index + 1}단계</span>
									{stage.title}
									<span className="ml-2 text-sm font-normal text-slate-500">
										({stageDone}/{stage.items.length})
									</span>
								</h2>
								<p className="mt-1 text-sm text-slate-600">{stage.summary}</p>
								<ul className="mt-4 list-none divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white p-0">
									{stage.items.map((item) => {
										const inputId = `checklist-${item.id}`;
										const isChecked = checked[item.id] === true;
										return (
											<li key={item.id} className="flex flex-wrap items-start gap-x-2 gap-y-1 p-4">
												<input
													id={inputId}
													type="checkbox"
													checked={isChecked}
													onChange={(e) => toggle(item.id, e.target.checked)}
													className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-2 border-slate-300 text-brand-700 focus:ring-2 focus:ring-brand-500"
												/>
												<label
													htmlFor={inputId}
													className="min-w-0 flex-1 text-sm leading-relaxed text-slate-700"
												>
													{item.label}
												</label>
												{item.tentative && (
													<span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-300">
														예정(가안)
													</span>
												)}
											</li>
										);
									})}
								</ul>
							</section>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
