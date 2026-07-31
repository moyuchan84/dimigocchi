/**
 * 오답노트 (UC-04). `/wrongnote` 에 client:load 로 마운트되며, 영역별 요약 카운트와
 * 오답 목록을 한 아일랜드가 함께 소유한다 — 두 섹션을 따로 만들면 카운트와 실제
 * 목록이 어긋날 수 있어서다.
 *
 * 오답노트는 별도 저장소가 없다 — `examResults[].wrong` 을 순회해 파생한다(FR-4.1).
 * "복습완료"(FR-4.2)는 한 번 정답을 맞히면 계속 유지되는 성취 플래그다: 목록에서
 * 제거하지 않고, 이후 다시 틀리더라도 배지를 되돌리지 않는다("학습 이력 보존").
 */
import { useEffect, useMemo, useState } from 'react';

import { gradeQuestion, type ExamAnswerValue } from '@lib/grading';
import { getExamResults, getWrongNoteReviewed, setWrongNoteReviewed } from '@lib/storage';
import type { ExamQuestion } from '@lib/taxonomy';

import QuestionCard from './QuestionCard';

type FlatQuestion = ExamQuestion & { setId: string; areaTitle: string };

interface WrongNoteListProps {
	allQuestions: FlatQuestion[];
}

interface WrongItem {
	question: FlatQuestion;
	/** 이 문항을 가장 최근에 틀린 날짜(YYYY-MM-DD). */
	date: string;
}

type SortMode = 'recent' | 'area';

