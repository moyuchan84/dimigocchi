/**
 * D-day 위젯 (UC-06 / FR-6.3). 홈(`/`)과 전형 일정(`/guide/schedule`)에 client:load 로
 * 마운트된다. "가장 임박한 주요 일정"은 오늘 이후(포함) 날짜 중 가장 가까운 이벤트로 정의한다.
 *
 * `date` 는 `YYYY-MM-DD` 형식일 때만 계산 대상이다 — 2027학년도 요강 미확정 기간에는
 * 모든 이벤트의 date 가 "미정" 문자열이라(핵심 원칙 4, 날짜를 추측해 넣지 않는다) 계산 결과가
 * 항상 없음(null)이며, 이 경우 안내 문구로 대체한다. 확정 요강이 JSON 에 실제 날짜로
 * 반영되는 순간부터 이 위젯은 코드 변경 없이 자동으로 D-day 를 계산한다.
 *
 * "오늘"은 화면을 보는 시점의 브라우저 시각이어야 하므로(빌드 시점에 고정하면 배포 이후
 * 정적 HTML 에 박제된다) useEffect 안에서만 계산한다.
 */
import { useEffect, useState } from 'react';

import { computeNearestEvent, type NearestEvent, type ScheduleEventLike } from '@lib/dday';

interface DdayWidgetProps {
	events: ScheduleEventLike[];
}

export default function DdayWidget({ events }: DdayWidgetProps) {
	const [nearest, setNearest] = useState<NearestEvent | null | undefined>(undefined);

	useEffect(() => {
		setNearest(computeNearestEvent(events));
	}, [events]);

	if (nearest === undefined) {
		return <p className="text-sm text-slate-500">불러오는 중...</p>;
	}

	if (nearest === null) {
		return (
			<div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center sm:p-8">
				<p className="text-base font-semibold text-slate-700 sm:text-lg">
					전형 일정 확정 후 D-day가 표시됩니다
				</p>
				<p className="mt-2 text-sm leading-relaxed text-slate-600">
					원서 접수일과 적성검사일이 확정되면, 가장 가까운 일정까지 남은 날짜를 여기에 크게
					보여줍니다.
				</p>
			</div>
		);
	}

	const ddayLabel = nearest.diffDays === 0 ? 'D-DAY' : `D-${nearest.diffDays}`;

	return (
		<div className="rounded-lg border border-brand-200 bg-brand-50 p-6 text-center sm:p-8">
			<p className="text-3xl font-extrabold tabular-nums text-brand-800 sm:text-4xl">{ddayLabel}</p>
			<p className="mt-2 text-base font-semibold text-slate-900">{nearest.label}</p>
			<p className="mt-1 text-sm text-slate-600">
				{nearest.date} · {nearest.status}
			</p>
		</div>
	);
}
