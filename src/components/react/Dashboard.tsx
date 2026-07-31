/**
 * 홈 학습 대시보드 (UC-01 / FR-1.1 ~ FR-1.4). `/` 에 client:load 로 마운트되며,
 * 진행률 카드·온보딩 안내·추천 학습·최근 오답 요약을 한 아일랜드가 함께 소유한다 —
 * 네 조각 모두 같은 localStorage 스냅샷에서 파생되므로 따로 만들면 서로 어긋날 수 있다
 * (WrongNoteList 와 같은 이유).
 */
import { useEffect, useState } from 'react';

import { getChecklist, getExamResults, getInterviewAnswers, getTheoryProgress } from '@lib/storage';
import type { ExamQuestion, TheoryCategory } from '@lib/taxonomy';

interface ChapterRef {
	id: string;
	category: TheoryCategory;
	title: string;
	categoryTitle: string;
	subcategoryTitle: string;
	estMinutes: number;
}

type FlatExamQuestion = ExamQuestion & { setId: string; areaTitle: string };

interface DashboardProps {
	chapters: ChapterRef[];
	examSetCount: number;
	allExamQuestions: FlatExamQuestion[];
	interviewQuestionIds: string[];
	checklistItemIds: string[];
}

interface Snapshot {
	theory: Record<string, boolean>;
	examResults: ReturnType<typeof getExamResults>;
	interviewAnswers: Record<string, string>;
	checklist: Record<string, boolean>;
}

function pct(done: number, total: number): number {
	return total === 0 ? 0 : Math.round((done / total) * 100);
}

