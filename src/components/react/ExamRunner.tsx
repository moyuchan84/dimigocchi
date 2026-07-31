/**
 * 모의고사 응시 화면 (UC-03). `/exam/[setId]` 에 client:load 로 마운트된다.
 *
 * intro → running 상태머신. running 에서는 시작 시각 기준으로 남은 시간을 계산해
 * 0이 되면 자동 제출한다(FR-3.3, 미응답 문항은 오답 처리). 제출은 채점 후 결과를
 * localStorage 에 저장하고 `/exam/{setId}/result` 로 이동한다.
 *
 * localStorage 는 제출 시(사용자 액션 이후)에만 쓰므로, 다른 아일랜드와 달리
 * "초기 렌더는 로딩 상태로" 가드가 필요 없다 — 읽어서 렌더하는 게 아니라 쓰기만 한다.
 */
import { useEffect, useRef, useState } from 'react';

import { gradeExam, type ExamAnswerValue } from '@lib/grading';
import { appendExamResult } from '@lib/storage';
import type { ExamQuestion } from '@lib/taxonomy';

import QuestionCard from './QuestionCard';

interface ExamRunnerProps {
	setId: string;
	limitMinutes: number;
	questions: ExamQuestion[];
}

function formatTime(totalSeconds: number): string {
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

function todayISODate(): string {
	return new Date().toISOString().slice(0, 10);
}

export default function ExamRunner({ setId, limitMinutes, questions }: ExamRunnerProps) {
	const [phase, setPhase] = useState<'intro' | 'running'>('intro');
	const [current, setCurrent] = useState(0);
	const [answers, setAnswers] = useState<Record<string, ExamAnswerValue>>({});
	const [remainingSeconds, setRemainingSeconds] = useState(limitMinutes * 60);

	const answersRef = useRef(answers);
	answersRef.current = answers;
	const submittedRef = useRef(false);
	const startedAtRef = useRef<number | null>(null);

	function handleSubmit() {
		if (submittedRef.current) return;
		submittedRef.current = true;

		const graded = gradeExam(questions, answersRef.current);
		appendExamResult({
			setId,
			date: todayISODate(),
			score: graded.score,
			wrong: graded.wrongQuestionIds,
			answers: answersRef.current,
		});
		window.location.assign(`/exam/${setId}/result`);
	}

	function handleStart() {
		startedAtRef.current = Date.now();
		setPhase('running');
	}

	useEffect(() => {
		if (phase !== 'running') return;

		const tick = () => {
			if (startedAtRef.current === null) return;
			const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
			const remaining = Math.max(0, limitMinutes * 60 - elapsed);
			setRemainingSeconds(remaining);
			if (remaining <= 0) handleSubmit();
		};

		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [phase]);

	function handleAnswerChange(questionId: string, value: ExamAnswerValue) {
		setAnswers((prev) => ({ ...prev, [questionId]: value }));
	}

	if (phase === 'intro') {
		return (
			<div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
				<p className="text-sm leading-relaxed text-slate-600">
					시작하면 타이머가 바로 카운트다운됩니다. 제한 시간이 끝나면 자동으로 제출되고, 그때까지
					답하지 않은 문항은 오답으로 채점됩니다.
				</p>
				<button
					type="button"
					onClick={handleStart}
					className="mt-4 inline-flex items-center justify-center rounded-md bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
				>
					시작하기
				</button>
			</div>
		);
	}

	const question = questions[current];
	const isLast = current === questions.length - 1;
	const answeredCount = Object.keys(answers).length;

	return (
		<div>
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
				<span className="text-sm font-semibold text-slate-900">
					{current + 1} / {questions.length}문항 · 응답 {answeredCount}개
				</span>
				<span
					className={`font-mono text-lg font-bold tabular-nums ${remainingSeconds <= 60 ? 'text-red-600' : 'text-slate-900'}`}
				>
					{formatTime(remainingSeconds)}
				</span>
			</div>

			<div className="mt-4">
				<QuestionCard
					question={question}
					index={current + 1}
					value={answers[question.id]}
					onChange={(value) => handleAnswerChange(question.id, value)}
				/>
			</div>

			<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setCurrent((i) => Math.max(0, i - 1))}
						disabled={current === 0}
						className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
					>
						이전
					</button>
					<button
						type="button"
						onClick={() => setCurrent((i) => Math.min(questions.length - 1, i + 1))}
						disabled={isLast}
						className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
					>
						다음
					</button>
				</div>
				<button
					type="button"
					onClick={handleSubmit}
					className="rounded-md bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
				>
					제출하기
				</button>
			</div>
		</div>
	);
}
