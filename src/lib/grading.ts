/**
 * 모의고사 채점 로직 (UC-03 / FR-3.4). 순수 함수만 모아둔다 — DOM/React/localStorage 의존 없음.
 */
import type { ExamQuestion } from '@lib/taxonomy';

/**
 * 사용자가 입력한 답. 문항 타입별로 모양이 다르다(정답 스펙인 `ExamQuestion['answer']` 와는 별개):
 * single-choice → 선택한 인덱스, multi-choice → 선택한 인덱스 배열, short-answer → 입력 문자열.
 */
export type ExamAnswerValue = number | number[] | string;

/** trim → 연속 공백 축약 → 소문자화. 단답형 채점과 정답 후보 정규화 양쪽에 동일하게 적용한다. */
export function normalizeShortAnswer(raw: string): string {
	return raw.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** 문항 1개를 채점한다. 미응답(undefined)은 항상 오답 처리한다(스킵/타임아웃 구분 불필요). */
export function gradeQuestion(question: ExamQuestion, userAnswer: ExamAnswerValue | undefined): boolean {
	if (userAnswer === undefined) return false;

	switch (question.type) {
		case 'single-choice':
			return typeof userAnswer === 'number' && userAnswer === question.answer;
		case 'multi-choice': {
			if (!Array.isArray(userAnswer)) return false;
			const given = new Set(userAnswer);
			const correct = new Set(question.answer);
			// 순서 무관 완전 일치 — 부분 점수 없음.
			return given.size === correct.size && [...correct].every((v) => given.has(v));
		}
		case 'short-answer': {
			if (typeof userAnswer !== 'string') return false;
			const normalized = normalizeShortAnswer(userAnswer);
			return question.answer.some((acceptable) => normalizeShortAnswer(acceptable) === normalized);
		}
	}
}

export interface SubcategoryBreakdownEntry {
	subcategory: string;
	correct: number;
	total: number;
}

export interface ExamGradeResult {
	total: number;
	correctCount: number;
	/** 0~100. 문항 수와 무관하게 100점 만점 스케일로 반올림한다. */
	score: number;
	wrongQuestionIds: string[];
	/** area 가 아니라 subcategory 기준 집계 — 종합 모의고사처럼 여러 영역이 섞인 세트에서도 세부 정답률을 보여준다. */
	subcategoryBreakdown: SubcategoryBreakdownEntry[];
}

/** 세트 전체를 채점한다. `answers` 는 문항 id → 사용자가 입력한 답(미응답 문항은 키가 없어도 된다). */
export function gradeExam(
	questions: ExamQuestion[],
	answers: Record<string, ExamAnswerValue | undefined>,
): ExamGradeResult {
	let correctCount = 0;
	const wrongQuestionIds: string[] = [];
	const bySubcategory = new Map<string, { correct: number; total: number }>();

	for (const q of questions) {
		const isCorrect = gradeQuestion(q, answers[q.id]);
		if (isCorrect) {
			correctCount += 1;
		} else {
			wrongQuestionIds.push(q.id);
		}

		const bucket = bySubcategory.get(q.subcategory) ?? { correct: 0, total: 0 };
		bucket.total += 1;
		if (isCorrect) bucket.correct += 1;
		bySubcategory.set(q.subcategory, bucket);
	}

	const total = questions.length;
	return {
		total,
		correctCount,
		score: total === 0 ? 0 : Math.round((correctCount / total) * 100),
		wrongQuestionIds,
		subcategoryBreakdown: [...bySubcategory].map(([subcategory, v]) => ({ subcategory, ...v })),
	};
}
