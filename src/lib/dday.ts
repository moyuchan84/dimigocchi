/**
 * D-day 계산 (UC-06 / FR-6.3). React 쪽(DdayWidget.tsx)이 공유하는 순수 함수다.
 *
 * ⚠️ Header.astro 의 D-day 칩은 이 모듈을 import 하지 않는다 — 그 칩은 `is:inline` 스크립트로
 * 구현돼 있는데(헤더는 의도적으로 React 아일랜드를 쓰지 않는다, Header.astro 설계 메모 참고),
 * `is:inline` 스크립트는 번들러를 거치지 않아 다른 모듈을 import 할 수 없다. 그래서 같은 계산
 * 로직이 그쪽에 자바스크립트로 한 번 더 손으로 적혀 있다(의도적 중복).
 */

export interface ScheduleEventLike {
	label: string;
	date: string;
	status: '예정' | '확정';
}

export interface NearestEvent {
	label: string;
	date: string;
	status: '예정' | '확정';
	diffDays: number;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 오늘 이후(포함) 날짜 중 가장 가까운 이벤트를 찾는다. `date` 가 `YYYY-MM-DD` 형식이 아닌
 * 이벤트(예: "미정")는 계산 대상에서 제외한다 — 날짜를 추측해 넣지 않는다(핵심 원칙 4).
 */
export function computeNearestEvent(
	events: readonly ScheduleEventLike[],
	now: Date = new Date(),
): NearestEvent | null {
	const today = new Date(now);
	today.setHours(0, 0, 0, 0);

	let nearest: NearestEvent | null = null;
	for (const event of events) {
		if (!ISO_DATE_RE.test(event.date)) continue;
		const eventDate = new Date(`${event.date}T00:00:00`);
		const diffDays = Math.round((eventDate.getTime() - today.getTime()) / 86_400_000);
		if (diffDays < 0) continue;
		if (nearest === null || diffDays < nearest.diffDays) {
			nearest = { label: event.label, date: event.date, status: event.status, diffDays };
		}
	}
	return nearest;
}
