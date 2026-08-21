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
  // ⚠ COVERS[0] 과 «같아야» 한다. 전개가 실패해 자리표시자로 남는 경우의
  //   대비값이라, 여기만 옛 카피면 그때 폐기한 문장이 화면에 뜬다 (2026-08-21).
  coverLine1: 'AI의 추천 목록에 없다면,',
  coverLine2: '손님의 예약 목록에도 없습니다.',

  // 오프닝 — AI 엔진명 로테이션의 첫 값.
  // 아래 ENGINES[0] 과 같아야 한다. 전개가 실패해 자리표시자로 남는
  // 경우의 대비값이라, 여기만 다른 색이면 그때 시안과 어긋난 색이 뜬다.
  engineColor: '#10A37F',
  engineGlyph: '✺',
  engineName: 'ChatGPT',

  // 히어로 대화 — 타이핑이 끝난 상태의 문장을 그대로 둔다
  typedQ: '가평에 애견 동반 글램핑 추천해줘. 어린이 2명 포함 4인 가족이야.',
  answerStyle: '',
  answerLead: '가평 지역 애견 동반 글램핑 중에서는 다음 세 곳을 추천드려요.',

  // measuredAt 은 없앴다 (2026-08-20, v23 작업 G).
  // 시안이 「측정 2026.08.10 14:20」 이라는 예시 시각을 박아 둔 자리였고,
  // 우리는 측정한 적이 없어 「기준 시점 표기 예정」으로 두고 있었다.
  // 색인이 막혀 있는 동안에는 우리 측정 자체가 시작되지 않는다 — 오지 않을
  // 값을 예정이라 적어 두지 않는다(8.1). 두 자리 모두 문장째 걷어냈다.
  // 실측이 시작되면 그때 값과 함께 되살린다.

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

/**
 * 오프닝의 AI 엔진 배지 — 시안은 2.6초마다 셋을 갈아끼운다.
 *
 * 시안 JS 의 this.engines 와 같은 값이다. 여기서 바꾸면 시안과 어긋난다.
 * 커버 이미지·문구가 3벌을 다 마크업에 두고 is-on 으로만 바꾸는 것과
 * 같은 방식으로 만든다. 그래야 JS 없이도 3사 이름이 소스에 남는다.
 */
const ENGINES = [
  { name: 'ChatGPT', color: '#10A37F', glyph: '✺' },
  { name: 'Claude', color: '#D97757', glyph: '✳' },
  { name: 'Gemini', color: '#4285F4', glyph: '✦' },
];

/**
 * {{ engineGlyph }} · {{ engineName }} 한 벌을 세 벌로 편다.
 *
 * 자리표시자 치환보다 **먼저** 돌아야 한다. 치환이 끝나면 ChatGPT 한 벌만
 * 남아 무엇을 펴야 할지 알 수 없다.
 * 시안 마크업의 인라인 style 은 그대로 옮기고 색만 엔진별 값으로 바꾼다.
 */
