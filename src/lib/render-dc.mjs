// ─────────────────────────────────────────────────────────────
//  시안 그대로 출력 — src/design/home.dc.html 의 마크업을 옮긴다.
//
//  이 파일은 디자인을 "다시 그리지" 않는다. 사장님이 작업하신 시안
//  HTML 을 읽어 그대로 내보낸다. 레이아웃·색·여백·인라인 style 값은
//  한 글자도 바꾸지 않는다.
//
//  바꾸는 것은 딱 네 가지다. 전부 "시안이 디자인 도구 안에서만
//  동작하던 부분"을 정적 HTML 로 만드는 작업이고, 화면에 보이는
//  결과는 시안과 같다.
//
//    ① {{ 자리표시자 }}  → 첫 화면에 보이던 값으로 고정
//    ② onSubmit / sc-if → 제거 (인라인 JS 금지, 제출 후 상태는 초기 화면이 아니다)
//    ③ style-hover      → 제거 (표준 속성이 아니라 브라우저가 무시한다)
//    ④ assets/ 경로     → 저장소의 img/ 로. basePath 를 붙인다
//
//  ⚠ 시안을 고칠 일이 있으면 src/design/home.dc.html 을 고친다.
//    여기서 마크업을 손대지 말 것. 그러면 다시 갈라진다.
// ─────────────────────────────────────────────────────────────

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetPath, pathFor } from './html.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DC = path.join(HERE, '..', 'design', 'home.dc.html');

/**
 * 자리표시자를 첫 화면 값으로 고정한다.
 *
 * 시안은 디자인 도구가 이 값들을 매 프레임 갈아끼웠다. 우리는 첫
 * 화면 값을 HTML 에 박아 두고, 움직임은 enhance.js 가 클래스로만
 * 만든다. 그래야 JS 가 죽어도 글자가 남는다.
 */
const FILL = {
  // 커버 — 첫 장이 보이는 상태
  img0: '1',
  img1: '0',
  img2: '0',
  coverOpacity: '1',
  coverShift: 'none',
  coverLine1: '손님이 고르지 않습니다.',
  coverLine2: 'AI가 먼저 고릅니다.',

  // 오프닝 — AI 엔진명 로테이션의 첫 값
  engineColor: '#3DD6AC',
  engineGlyph: '✺',
  engineName: 'ChatGPT',

  // 히어로 대화 — 타이핑이 끝난 상태의 문장을 그대로 둔다
  typedQ: '가평에 애견 동반 글램핑 추천해줘. 어린이 2명 포함 4인 가족이야.',
  answerStyle: '',
  answerLead: '가평 지역 애견 동반 글램핑 중에서는 다음 세 곳을 추천드려요.',

  // 시안은 「측정 2026.08.10 14:20」 이라는 예시 시각을 박아 뒀다.
  // 측정한 적 없는 시각이라 그대로 쓰지 않는다. 실측 후 교체한다.
  measuredAt: '기준 시점 표기 예정',

  // S03 통계 — 카운트업의 최종값. 소스에는 이 값이 그대로 있어야 한다.
  stat0: '63.5%',
  stat1: '54.5%',
  stat2: '77.2%',
  stat3: '58%↓',

  // S02 강조 문장 — 7초마다 도는 3벌 중 첫 벌
  flashLine: 'AI가 3곳을 골라주는 흐름에 “블로그 상위노출”은 낄 자리가 없습니다.',
  flashColor: '#FFFFFF',
  flashGlow: '0 2px 18px rgba(0,0,0,0.55)',
};

/** 이미지 — PNG 원본 12.47MB 를 고화질 JPEG 1.88MB 로 바꿔 두었다. */
const ASSET_MAP = {
  'assets/hero-ai.png': 'img/hero-ai.jpg',
  'assets/hero-ai-2.png': 'img/hero-ai-2.jpg',
  'assets/hero-ai-3.png': 'img/hero-ai-3.jpg',
  'assets/logo-mark.png': 'img/logo-mark.png',
  'assets/logo-light.png': 'img/logo-light.png',
  'assets/logo-dark.png': 'img/logo-dark.png',
};

function transform(html) {
  let out = html;

  // ① 자리표시자
  out = out.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (m, key) =>
    Object.prototype.hasOwnProperty.call(FILL, key) ? FILL[key] : ''
  );

  // ② 인라인 JS 와 조건부 블록
  //    onSubmit 은 속성째 지운다. sc-if 는 "제출 뒤" 상태라 첫 화면이 아니다.
  out = out.replace(/\s+onSubmit="[^"]*"/gi, '');
  out = out.replace(/<sc-if\b[^>]*>[\s\S]*?<\/sc-if>/gi, '');

  // ③ style-hover — 표준 속성이 아니다. 호버 효과는 styles.css 가 맡는다.
  out = out.replace(/\s+style-hover="[^"]*"/gi, '');

  // ④ 경로
  for (const [from, to] of Object.entries(ASSET_MAP)) {
    out = out.split(`"${from}"`).join(`"${assetPath(to)}"`);
  }
  out = out.split('"상담문의.dc.html"').join(`"${pathFor('contact')}"`);

  // 로고 링크가 #hero 로 가 있다. 홈에서는 맞지만 앵커가 하나 더 필요 없다.
  return out;
}

function slice(html, startTag, endTag) {
  const i = html.indexOf(startTag);
  const j = html.indexOf(endTag);
  if (i < 0 || j < 0) throw new Error(`시안에서 ${startTag} 를 찾지 못했습니다`);
  return html.slice(i, j + endTag.length);
}

let cache = null;

/** 시안의 <header> 와 <main> 을 정적 HTML 로 돌려준다. */
export async function loadDesign() {
  if (cache) return cache;
  const raw = await readFile(DC, 'utf8');
  cache = {
    header: transform(slice(raw, '<header', '</header>')),
    main: transform(slice(raw, '<main', '</main>')),
  };
  return cache;
}
