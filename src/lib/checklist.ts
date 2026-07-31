/**
 * 준비 체크리스트 데이터 (UC-07 / FR-7.1). 출처: `디미고_입시_준비_가이드.md` 8~9장.
 *
 * THEORY_CATEGORIES(taxonomy.ts)와 같은 이유로 콘텐츠 컬렉션이 아니라 상수로 둔다 —
 * 이 목록은 콘텐츠가 아니라 사이트 UI 문구이고, 항목 수도 적어 파일 추가로 관리할 실익이 없다.
 *
 * 각 항목의 `id` 는 `dimigo-prep:progress.checklist` 의 키다. 한 번 배포되면 사용자 브라우저에
 * 저장된 키와 짝이 맞아야 하므로, 항목 문구를 고치더라도 **id 는 바꾸지 말 것**(순서 변경도 마찬가지 —
 * id 는 배열 인덱스가 아니라 `${stage.id}-${순번}` 으로 고정한다).
 */

export interface ChecklistItem {
	id: string;
	label: string;
	/** 2027학년도 미확정 일정에 의존하는 항목이면 true → "예정(가안)" 배지(핵심 원칙 4) */
	tentative?: boolean;
}

export interface ChecklistStage {
	id: string;
	title: string;
	summary: string;
	items: readonly ChecklistItem[];
}

export const CHECKLIST_STAGES: readonly ChecklistStage[] = [
	{
		id: 'now',
		title: '지금부터 — 방향 정하기',
		summary: '무엇을 준비할지 정하고 기초 학습 습관을 만드는 단계예요.',
		items: [
			{ id: 'now-1', label: '지망 학과(웹프로그래밍 / e-비즈니스 / 디지털콘텐츠 / 해킹방어) 결정하기' },
			{ id: 'now-2', label: '일반전형과 진로적성특별전형 중 어느 쪽으로 지원할지 정하기' },
			{ id: 'now-3', label: '중2·3학년 국·영·수 내신 관리 계획 세우기' },
			{
				id: 'now-4',
				label: '학교 공식 사이트에서 최신 신입생전형요항 PDF 내려받아 정독하기',
			},
			{ id: 'now-5', label: '기초 코딩(파이썬 등) 학습 시작하기' },
		],
	},
	{
		id: 'summer',
		title: '여름방학 — 실력 쌓기',
		summary: '적성검사 대비 학습과 활동 기록을 집중적으로 쌓는 단계예요.',
		items: [
			{ id: 'summer-1', label: 'IT 상식·시사 스크랩 노트 만들기 (AI, 빅데이터, IoT, 개인정보 등)' },
			{ id: 'summer-2', label: '창의사고력 수학·수리추론 문제 꾸준히 풀기' },
			{ id: 'summer-3', label: '해킹방어 기초 이론(정보보호 3요소, 네트워크, 리눅스) 훑어보기' },
			{ id: 'summer-4', label: '입학설명회·학교투어·학과체험교실 참가 신청하기' },
		],
	},
	{
		id: 'before-apply',
		title: '원서 접수 전 — 서류 정리',
		summary: '제출 서류를 빠짐없이 확인하고 실적물을 정리하는 단계예요.',
		items: [
			{ id: 'before-apply-1', label: '확정 전형요항에서 제출 서류와 마감 시각 다시 확인하기' },
			{ id: 'before-apply-2', label: '교과점수계산기로 예상 교과 점수 확인하기' },
			{ id: 'before-apply-3', label: '자기소개서 초안 쓰고 여러 번 고쳐 쓰기' },
			{ id: 'before-apply-4', label: '실적물·포트폴리오(대회, 프로젝트, 활동 기록) 정리하기' },
			{ id: 'before-apply-5', label: '원서 접수 기간·방법 달력에 표시하기' },
		],
	},
	{
		id: 'before-interview',
		title: '면접 직전 — 마무리 점검',
		summary: '말로 설명하는 연습과 당일 준비물을 점검하는 단계예요.',
		items: [
			{ id: 'before-interview-1', label: '지원동기·진로계획 답변을 소리 내어 말해보기' },
			{ id: 'before-interview-2', label: '실적물에 대해 "무엇을, 왜, 어떻게 만들었는지" 설명 연습하기' },
			{ id: 'before-interview-3', label: '최근 보안 시사 이슈 2~3개에 대한 내 생각 정리하기' },
			{ id: 'before-interview-4', label: '면접 일시·장소·준비물 확인하기' },
		],
	},
] as const;

/** 전체 체크리스트 항목 id 목록. 대시보드 진행률(FR-7.2)의 분모로 쓴다. */
export function listChecklistItemIds(): string[] {
	return CHECKLIST_STAGES.flatMap((stage) => stage.items.map((item) => item.id));
}
