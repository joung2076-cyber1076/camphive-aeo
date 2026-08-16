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
