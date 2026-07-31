/**
 * 문항 1개를 렌더링하고 응답을 캡처하는 순수 프레젠테이션 컴포넌트.
 *
 * 정오답 표시는 이 컴포넌트의 책임이 아니다 — 타이머가 있는 응시 화면(ExamRunner)과
 * 정답을 곧바로 보여줘야 하는 결과/오답노트 재풀이 화면 양쪽에서 재사용하기 위해,
 * "응답을 그리고 캡처하는 것"까지만 하고 피드백 렌더링은 항상 부모가 맡는다.
 */
import type { ExamAnswerValue } from '@lib/grading';
import type { ExamQuestion } from '@lib/taxonomy';

interface QuestionCardProps {
	question: ExamQuestion;
	/** 1부터 시작하는 화면 표시용 번호("Q3"). */
	index: number;
	value: ExamAnswerValue | undefined;
	onChange: (value: ExamAnswerValue) => void;
	/** true 면 입력을 막는다(결과 화면·오답노트에서 지난 응답을 보여줄 때). */
	readOnly?: boolean;
}

export default function QuestionCard({ question, index, value, onChange, readOnly = false }: QuestionCardProps) {
	return (
		<fieldset className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
			<legend className="w-full">
				<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<span className="font-mono text-sm font-semibold text-slate-500">Q{index}</span>
					<span className="text-sm font-semibold text-slate-900">{question.question}</span>
				</div>
			</legend>

			{question.type === 'single-choice' && (
				<div className="mt-3 space-y-2">
					{question.choices.map((choice, i) => (
						<label
							key={i}
							className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-2.5 text-sm text-slate-700 has-[:checked]:border-brand-300 has-[:checked]:bg-brand-50"
						>
							<input
								type="radio"
								name={`q-${question.id}`}
								className="mt-0.5"
								checked={value === i}
								disabled={readOnly}
								onChange={() => onChange(i)}
							/>
							<span>{choice}</span>
						</label>
					))}
				</div>
			)}

			{question.type === 'multi-choice' && (
				<div className="mt-3 space-y-2">
					<p className="text-xs text-slate-500">해당하는 답을 모두 고르세요.</p>
					{question.choices.map((choice, i) => {
						const selected = new Set(Array.isArray(value) ? value : []);
						return (
							<label
								key={i}
								className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-2.5 text-sm text-slate-700 has-[:checked]:border-brand-300 has-[:checked]:bg-brand-50"
							>
								<input
									type="checkbox"
									className="mt-0.5"
									checked={selected.has(i)}
									disabled={readOnly}
									onChange={(e) => {
										const next = new Set(selected);
										if (e.target.checked) next.add(i);
										else next.delete(i);
										onChange([...next].sort((a, b) => a - b));
									}}
								/>
								<span>{choice}</span>
							</label>
						);
					})}
				</div>
			)}

			{question.type === 'short-answer' && (
				<div className="mt-3">
					<input
						type="text"
						className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-400 focus:outline-none"
						placeholder="답을 입력하세요"
						value={typeof value === 'string' ? value : ''}
						disabled={readOnly}
						onChange={(e) => onChange(e.target.value)}
					/>
				</div>
			)}
		</fieldset>
	);
}
