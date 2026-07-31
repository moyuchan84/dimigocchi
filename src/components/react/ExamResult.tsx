/**
 * 모의고사 결과·해설 화면 (UC-03 / FR-3.4). `/exam/[setId]/result` 에 client:load 로 마운트된다.
 *
 * localStorage 는 mount 후(useEffect)에만 읽는다 — Astro 는 빌드 타임(Node, window 없음)에
 * 이 아일랜드의 첫 렌더를 미리 만들어 정적 HTML에 심어두므로, 초기 렌더에서 곧바로
 * localStorage 를 읽으면 서버 렌더와 클라이언트 첫 렌더가 어긋난다(hydration mismatch) /
 * 빌드 자체가 깨진다. 저장된 `answers` 만 신뢰하고, 정오답/소분류 정답률은 항상
 * `gradeExam`/`gradeQuestion` 으로 그 자리에서 다시 계산한다(중복 저장 없이 단일 소스 유지).
 */
import { useEffect, useState } from 'react';

import { gradeExam, gradeQuestion } from '@lib/grading';
import { getExamResults, type ExamResultRecord } from '@lib/storage';
import type { ExamQuestion } from '@lib/taxonomy';

import QuestionCard from './QuestionCard';

interface ExamResultProps {
	setId: string;
	questions: ExamQuestion[];
}

function describeCorrectAnswer(question: ExamQuestion): string {
	switch (question.type) {
		case 'single-choice':
			return question.choices[question.answer];
		case 'multi-choice':
			return question.answer.map((i) => question.choices[i]).join(', ');
		case 'short-answer':
			return question.answer[0];
	}
}

export default function ExamResult({ setId, questions }: ExamResultProps) {
	// undefined = 아직 안 읽음(로딩), null = 응시 기록 없음
	const [record, setRecord] = useState<ExamResultRecord | null | undefined>(undefined);

	useEffect(() => {
		const results = getExamResults().filter((r) => r.setId === setId);
		setRecord(results.length > 0 ? results[results.length - 1] : null);
	}, [setId]);

	if (record === undefined) {
		return <p className="text-sm text-slate-500">결과를 불러오는 중입니다...</p>;
	}

	if (record === null) {
		return (
			<div className="rounded-lg border border-slate-200 bg-white p-5">
				<p className="text-sm text-slate-600">아직 이 세트의 응시 기록이 없습니다.</p>
				<a
					href={`/exam/${setId}`}
					className="mt-3 inline-block text-sm font-semibold text-brand-700 underline underline-offset-2"
				>
					모의고사 응시하러 가기
				</a>
			</div>
		);
	}

	const graded = gradeExam(questions, record.answers);

	return (
		<div className="space-y-10">
			<section aria-labelledby="score-summary">
				<h2 id="score-summary" className="text-lg font-bold text-slate-900">
					점수 요약
				</h2>
				<div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
					<p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
						{graded.score}점{' '}
						<span className="text-xl font-semibold text-slate-500 sm:text-2xl">/ 100점</span>
					</p>
					<dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
						<div>
							<dt className="text-sm text-slate-500">정답</dt>
							<dd className="mt-1 text-xl font-bold text-slate-900">{graded.correctCount}</dd>
						</div>
						<div>
							<dt className="text-sm text-slate-500">오답</dt>
							<dd className="mt-1 text-xl font-bold text-slate-900">
								{graded.wrongQuestionIds.length}
							</dd>
						</div>
						<div>
							<dt className="text-sm text-slate-500">총 문항</dt>
							<dd className="mt-1 text-xl font-bold text-slate-900">{graded.total}</dd>
						</div>
						<div>
							<dt className="text-sm text-slate-500">응시일</dt>
							<dd className="mt-1 text-xl font-bold text-slate-900">{record.date}</dd>
						</div>
					</dl>
				</div>
			</section>

			<section aria-labelledby="area-accuracy">
				<h2 id="area-accuracy" className="text-lg font-bold text-slate-900">
					영역별 정답률
				</h2>
				<div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
					<dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{graded.subcategoryBreakdown.map((b) => (
							<div
								key={b.subcategory}
								className="flex items-baseline justify-between gap-4 border-b border-slate-100 pb-3"
							>
								<dt className="text-sm font-semibold text-slate-900">{b.subcategory}</dt>
								<dd className="text-sm text-slate-600">
									{b.correct}/{b.total} ({Math.round((b.correct / b.total) * 100)}%)
								</dd>
							</div>
						))}
					</dl>
				</div>
			</section>

			<section aria-labelledby="explanations">
				<h2 id="explanations" className="text-lg font-bold text-slate-900">
					문항별 해설
				</h2>
				<ol className="mt-4 list-none space-y-4 p-0">
					{questions.map((q, i) => {
						const userAnswer = record.answers[q.id];
						const isCorrect = gradeQuestion(q, userAnswer);
						return (
							<li key={q.id}>
								<QuestionCard question={q} index={i + 1} value={userAnswer} onChange={() => {}} readOnly />
								<p className={`mt-2 text-sm ${isCorrect ? 'text-emerald-700' : 'text-red-600'}`}>
									{isCorrect ? '정답' : `오답 · 정답: ${describeCorrectAnswer(q)}`}
								</p>
								<p className="mt-1 text-sm text-slate-600">해설: {q.explanation}</p>
							</li>
						);
					})}
				</ol>
			</section>

			{graded.wrongQuestionIds.length > 0 && (
				<a
					href="/wrongnote"
					className="group flex flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
				>
					<span className="font-semibold text-slate-900 group-hover:text-brand-700">
						오답노트로 이동
					</span>
					<span className="mt-2 text-sm text-slate-600">
						틀린 문항을 다시 풀고 복습 체크를 남길 수 있어요.
					</span>
				</a>
			)}
		</div>
	);
}