function expandEngines(html) {
  const RE =
    /<span style="([^"]*?)color:\{\{\s*engineColor\s*\}\}">\{\{\s*engineGlyph\s*\}\}<\/span>\s*<span style="([^"]*?)color:\{\{\s*engineColor\s*\}\}">\{\{\s*engineName\s*\}\}<\/span>/;
  return html.replace(RE, (m, glyphStyle, nameStyle) =>
    ENGINES.map(
      (e, i) =>
        `<span class="engine-set${i === 0 ? ' is-on' : ''}">` +
        `<span style="${glyphStyle}color:${e.color}">${e.glyph}</span>` +
        `<span style="${nameStyle}color:${e.color}">${e.name}</span>` +
        `</span>`
    ).join('')
  );
}

/**
 * 손님이 AI 에게 치는 질문 — 시안은 셋을 타이핑·삭제로 돌린다.
 *
 * 시안 JS 의 this.qa 와 같은 값이다. q 는 검색창에, lead 는 데모 답변의
 * 첫 줄에 들어가며 둘은 짝이다. 짝이 어긋나면 "계곡 캠핑장" 질문에
 * "애견 동반" 답이 붙는다.
 *
 * 타이핑 효과는 재현하지 않는다. 글자를 한 자씩 만드는 일이라
 * enhance.js 의 "텍스트를 생성하지 않는다" 규칙과 부딪힌다.
 * 완성된 문장 셋을 두고 표시만 바꾼다 — AI 는 질문 셋을 다 읽는다.
 */
const ASKS = [
  {
    q: '가평에 애견 동반 글램핑 추천해줘. 어린이 2명 포함 4인 가족이야.',
    lead: '가평 지역 애견 동반 글램핑 중에서는 다음 세 곳을 추천드려요.',
  },
  {
    q: '서울에서 1시간 안에 갈 만한 계곡 캠핑장 알려줘.',
    lead: '서울에서 1시간 거리 계곡 캠핑장은 다음 세 곳이 있습니다.',
  },
  {
    q: '12월에도 운영하는 온수 잘 나오는 오토캠핑장 있어?',
    lead: '12월에도 운영하는 오토캠핑장은 다음 세 곳입니다.',
  },
];

/**
 * 커버 카피 3벌 — 시안 JS 의 this.cover 와 같은 값이다.
 *
 * 시안은 7초마다 이미지와 카피를 함께 넘긴다(900ms 페이드). 정적 변환에서
 * 그 동작이 빠져 첫 장에 멈춰 있었다. 이미지 3장은 이미 마크업에 있고
 * 카피만 한 벌이라 세 벌로 편다.
 */
const COVERS = [
  ['AI의 추천 목록에 없다면,', '손님의 예약 목록에도 없습니다.'],
  ['검색창 대신 AI에게 묻는 시대,', '사장님의 캠핑장은 답변에 나오고 있습니까?'],
  ['손님은 검색을 멈췄습니다.', '이제 AI에게 어디로 갈지 묻습니다.'],
];

/**
 * 커버에 회전용 표식을 붙인다. 자리표시자 치환보다 먼저.
 *
 *  ① <section id="cover"> 에 data-cover — enhance.js 가 이걸로 커버를 찾는다
 *  ② 이미지 3장에 class="cover-img" — 인라인 opacity({{ img0 }}=1, 나머지 0)는
 *     그대로 둔다. JS 가 없으면 첫 장이 그대로 보여야 한다.
 *  ③ 카피 <p> 한 벌을 세 벌로. 첫 벌만 opacity 1, 나머지는 0.
 *     세 벌 모두 소스에 남으므로 AI 는 카피 3벌을 다 읽는다(관문 ②).
 */
function expandCover(html) {
  let out = html;

  out = out.replace('<section id="cover" ', '<section id="cover" data-cover ');

  out = out.replace(
    /<img src="assets\/hero-ai(-[23])?\.png"/g,
    (m) => m.replace('<img ', '<img class="cover-img" ')
  );

  out = out.replace(
    /<p style="(position:absolute;inset:0;display:flex;flex-direction:column[^"]*?)opacity:\{\{\s*coverOpacity\s*\}\};transform:\{\{\s*coverShift\s*\}\}"><span>\{\{\s*coverLine1\s*\}\}<\/span><span>\{\{\s*coverLine2\s*\}\}<\/span><\/p>/,
    (m, style) =>
      COVERS.map(
        ([a, b], i) =>
          `<p class="cover-line" style="${style}opacity:${i === 0 ? 1 : 0};transform:none">` +
          `<span>${a}</span><span>${b}</span></p>`
      ).join('')
  );

  return out;
}

/** {{ typedQ }} · {{ answerLead }} 를 세 벌로 편다. 자리표시자 치환보다 먼저. */
function expandAsks(html) {
  let out = html;

  // ① 커버 검색창 — <span …>{{ typedQ }}<캐럿></span>
  out = out.replace(
    /<span style="(font-size:17px;line-height:1\.5;[^"]*)">\{\{\s*typedQ\s*\}\}(<span style="display:inline-block;width:2px[^"]*"><\/span>)<\/span>/,
    (m, style, caret) =>
      ASKS.map(
        (a, i) =>
          `<span class="ask-set${i === 0 ? ' is-on' : ''}" style="${style}">${a.q}${caret}</span>`
      ).join('')
  );

  // ② 데모 대화의 질문 말풍선 — <div …>{{ typedQ }}<캐럿></div>
  out = out.replace(
    /<div style="(background:#2E2E2A;[^"]*)">\{\{\s*typedQ\s*\}\}(<span style="display:inline-block;width:2px[^"]*"><\/span>)<\/div>/,
    (m, style, caret) =>
      ASKS.map(
        (a, i) =>
          `<div class="demo-ask${i === 0 ? ' is-on' : ''}" style="${style}">${a.q}${caret}</div>`
      ).join('')
  );

  // ③ 데모 답변 첫 줄 — 질문과 짝이다
  out = out.replace(
    /<p style="(margin:0 0 14px;font-size:16px;[^"]*)">\{\{\s*answerLead\s*\}\}<\/p>/,
    (m, style) =>
      ASKS.map(
        (a, i) =>
          `<p class="demo-lead${i === 0 ? ' is-on' : ''}" style="${style}">${a.lead}</p>`
      ).join('')
  );

  return out;
}

