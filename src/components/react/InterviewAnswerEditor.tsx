/**
 * 면접 카테고리 1개의 질문 목록 + 답변 작성 화면 (UC-05). `/interview/[category]` 에
 * client:load 로 마운트된다.
 *
 * RecentResults/WrongNoteList 와 같은 SSR 하이드레이션 안전 패턴: 초기 state 는
 * undefined 로 두고 useEffect 에서만 localStorage 를 읽는다. 답변은 입력할 때마다
 * 바로 저장한다(디바운스 없음) — 정적 사이트라 페이지 이탈 시 마지막 입력이
 * 유실되는 것을 막기 위함이며, localStorage 쓰기는 이 규모에서 비용이 무시할 만하다.
 */
import { useEffect, useState } from 'react';

import { getInterviewAnswers, setInterviewAnswer } from '@lib/storage';
import type { InterviewQuestionRef } from '@lib/taxonomy';

import InterviewQuestionCard from './InterviewQuestionCard';

interface InterviewAnswerEditorProps {
	questions: InterviewQuestionRef[];
}

export default function InterviewAnswerEditor({ questions }: InterviewAnswerEditorProps) {
	const [answers, setAnswers] = useState<Record<string, string> | undefined>(undefined);

	useEffect(() => {
		setAnswers(getInterviewAnswers());
	}, []);

	function handleChange(questionId: string, text: string) {
		setAnswers((prev) => ({ ...(prev ?? {}), [questionId]: text }));
		setInterviewAnswer(questionId, text);
	}

	if (answers === undefined) {
		return <p className="text-sm text-slate-500">불러오는 중...</p>;
	}

	return (
		<ol className="list-none space-y-4 p-0">
			{questions.map((q, i) => (
				<li key={q.id}>
					<InterviewQuestionCard
						question={q}
						index={i + 1}
						value={answers[q.id] ?? ''}
						onChange={(text) => handleChange(q.id, text)}
					/>
				</li>
			))}
		</ol>
	);
}
