// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// [P1 조사 기록] @astrojs/react 6.x 는 아일랜드가 하나도 없어도 클라이언트 엔트리
// (react-dom, 약 188KB)를 dist/_astro/client.*.js 로 무조건 방출한다.
// 다만 이 파일을 참조하는 HTML 은 0개이므로 브라우저가 절대 요청하지 않는다
// → 초기 로딩 시간과 Lighthouse 점수에는 영향이 없다(NFR-2 위반 아님).
// 배포물에 죽은 파일 하나가 실려 나가는 것이 유일한 비용이라 통합은 유지한다.
// P3(모의고사 엔진)에서 첫 React 아일랜드를 추가하면 이 엔트리가 실제로 쓰이게 된다.

// https://astro.build/config
export default defineConfig({
	site: 'https://dimigocchi.vercel.app',

	integrations: [react()],

	vite: {
		plugins: [tailwindcss()]
	}
});
