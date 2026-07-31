/**
 * 면접 질문 1개를 렌더링하고 답변 초안을 캡처하는 순수 프레젠테이션 컴포넌트.
 *
 * QuestionCard(모의고사)와 같은 역할 분리 원칙 — localStorage 접근은 여기서 하지 않고
 * value/onChange 로만 상태를 주고받는다. 저장 오케스트레이션은 부모(InterviewAnswerEditor)가 맡는다.
 */
import type { InterviewQuestionRef } from '@lib/taxonomy';

interface InterviewQuestionCardProps {
	question: InterviewQuestionRef;
	/** 1부터 시작하는 화면 표시용 번호("Q3"). */
	index: number;
	value: string;
	onChange: (text: string) => void;
}

export default function InterviewQuestionCard({
	question,
	index,
	value,
	onChange,
}: InterviewQuestionCardProps) {
	return (
		<fieldset className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
			<legend className="w-full">
				<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<span className="font-mono text-sm font-semibold text-slate-500">Q{index}</span>
					<span className="text-sm font-semibold text-slate-900">{question.question}</span>
				</div>
			</legend>

			<dl className="mt-3 space-y-2 text-sm">
				<div>
					<dt className="font-semibold text-slate-700">출제 의도</dt>
					<dd className="mt-0.5 text-slate-600">{question.intent}</dd>
				</div>
				<div>
					<dt className="font-semibold text-slate-700">답변 가이드</dt>
					<dd className="mt-0.5 text-slate-600">{question.answerGuide}</dd>
				</div>
			</dl>

			<div className="mt-3">
				<label htmlFor={`answer-${question.id}`} className="sr-only">
					내 답변
				</label>
				<textarea
					id={`answer-${question.id}`}
					className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-400 focus:outline-none"
					rows={5}
					placeholder="결론 → 근거 → 경험사례 순서로 답변을 작성해 보세요."
					value={value}
					onChange={(e) => onChange(e.target.value)}
				/>
				<p className="mt-1 text-right text-xs text-slate-500">{value.length}자</p>
			</div>
		</fieldset>
	);
}