function transform(html) {
  let out = html;

  // ⓪ 엔진 배지·질문·커버 3벌 전개 — 자리표시자 치환보다 먼저
  out = expandEngines(out);
  out = expandAsks(out);
  out = expandCover(out);

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

/**
 * 시안의 <style> · <header> · <main> · <footer> 를 통째로 돌려준다.
 *
 * ⚠ <style> 을 반드시 함께 내보내야 한다. 시안의 @keyframes 22개
 *   (marquee · feedUp · heroDrift · sweepX · blink · pulseDot ·
 *    trackScan · lineSlide · riseIn · coverFlash · vignettePulse ·
 *    scanLine …) 가 전부 이 블록에 있다. 빠뜨리면 인라인 style 의
 *   animation 선언이 가리킬 대상이 없어져 화면이 통째로 정지한다.
 *   2026-08-15 에 실제로 그렇게 배포됐다. 되풀이하지 말 것.
 *
 * 푸터도 시안 것을 쓴다. 우리 footer() 를 붙이면 시안에 없는 블록이
 * 하나 더 생긴다.
 */
/**
 * 홈 FAQ 를 화면 마크업에서 그대로 뽑는다.
 *
 *  2026-08-16 — 화면은 이 시안 파일에서, JSON-LD 는 home.data.mjs 의
 *  s14.items 에서 나오던 시절이 있었다. 시안을 갈아끼울 때 한쪽만 바뀌어
 *  화면에 없는 문항 1개와 문장 2건이 JSON-LD 로 나갔다(Google 구조화
 *  데이터 정책 위반). 검사 26종이 전부 통과인 채로 새고 있었다.
 *
 *  그래서 출처를 하나로 만든다. 화면이 정본이고 JSON-LD 는 그 파생물이다.
 *  transform() 을 거친 뒤의 main 에서 뽑아야 실제 출력과 같다.
 */
function parseFaq(mainHtml) {
  const flat = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return (mainHtml.match(/<details[\s\S]*?<\/details>/g) ?? []).map((d) => {
    const sm = d.match(/<summary[\s\S]*?>([\s\S]*?)<\/summary>/);
    return {
      // 번호 배지(Q1…)는 표기용이라 질문 본문에서 뺀다
      q: flat(sm ? sm[1] : '').replace(/^Q\d+\s*/, ''),
      a: flat(d.replace(/<summary[\s\S]*?<\/summary>/, '')),
    };
  });
}

//  홈 FAQ 최소 문항 수 — 이보다 적으면 빌드를 세운다.
//  0개 검사만 두면 "16개가 15개로 줄어든 경우"를 못 잡는다. 그때는
//  화면·JSON-LD 가 둘 다 15개라 일치 검사도 통과해 버린다.
//  ⚠ 문항을 의도적으로 늘릴 때만 이 값을 올린다.
const MIN_HOME_FAQ = 16;

export async function loadDesign() {
  if (cache) return cache;
  const raw = await readFile(DC, 'utf8');
  const main = transform(slice(raw, '<main', '</main>'));
  const faq = parseFaq(main);

  if (faq.length === 0) {
    throw new Error(
      '홈 FAQ 를 하나도 파싱하지 못했습니다. src/design/home.dc.html 의 ' +
        '<details>/<summary> 구조가 바뀌었는지 확인하십시오. ' +
        'JSON-LD FAQPage 가 통째로 비어 나갑니다.'
    );
  }
  if (faq.length < MIN_HOME_FAQ) {
    throw new Error(
      `홈 FAQ 가 ${faq.length}개입니다. 최소 ${MIN_HOME_FAQ}개여야 합니다. ` +
        '문항이 사라졌는지, 파싱이 일부만 잡았는지 확인하십시오. ' +
        `의도적으로 줄인 것이라면 render-dc.mjs 의 MIN_HOME_FAQ 를 함께 내리십시오.`
    );
  }

  cache = {
    style: slice(raw, '<style>', '</style>'),
    header: transform(slice(raw, '<header', '</header>')),
    main,
    footer: transform(slice(raw, '<footer', '</footer>')),
    faq,
  };
  return cache;
}