export default function Dashboard({
	chapters,
	examSetCount,
	allExamQuestions,
	interviewQuestionIds,
	checklistItemIds,
}: DashboardProps) {
	const [snapshot, setSnapshot] = useState<Snapshot | undefined>(undefined);

	useEffect(() => {
		setSnapshot({
			theory: getTheoryProgress(),
			examResults: getExamResults(),
			interviewAnswers: getInterviewAnswers(),
			checklist: getChecklist(),
		});
	}, []);

	if (snapshot === undefined) {
		return <p className="text-sm text-slate-500">불러오는 중...</p>;
	}

	const { theory, examResults, interviewAnswers, checklist } = snapshot;

	const aptitudeChapters = chapters.filter((c) => c.category === 'aptitude');
	const hdChapters = chapters.filter((c) => c.category === 'hacking-defense');
	const aptitudeDone = aptitudeChapters.filter((c) => theory[c.id]).length;
	const hdDone = hdChapters.filter((c) => theory[c.id]).length;
	const examAttempted = new Set(examResults.map((r) => r.setId)).size;
	const interviewAnswered = interviewQuestionIds.filter(
		(id) => (interviewAnswers[id] ?? '').trim().length > 0,
	).length;
	const checklistDone = checklistItemIds.filter((id) => checklist[id]).length;

	const cards = [
		{
			label: '적성검사 이론',
			href: '/theory#aptitude',
			percent: pct(aptitudeDone, aptitudeChapters.length),
			meta: `챕터 ${aptitudeDone}/${aptitudeChapters.length}개 완료`,
		},
		{
			label: '해킹방어 이론',
			href: '/theory#hacking-defense',
			percent: pct(hdDone, hdChapters.length),
			meta: `챕터 ${hdDone}/${hdChapters.length}개 완료`,
		},
		{
			label: '모의고사',
			href: '/exam',
			percent: pct(examAttempted, examSetCount),
			meta: `${examAttempted}/${examSetCount}세트 응시`,
		},
		{
			label: '면접 준비',
			href: '/interview',
			percent: pct(interviewAnswered, interviewQuestionIds.length),
			meta: `${interviewAnswered}/${interviewQuestionIds.length}문항 작성`,
		},
		{
			label: '준비 체크리스트',
			href: '/checklist',
			percent: pct(checklistDone, checklistItemIds.length),
			meta: `${checklistDone}/${checklistItemIds.length}개 항목 완료`,
		},
	];

	const hasAnyProgress = cards.some((c) => c.percent > 0);

	const incompleteChapters = chapters.filter((c) => !theory[c.id]).slice(0, 3);

	// 문항 id -> 가장 최근 발생일(WrongNoteList 와 동일한 파생 방식).
	const wrongDateById = new Map<string, string>();
	for (const r of examResults) {
		for (const qid of r.wrong) wrongDateById.set(qid, r.date);
	}
	const questionById = new Map(allExamQuestions.map((q) => [q.id, q]));
	const recentWrong = [...wrongDateById.entries()]
		.sort((a, b) => b[1].localeCompare(a[1]))
		.slice(0, 5)
		.map(([id, date]) => ({ question: questionById.get(id), date }))
		.filter(
			(item): item is { question: FlatExamQuestion; date: string } => item.question !== undefined,
		);

	return (
		<>
			{!hasAnyProgress && (
				<div className="mb-8 rounded-lg border-2 border-brand-200 bg-brand-50 p-4 sm:p-5">
					<p className="font-semibold text-brand-900">아직 학습 기록이 없어요</p>
					<p className="mt-2 text-sm leading-relaxed text-brand-900">
						이론 챕터를 읽고 &ldquo;학습 완료로 표시&rdquo;를 누르거나, 모의고사·면접 답변·체크리스트를
						시작하면 아래 진행률이 채워집니다. 오늘의 추천 학습부터 시작해보세요.
					</p>
				</div>
			)}

			<section aria-labelledby="progress-heading">
				<h2 id="progress-heading" className="text-lg font-semibold text-slate-900">
					학습 진행률
				</h2>
				<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
					{cards.map((card) => (
						<a
							key={card.label}
							href={card.href}
							className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
						>
							<span className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
								{card.label}
							</span>
							<span className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
								{card.percent}%
							</span>
							<span
								aria-hidden="true"
								className="mt-2 block h-2 w-full overflow-hidden rounded-full bg-slate-200"
							>
								<span
									className="block h-full rounded-full bg-brand-600"
									style={{ width: `${card.percent}%` }}
								/>
							</span>
							<span className="mt-auto pt-3 text-xs text-slate-500">{card.meta}</span>
						</a>
					))}
				</div>
			</section>

			<section aria-labelledby="recommend-heading" className="mt-10">
				<h2 id="recommend-heading" className="text-lg font-semibold text-slate-900">
					오늘의 추천 학습
				</h2>
				{incompleteChapters.length === 0 ? (
					<div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
						<p className="text-sm leading-relaxed text-slate-600">
							지금 있는 이론 챕터를 모두 완료했어요! 모의고사로 실력을 점검해보세요.
						</p>
						<p className="mt-3 text-sm">
							<a href="/exam" className="font-semibold text-brand-700 underline underline-offset-2">
								모의고사 보러 가기
							</a>
						</p>
					</div>
				) : (
					<ul className="mt-4 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
						{incompleteChapters.map((chapter) => (
							<li key={chapter.id}>
								<a
									href={`/theory/${chapter.category}/${chapter.id}`}
									className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
								>
									<div className="flex flex-wrap items-start gap-x-2 gap-y-1">
										<span className="font-semibold text-slate-900 group-hover:text-brand-700">
											{chapter.title}
										</span>
										<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
											{chapter.subcategoryTitle}
										</span>
									</div>
									<span className="mt-auto pt-3 text-xs text-slate-500">
										{chapter.categoryTitle} · 약 {chapter.estMinutes}분
									</span>
								</a>
							</li>
						))}
					</ul>
				)}
			</section>

			<section aria-labelledby="wrongnote-heading" className="mt-10">
				<h2 id="wrongnote-heading" className="text-lg font-semibold text-slate-900">
					최근 오답 요약
				</h2>
				<div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
					{recentWrong.length === 0 ? (
						<>
							<p className="text-sm leading-relaxed text-slate-600">
								아직 응시한 모의고사가 없습니다. 모의고사를 풀면 틀린 문항이 자동으로 오답노트에
								모이고, 최근 오답이 여기에 요약됩니다.
							</p>
							<p className="mt-3 text-sm">
								<a href="/exam" className="font-semibold text-brand-700 underline underline-offset-2">
									모의고사 시작하기
								</a>
							</p>
						</>
					) : (
						<ul className="list-none space-y-3 p-0">
							{recentWrong.map(({ question, date }) => (
								<li
									key={question.id}
									className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm"
								>
									<span className="font-medium text-slate-900">{question.question}</span>
									<span className="shrink-0 text-xs text-slate-500">
										{question.areaTitle} · {date}
									</span>
								</li>
							))}
						</ul>
					)}
					<p className="mt-3 text-sm">
						<a href="/wrongnote" className="font-semibold text-brand-700 underline underline-offset-2">
							오답노트 열기
						</a>
					</p>
				</div>
			</section>
		</>
	);
}
