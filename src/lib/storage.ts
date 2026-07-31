/**
 * localStorage 진도 저장소 (요구사양서 7.5). 서버로 전송하지 않는 유일한 저장 위치다.
 *
 * ⚠️ 로드맵 이탈 기록: 이 파일은 원래 P5 산출물로 문서화돼 있었으나, P3 의 모의고사 결과
 * 저장에 최소한의 읽기/쓰기 헬퍼가 당장 필요해 P3 에서 먼저 만든다. `readProgress`/`writeProgress`
 * 는 비공개로 두고, P5 는 이 위에 대시보드 집계용(theory/checklist 등) export 함수를 추가한다.
 */

import type { ExamAnswerValue } from '@lib/grading';

export const STORAGE_KEY = 'dimigo-prep:progress';

/** 모의고사 1회 응시 결과. 요구사양서 7.5 예시(setId/date/score/wrong)에 `answers` 를 확장 필드로 추가했다. */
export interface ExamResultRecord {
	setId: string;
	/** YYYY-MM-DD */
	date: string;
	/** 0~100 */
	score: number;
	/** 오답 문항 id 목록 */
	wrong: string[];
	/** 문항 id → 사용자가 제출한 답. 결과/오답노트 화면이 이 값으로 재채점해 정오답/해설을 재구성한다. */
	answers: Record<string, ExamAnswerValue>;
}

export interface ProgressData {
	theory: Record<string, boolean>;
	checklist: Record<string, boolean>;
	examResults: ExamResultRecord[];
	wrongNoteReviewed: Record<string, boolean>;
	interviewAnswers: Record<string, string>;
}

const EMPTY_PROGRESS: ProgressData = {
	theory: {},
	checklist: {},
	examResults: [],
	wrongNoteReviewed: {},
	interviewAnswers: {},
};

function readProgress(): ProgressData {
	if (typeof window === 'undefined') return { ...EMPTY_PROGRESS };
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...EMPTY_PROGRESS };
		// 얕은 병합 — 아직 쓰이지 않는 P4/P5 필드가 없어도 안전한 기본값을 채운다.
		return { ...EMPTY_PROGRESS, ...JSON.parse(raw) };
	} catch {
		return { ...EMPTY_PROGRESS };
	}
}

function writeProgress(data: ProgressData): void {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** 지금까지의 모의고사 응시 결과를 응시 순서(오래된 것부터)대로 반환한다. */
export function getExamResults(): ExamResultRecord[] {
	return readProgress().examResults;
}

/** 응시 결과 1건을 누적 저장한다(FR-3.5). */
export function appendExamResult(result: ExamResultRecord): void {
	const data = readProgress();
	data.examResults = [...data.examResults, result];
	writeProgress(data);
}

/** 문항 id → 복습완료 여부 맵을 반환한다. */
export function getWrongNoteReviewed(): Record<string, boolean> {
	return readProgress().wrongNoteReviewed;
}

/** 오답노트 문항의 복습완료 상태를 갱신한다(FR-4.2). 목록에서 제거하지 않고 상태만 바꾼다. */
export function setWrongNoteReviewed(questionId: string, reviewed: boolean): void {
	const data = readProgress();
	data.wrongNoteReviewed = { ...data.wrongNoteReviewed, [questionId]: reviewed };
	writeProgress(data);
}

/** 문항 id → 답변 초안 맵 전체를 반환한다. */
export function getInterviewAnswers(): Record<string, string> {
	return readProgress().interviewAnswers;
}

/** 면접 질문 1개의 답변 초안을 저장한다(FR-5.3). */
export function setInterviewAnswer(questionId: string, text: string): void {
	const data = readProgress();
	data.interviewAnswers = { ...data.interviewAnswers, [questionId]: text };
	writeProgress(data);
}