export default function WrongNoteList({ allQuestions }: WrongNoteListProps) {
	const [items, setItems] = useState<WrongItem[] | undefined>(undefined);
	const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
	const [sortMode, setSortMode] = useState<SortMode>('recent');
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [retryAnswers, setRetryAnswers] = useState<Record<string, ExamAnswerValue>>({});
	const [feedback, setFeedback] = useState<Record<string, boolean>>({});

	useEffect(() => {
		const results = getExamResults();
		// 문항 id -> 가장 최근 발생일. 응시 결과를 오래된 것부터 순회하며 덮어써서
		// 마지막 값이 자연스럽게 "가장 최근에 틀림"이 되고, 중복도 저절로 사라진다.
		const wrongDateById = new Map<string, string>();
		for (const r of results) {
			for (const qid of r.wrong) {
				wrongDateById.set(qid, r.date);
			}
		}
		const questionById = new Map(allQuestions.map((q) => [q.id, q]));
		const built: WrongItem[] = [];
		for (const [qid, date] of wrongDateById) {
			const question = questionById.get(qid);
			if (question) built.push({ question, date });
		}
		setItems(built);
		setReviewed(getWrongNoteReviewed());
	}, [allQuestions]);

	const sortedItems = useMemo(() => {
		if (!items) return [];
		const copy = [...items];
		if (sortMode === 'recent') {
			copy.sort((a, b) => b.date.localeCompare(a.date));
		} else {
			copy.sort((a, b) => a.question.areaTitle.localeCompare(b.question.areaTitle, 'ko'));
		}
		return copy;
	}, [items, sortMode]);

	const areaCounts = useMemo(() => {
		if (!items) return [];
		const counts = new Map<string, number>();
		for (const item of items) {
			counts.set(item.question.areaTitle, (counts.get(item.question.areaTitle) ?? 0) + 1);
		}
		return [...counts].map(([areaTitle, count]) => ({ areaTitle, count }));
	}, [items]);

	function handleCheck(item: WrongItem) {
		const isCorrect = gradeQuestion(item.question, retryAnswers[item.question.id]);
		setFeedback((prev) => ({ ...prev, [item.question.id]: isCorrect }));
		if (isCorrect) {
			setWrongNoteReviewed(item.question.id, true);
			setReviewed((prev) => ({ ...prev, [item.question.id]: true }));
		}
	}

	if (items === undefined) {
		return <p className="text-sm text-slate-500">불러오는 중...</p>;
	}

	return (
		<div className="space-y-10">
			<section aria-labelledby="summary-heading">
				<h2 id="summary-heading" className="text-lg font-semibold text-slate-900">
					영역별 오답 수
				</h2>
				{areaCounts.length === 0 ? (
					<p className="mt-1 text-sm text-slate-600">아직 오답이 없습니다.</p>
				) : (
					<ul className="mt-4 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
						{areaCounts.map((a) => (
							<li key={a.areaTitle} className="rounded-lg border border-slate-200 bg-white p-4">
								<span className="block text-sm font-semibold text-slate-900">{a.areaTitle}</span>
								<span className="mt-2 block text-2xl font-bold tabular-nums text-slate-900">
									{a.count}
								</span>
							</li>
						))}
					</ul>
				)}
			</section>

			<section aria-labelledby="list-heading">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2 id="list-heading" className="text-lg font-semibold text-slate-900">
						오답 목록
					</h2>
					{items.length > 0 && (
						<div className="flex gap-2 text-sm">
							<button
								type="button"
								onClick={() => setSortMode('recent')}
								className={`rounded-md border px-3 py-1 ${sortMode === 'recent' ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600'}`}
							>
								최근순
							</button>
							<button
								type="button"
								onClick={() => setSortMode('area')}
								className={`rounded-md border px-3 py-1 ${sortMode === 'area' ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600'}`}
							>
								영역별
							</button>
						</div>
					)}
				</div>

				{items.length === 0 ? (
					<div className="mt-4">
						<a
							href="/exam"
							className="group flex flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
						>
							<span className="font-semibold text-slate-900 group-hover:text-brand-700">
								모의고사 시작하기
							</span>
							<span className="mt-2 text-sm text-slate-600">
								영역별 9세트 중 하나를 골라 응시하면 틀린 문항이 이곳에 모입니다.
							</span>
						</a>
					</div>
				) : (
					<ul className="mt-4 list-none space-y-3 p-0">
						{sortedItems.map((item) => {
							const isExpanded = expandedId === item.question.id;
							const isReviewed = reviewed[item.question.id] === true;
							return (
								<li key={item.question.id} className="rounded-lg border border-slate-200 bg-white p-4">
									<div className="flex flex-wrap items-start justify-between gap-3">
										<div>
											<div className="flex flex-wrap items-center gap-2">
												<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
													{item.question.areaTitle}
												</span>
												{isReviewed && (
													<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
														복습완료
													</span>
												)}
												<span className="text-xs text-slate-500">{item.date}</span>
											</div>
											<p className="mt-1 text-sm font-semibold text-slate-900">
												{item.question.question}
											</p>
										</div>
										<button
											type="button"
											onClick={() => setExpandedId(isExpanded ? null : item.question.id)}
											className="shrink-0 rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
										>
											{isExpanded ? '접기' : '다시 풀기'}
										</button>
									</div>

									{isExpanded && (
										<div className="mt-3 space-y-3">
											<QuestionCard
												question={item.question}
												index={1}
												value={retryAnswers[item.question.id]}
												onChange={(value) =>
													setRetryAnswers((prev) => ({ ...prev, [item.question.id]: value }))
												}
											/>
											<div className="flex items-center gap-3">
												<button
													type="button"
													onClick={() => handleCheck(item)}
													className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
												>
													정답 확인
												</button>
												{feedback[item.question.id] !== undefined && (
													<span
														className={`text-sm font-semibold ${feedback[item.question.id] ? 'text-emerald-700' : 'text-red-600'}`}
													>
														{feedback[item.question.id] ? '정답이에요!' : '아직 정답이 아니에요. 해설을 참고해보세요.'}
													</span>
												)}
											</div>
											<p className="text-sm text-slate-600">해설: {item.question.explanation}</p>
										</div>
									)}
								</li>
							);
						})}
					</ul>
				)}
			</section>
		</div>
	);
}
