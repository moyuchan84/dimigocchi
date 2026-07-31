/**
 * 면접 타임어택 모드 (UC-05 / FR-5.4). `/interview/timeattack` 에 client:load 로 마운트된다.
 *
 * 상태머신 setup → running → ended. 타이머는 ExamRunner 와 같은 방식으로 시작 시각
 * (Date.now() 기준)에서 남은 시간을 매초 재계산한다 — 단순 setInterval 감소 방식은
 * 탭이 백그라운드에 있을 때 정확도가 떨어져 사용하지 않는다. 시간이 다 되면
 * 자동으로 다음 질문으로 넘어간다(세션 종료가 아님). 이 모드는 소리 내어 말하는
 * 연습이라 답변 텍스트를 캡처하거나 저장하지 않는다.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

import type { InterviewCategoryRef, InterviewCategorySlug, InterviewQuestionRef } from '@lib/taxonomy';

type Phase = 'setup' | 'running' | 'ended';
type Pooled = InterviewQuestionRef & { categoryTitle: string };

interface TimeAttackProps {
	categories: InterviewCategoryRef[];
	questions: Pooled[];
}

const DURATION_PRESETS = [60, 90];
const MIN_SECONDS = 10;
const MAX_SECONDS = 300;

function formatTime(totalSeconds: number): string {
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TimeAttack({ categories, questions }: TimeAttackProps) {
	const [phase, setPhase] = useState<Phase>('setup');
	const [seconds, setSeconds] = useState(60);
	const [scope, setScope] = useState<Set<InterviewCategorySlug>>(
		() => new Set(categories.map((c) => c.slug)),
	);
	const [current, setCurrent] = useState<Pooled | null>(null);
	const [remaining, setRemaining] = useState(seconds);
	const [practicedCount, setPracticedCount] = useState(0);

	const startedAtRef = useRef<number | null>(null);
	const lastIdRef = useRef<string | null>(null);

	const pool = useMemo(() => questions.filter((q) => scope.has(q.category)), [scope, questions]);

	function toggleScope(slug: InterviewCategorySlug) {
		setScope((prev) => {
			const next = new Set(prev);
			if (next.has(slug)) next.delete(slug);
			else next.add(slug);
			return next;
		});
	}

	function pickNext(fromPool: Pooled[]): Pooled {
		if (fromPool.length === 1) return fromPool[0];
		let next: Pooled;
		do {
			next = fromPool[Math.floor(Math.random() * fromPool.length)];
		} while (next.id === lastIdRef.current);
		return next;
	}

	function startQuestion() {
		const q = pickNext(pool);
		lastIdRef.current = q.id;
		setCurrent(q);
		startedAtRef.current = Date.now();
		setRemaining(seconds);
	}

	function handleStart() {
		setPracticedCount(0);
		setPhase('running');
		startQuestion();
	}

	function handleAdvance() {
		setPracticedCount((c) => c + 1);
		startQuestion();
	}

	function handleEnd() {
		setPhase('ended');
	}

	function handleRestart() {
		setPhase('setup');
		setCurrent(null);
		lastIdRef.current = null;
	}

	useEffect(() => {
		if (phase !== 'running') return;

		const tick = () => {
			if (startedAtRef.current === null) return;
			const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
			const left = Math.max(0, seconds - elapsed);
			setRemaining(left);
			if (left <= 0) handleAdvance();
		};

		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [phase, current?.id]);

	if (phase === 'setup') {
		return (
			<div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
				<div>
					<p className="text-sm font-semibold text-slate-900">제한시간</p>
					<div className="mt-2 flex flex-wrap items-center gap-2">
						{DURATION_PRESETS.map((preset) => (
							<button
								key={preset}
								type="button"
								onClick={() => setSeconds(preset)}
								className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
									seconds === preset
										? 'border-brand-300 bg-brand-50 text-brand-700'
										: 'border-slate-300 text-slate-600'
								}`}
							>
								{preset}초
							</button>
						))}
						<label className="flex items-center gap-2 text-sm text-slate-600">
							직접 입력
							<input
								type="number"
								min={MIN_SECONDS}
								max={MAX_SECONDS}
								value={seconds}
								onChange={(e) => {
									const value = Number(e.target.value);
									if (Number.isNaN(value)) return;
									setSeconds(Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, value)));
								}}
								className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-brand-400 focus:outline-none"
							/>
							초
						</label>
					</div>
				</div>

				<div className="mt-5">
					<p className="text-sm font-semibold text-slate-900">출제 범위</p>
					<ul className="mt-2 grid list-none gap-2 p-0 sm:grid-cols-2">
						{categories.map((category) => (
							<li key={category.slug}>
								<label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 p-2.5 text-sm text-slate-700 has-[:checked]:border-brand-300 has-[:checked]:bg-brand-50">
									<input
										type="checkbox"
										checked={scope.has(category.slug)}
										onChange={() => toggleScope(category.slug)}
									/>
									<span>{category.title}</span>
									<span className="ml-auto text-xs text-slate-500">{category.targetCount}문항</span>
								</label>
							</li>
						))}
					</ul>
				</div>

				<button
					type="button"
					onClick={handleStart}
					disabled={pool.length === 0}
					className="mt-5 inline-flex items-center justify-center rounded-md bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
				>
					시작하기
				</button>
				{pool.length === 0 && (
					<p className="mt-2 text-sm text-red-600">카테고리를 하나 이상 선택해 주세요.</p>
				)}
			</div>
		);
	}

	if (phase === 'ended') {
		return (
			<div className="rounded-lg border border-slate-200 bg-white p-5 text-center sm:p-6">
				<p className="text-lg font-semibold text-slate-900">{practicedCount}개 질문을 연습했어요</p>
				<p className="mt-1 text-sm text-slate-600">답변을 더 다듬고 싶다면 카테고리별 화면에서 초안을 작성해 보세요.</p>
				<button
					type="button"
					onClick={handleRestart}
					className="mt-4 inline-flex items-center justify-center rounded-md bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
				>
					다시 시작
				</button>
			</div>
		);
	}

	return (
		<div>
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
				<span className="text-sm font-semibold text-slate-900">연습 {practicedCount}개째</span>
				<span
					className={`font-mono text-lg font-bold tabular-nums ${remaining <= 10 ? 'text-red-600' : 'text-slate-900'}`}
				>
					{formatTime(remaining)}
				</span>
			</div>

			<div className="mt-4 flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-6 text-center sm:p-8">
				<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
					{current?.categoryTitle}
				</span>
				<p className="text-lg font-semibold text-slate-900">{current?.question}</p>
			</div>

			<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
				<button
					type="button"
					onClick={handleAdvance}
					className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
				>
					다음 질문
				</button>
				<button
					type="button"
					onClick={handleEnd}
					className="rounded-md bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
				>
					종료
				</button>
			</div>
		</div>
	);
}
