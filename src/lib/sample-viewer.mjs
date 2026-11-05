// ─────────────────────────────────────────────────────────────
//  진단 리포트 샘플 창
//  2026-11-01 첫 판(대표 지시 · 제니 지시 「샘플창교체」)
//  2026-11-02 전면 개편(대표 지시 「진단서 샘플 보기 창 전면 개편」)
//  2026-11-05 새 10쪽 리포트로 쪽 그림을 다시 뽑음(진단 도구 11/4 오전 개편 ·
//             본문 8.3~9.0pt · 옛 9쪽 그림은 본문 약 6.5pt 였음)
//
//  「진단서 샘플 보기」는 전에 진단 도구에 저장된 실제 캠핑장 진단서로
//  갔다. 11/1 에 그 링크를 끊고 이름 가린 샘플 창으로 바꿨는데, 쪽 그림
//  (가로 1,190px)을 창 안에서 약 500px 로 줄여 본문 글자가 약 7px 이었다
//  (제니 실측). 11/2 개편(11/5 새 10쪽으로 다시 뽑음):
//   - 같은 진단(9/26 08:54 실측)의 리포트 10쪽을 운영 진단 도구에서 A4 로
//     다시 뽑아 2배 해상도(가로 2,380px)로 그렸다. 늘린 그림이 아니다.
//     캠핑장 이름 · 지역 · 홈페이지 주소(= 이름) · 기록 번호는 글자를 지우고
//     짙은 띠로 칠한 뒤 그렸다. 쪽 위 머리글의 이름 · 지역은 빼고 날짜만 남겼다.
//   - 공개 9쪽 · 10쪽만 잠금. 10쪽은 가로 300px 로 줄이고 흐린 그림만 둔다 —
//     흐림을 걷어내도 읽을 글자가 없다.
//   - 쪽 폭은 최대 1,100px. 리포트 본문은 A4 기준 8.34~9.02pt 라
//     1,100px 에서 15px 이상이 된다(12px 이상은 857px 이상).
//   - 쪽을 누르면 확대 보기: 데스크톱은 원본 크기(2,380px), 휴대폰은
//     1,700px(본문 18px 이상) · 끌어서 이동 · 휴대폰은 두 손가락 확대도 된다.
//   - 쪽마다 「이 쪽에서 확인하는 것」 한 줄은 HTML 글자로 쪽 아래에 둔다
//     (읽는 동안 창 아래에 붙어 있음). 문장은 실제 쪽 글자와 대조해 맞췄다.
//
//  ⚠ 창은 마크업에 미리 다 들어 있다. enhance.js 는 요소 · 글자를 만들 수
//    없으므로(verify 6-1) 열기 · 넘기기 · 확대만 한다. 「N / 10」 표시도 10개를
//    미리 넣어 두고 하나만 켠다. 자바스크립트가 없으면 단추가
//    #sample-report 로 이동해 :target 으로 열리고 10쪽이 세로로 이어 보이며,
//    쪽을 누르면 원본 그림이 새 탭에서 열린다.
//  ⚠ PDF 저장 · 메일 보내기 단추를 두지 않는다(11/1 지시 4).
//  ⚠ 창은 <main> 밖에 붙는다. 홈 본문 문장 횟수 대조(verify)는 <main> 안만
//    센다. 스타일은 창 안에 함께 둔다(홈 시안 · styles.css 를 건드리지 않음).
//    색은 승인 색(D12)만 쓴다. 링크 색은 `.sv a.…` 로 적는다 — FAQ 쪽의
//    `body[class^="p-faq"] a` 가 `.sv-go` 하나보다 세다(11/1 375 실측).
//  ⚠ 소요 시간은 적지 않는다(K4).
// ─────────────────────────────────────────────────────────────

import { assetPath } from './html.mjs';

export const SAMPLE_ID = 'sample-report';

// 진단 신청 길 — 머리 줄 「무료 진단 신청」 · 쪽 안 「내 캠핑장 AI 노출 무료 진단 신청」과 같은 곳(v66)
const DIAG_TOOL_URL = 'https://camphive-aeo.vercel.app/';

const OPEN_PAGES = 9;
const TOTAL_PAGES = 10;

// 쪽마다 「이 쪽에서 확인하는 것」 — 실제 쪽 글자와 대조(2026-11-02 · 11-05 새 10쪽으로 다시 대조)
//  11/5 새 10쪽: 2쪽 관점 이름이 쪽 원문 「추천 횟수 · 직예약 통로 · 손님 맞춤 정보」로 바뀜 ·
//  3쪽 원문은 「경쟁 캠핑장이 추천되었고」 · 「홈페이지 독해력 19 / 40」 · 1장 끝 「1.4 종합 판단」이
//  4쪽으로 넘어가 4쪽은 3사 답변표(아홉 칸 「미언급」) + 36곳 · 6쪽은 「핵심 추진 전략」 세 갈래 ·
//  옛 9쪽(기대 효과 · 리스크 관리 · 맺음말)이 9 · 10쪽으로 나뉘어 9쪽은 공개, 10쪽(맺음말)만 잠금
const nw = (s) => `<span class="sv-nw">${s}</span>`;
const CAPTIONS = [
  `AI 3사에 9번 물었고, 이 캠핑장 이름은 한 번도 나오지 않았습니다 — 종합 ${nw('19 / 100점')}`,
  `숫자를 읽는 세 가지 관점 — 추천 횟수 · 직예약 통로 · 손님 맞춤 정보`,
  `질문 3건을 3사에 똑같이 물었고, 아홉 번 모두 경쟁 캠핑장이 추천됐습니다 — 언급 ${nw('0 / 9회')} · 홈페이지 독해력 ${nw('19 / 40')}`,
  `3사 답변표 아홉 칸이 모두 「미언급」 — AI가 대신 이름을 올린 36곳 중 10곳은 실재가 확인되지 않았습니다`,
  `홈페이지 7가지 점검 중 4가지가 비어 있습니다 — AI가 읽지 못하는 항목과, 사장님이 직접 고칠 수 있는 과제를 나눴습니다`,
  `핵심 전략 세 갈래 — AI가 읽게 만들고, 손님의 언어로 채우고, 숫자로 확인합니다`,
  `누가 · 무엇을 · 언제까지 고치는지 5단계로 정했습니다 — 기술 점수 ${nw('19점 → 40점')}`,
  `「AI 검색 노출, 언제 되나요?」에 구글 · 마이크로소프트가 공개한 자료 3건으로 답합니다`,
  `기대 효과는 약속이 아니라 재진단 숫자로 확인합니다 — 숫자로 재는 변화 · 구조의 변화 · 리스크 관리`,
  `맺음말과 답변 원문 · 점검 근거 열람 안내는 실제 진단서에서 확인하십시오`,
];

const pad = (n) => String(n).padStart(2, '0');
const pageSrc = (n) => assetPath(`img/sample/report-sample-${pad(n)}.png`);
const thumbSrc = (n) => assetPath(`img/sample/report-sample-thumb-${pad(n)}.webp`);

const STYLE = `<style>
.sv{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.72);box-sizing:border-box}
.sv:target,.sv.is-open{display:flex}
.sv-js .sv:not(.is-open){display:none}
html.sv-open{overflow:hidden}
.sv *{box-sizing:border-box}
.sv-box{position:relative;width:100%;max-width:1200px;height:100%;overflow-y:auto;overscroll-behavior:contain;background:#0F1319;border:1px solid rgba(255,255,255,0.09);border-radius:12px;color:#C4CCD8;word-break:keep-all;overflow-wrap:break-word}
.sv-nw{white-space:nowrap}
.sv-head{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 380px;align-items:end;gap:20px 40px;padding:32px 40px 28px;background:#161B22;border-bottom:1px solid rgba(255,255,255,0.09)}
.sv-kicker{margin:0 0 12px;font-family:'JetBrains Mono',monospace;font-size:15px;letter-spacing:0.08em;color:#60A5FA}
.sv-title{margin:0;font-size:44px;line-height:1.2;font-weight:900;letter-spacing:-0.02em;color:#FFFFFF}
.sv-sub{margin:16px 0 0;max-width:780px;font-size:18px;line-height:1.7;color:#C4CCD8}
.sv-sum{display:flex;align-items:center;gap:12px;margin:18px 0 0;font-size:17px;line-height:1.5;font-weight:800;color:#FFFFFF}
.sv-sum::before{content:"";flex:none;width:32px;height:2px;background:#3B82F6}
.sv-trust{margin:10px 0 0;font-size:15px;line-height:1.6;color:#8C96A6}
.sv a.sv-close{position:absolute;top:20px;right:24px;display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border:1px solid rgba(255,255,255,0.22);border-radius:100px;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;white-space:nowrap}
.sv a.sv-close:hover,.sv a.sv-close:focus-visible{border-color:#3B82F6;color:#60A5FA}
.sv a.sv-close-meta{position:static;min-height:36px;padding:0 14px;font-size:15px}
.sv-guide{margin:0;padding:18px 22px;background:#0F1319;border:1px solid rgba(255,255,255,0.14);border-radius:10px}
.sv-guide-t{margin:0 0 10px;font-size:16px;line-height:1.5;font-weight:800;color:#FFFFFF}
.sv-guide ol{display:grid;gap:6px;margin:0;padding:0;list-style:none}
.sv-guide li{font-size:16px;line-height:1.6;color:#C4CCD8}
.sv-guide b{color:#60A5FA;font-weight:800}
.sv-meta{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 40px;background:#0F1319;border-bottom:1px solid rgba(255,255,255,0.09);font-size:15px;color:#8C96A6}
.sv-at{display:none;font-family:'JetBrains Mono',monospace;font-size:17px;font-weight:700;color:#FFFFFF}
.sv-js .sv-at{display:inline}
.sv-at span{display:none}
.sv-at span.is-on{display:inline}
.sv-opened{display:flex;align-items:center;gap:12px;margin-left:auto}
.sv-opened b{color:#FFFFFF}
.sv-bar{display:inline-block;width:120px;height:6px;border-radius:3px;background:#1B212B;overflow:hidden}
.sv-bar i{display:block;width:${((OPEN_PAGES / TOTAL_PAGES) * 100).toFixed(2)}%;height:100%;background:#3B82F6}
.sv-stage{padding:24px 26px 8px;background:#0B0E13}
.sv-pages{display:grid;gap:40px;justify-items:center}
.sv-slide{margin:0;width:100%;max-width:1100px}
.sv a.sv-paper,.sv-paper{position:relative;display:block;width:100%;background:#FFFFFF;border-radius:4px;overflow:hidden;aspect-ratio:2380/3368;cursor:zoom-in;text-decoration:none}
.sv-paper img{display:block;width:100%;height:auto}
.sv a.sv-paper:focus-visible{outline:3px solid #3B82F6;outline-offset:3px}
.sv-stamp{position:absolute;top:5%;right:6%;padding:4px 12px;border:2px solid #2563EB;border-radius:4px;background:rgba(255,255,255,0.88);color:#2563EB;font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;letter-spacing:0.16em;transform:rotate(-8deg)}
.sv-hint{position:absolute;right:12px;bottom:12px;padding:6px 14px;border-radius:100px;background:#161B22;color:#FFFFFF;font-size:15px;font-weight:700}
.sv-cap{position:sticky;bottom:0;z-index:2;margin:12px 0 0;padding:14px 20px 16px;background:#161B22;border:1px solid rgba(255,255,255,0.14);border-radius:10px}
.sv-cap-k{display:block;margin-bottom:4px;font-size:15px;line-height:1.5;font-weight:700;color:#60A5FA}
.sv-cap-t{display:block;font-size:18px;line-height:1.55;font-weight:700;color:#FFFFFF}
.sv-locked .sv-paper{cursor:default}
.sv-locked .sv-paper img{filter:blur(2px);opacity:0.55}
.sv-gate{position:absolute;left:50%;top:12%;transform:translateX(-50%);width:min(88%,480px);padding:28px;background:#161B22;border:1px solid rgba(255,255,255,0.14);border-radius:12px}
.sv-gate-main{margin:0;font-size:22px;line-height:1.45;font-weight:900;color:#FFFFFF}
.sv-gate-sub{margin:10px 0 0;font-size:16px;line-height:1.6;color:#C4CCD8}
.sv-gate-btns{display:flex;flex-direction:column;gap:10px;margin-top:20px}
.sv a.sv-go,.sv a.sv-exit{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 20px;border-radius:100px;font-size:17px;font-weight:800;text-decoration:none}
.sv a.sv-go{background:#2563EB;color:#FFFFFF}
.sv a.sv-exit{border:1px solid rgba(255,255,255,0.22);color:#C4CCD8;font-weight:700}
.sv-nav,.sv-thumbs,.sv-zoom{display:none}
.sv-js .sv-slide{display:none}
.sv-js .sv-slide.is-on{display:block}
.sv-navs{display:none}
.sv-js .sv-navs{display:block;position:sticky;top:calc(50vh - 42px);z-index:4;height:0}
.sv-js .sv-nav{display:flex;align-items:center;justify-content:center;position:absolute;top:0;width:52px;height:52px;padding:0;border:1px solid rgba(255,255,255,0.22);border-radius:50%;background:#161B22;color:#FFFFFF;font-size:28px;line-height:1;cursor:pointer;font-family:inherit}
.sv-prev{left:-14px}
.sv-next{right:-14px}
.sv-js .sv-nav:disabled{opacity:0.35;cursor:default}
.sv-js .sv-thumbs{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;padding:24px 26px 32px;background:#0B0E13}
.sv-thumb{position:relative;width:64px;padding:0;border:2px solid transparent;border-radius:6px;background:#FFFFFF;color:#FFFFFF;overflow:hidden;cursor:pointer;font-family:inherit}
.sv-thumb img{display:block;width:100%;height:auto}
.sv-thumb span{position:absolute;left:0;right:0;bottom:0;padding:2px 0;background:#161B22;color:#FFFFFF;font-size:15px;line-height:1.4;font-weight:700;text-align:center}
.sv-thumb[aria-current="true"]{border-color:#3B82F6}
.sv-thumb-lock img{opacity:0.55}
.sv.is-zoom .sv-nav{display:none}
.sv.is-zoom .sv-zoom{display:flex;flex-direction:column;position:fixed;inset:0;z-index:10;background:#0B0E13}
.sv-zoom-bar{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;background:#161B22;border-bottom:1px solid rgba(255,255,255,0.09);color:#FFFFFF;font-size:16px;line-height:1.5;font-weight:700}
.sv-zoom-touch{display:none}
.sv-zoom-x{flex:none;min-height:44px;padding:0 18px;border:1px solid rgba(255,255,255,0.22);border-radius:100px;background:transparent;color:#FFFFFF;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit}
.sv-zoom-pane{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;cursor:grab}
.sv-zoom-pane.is-drag{cursor:grabbing;user-select:none}
.sv-zimg{display:none;width:2380px;max-width:none;height:auto;margin:0 auto;background:#FFFFFF;-webkit-user-drag:none}
.sv-zimg.is-on{display:block}
@media (hover:none){
  .sv-zoom-mouse{display:none}
  .sv-zoom-touch{display:inline}
  .sv-zoom-pane{cursor:default}
}
@media (max-width:960px){
  .sv-head{grid-template-columns:minmax(0,1fr);align-items:start}
  .sv-head > div:first-child{padding-right:96px}
}
@media (max-width:768px){
  .sv-zimg{width:1700px}
}
@media (max-width:640px){
  .sv{padding:0}
  .sv-box{border:0;border-radius:0}
  .sv-head{gap:16px 12px;padding:20px 16px 18px}
  .sv-head > div:first-child{padding-right:0}
  .sv .sv-head > a.sv-close{display:none}
  .sv-kicker{margin-bottom:8px}
  .sv-title{font-size:30px}
  .sv-sub{margin-top:12px;font-size:16px}
  .sv-sum{align-items:flex-start;font-size:16px}
  .sv-sum::before{margin-top:12px;width:24px}
  .sv-guide{padding:14px 16px}
  .sv-meta{padding:10px 16px}
  .sv-bar{width:72px}
  .sv-stage{padding:16px 12px 8px}
  .sv-pages{gap:28px}
  .sv-hint{right:8px;bottom:8px;padding:4px 10px}
  .sv-cap{padding:12px 14px 14px}
  .sv-cap-t{font-size:16px}
  .sv-js .sv-navs{top:calc(50vh - 20px)}
  .sv-js .sv-nav{width:40px;height:40px;font-size:22px}
  .sv-prev{left:-6px}
  .sv-next{right:-6px}
  .sv-gate{top:5%;width:92%;padding:18px}
  .sv-gate-main{font-size:18px}
  .sv-gate-sub{font-size:15px}
  .sv a.sv-go,.sv a.sv-exit{min-height:46px;font-size:16px}
  .sv-js .sv-thumbs{gap:8px;padding:20px 12px 28px}
  .sv-thumb{width:48px}
}
</style>`;

function caption(n) {
  const lock = n > OPEN_PAGES;
  return `<figcaption class="sv-cap"><span class="sv-cap-k">${n} / ${TOTAL_PAGES}쪽${
    lock ? ' · 잠금' : ''
  } · 이 쪽에서 확인하는 것</span><span class="sv-cap-t">${CAPTIONS[n - 1]}</span></figcaption>`;
}

function openSlide(i) {
  const n = i + 1;
  return `<figure class="sv-slide${i === 0 ? ' is-on' : ''}" data-sv="${i}">
        <a class="sv-paper" href="${pageSrc(n)}" target="_blank" rel="noopener" data-sv-zoom="${i}" aria-label="${n}쪽 크게 보기"><img src="${pageSrc(n)}" alt="진단 리포트 샘플 ${n}쪽(캠핑장 이름 · 지역 · 기록 번호 가림)" width="2380" height="3368" loading="lazy" decoding="async">${
          i === 0 ? '<span class="sv-stamp" aria-hidden="true">SAMPLE</span>' : ''
        }<span class="sv-hint" aria-hidden="true">눌러서 크게 보기</span></a>
        ${caption(n)}
      </figure>`;
}

function lockedSlide() {
  const n = TOTAL_PAGES;
  return `<figure class="sv-slide sv-locked" data-sv="${n - 1}">
        <div class="sv-paper"><img src="${assetPath('img/sample/report-sample-10-locked.webp')}" alt="" width="300" height="425" loading="lazy" decoding="async">
          <div class="sv-gate">
            <p class="sv-gate-main">여기부터는 우리 캠핑장 기준으로 작성됩니다.</p>
            <p class="sv-gate-sub">${n}쪽은 샘플에서 열지 않습니다 · 무료 진단은 하루 20건까지</p>
            <div class="sv-gate-btns">
              <a class="sv-go" href="${DIAG_TOOL_URL}" target="_blank" rel="noopener" data-ga="diag_sample">내 캠핑장 AI 노출 무료 진단 신청</a>
              <a class="sv-exit" href="#">나가기</a>
            </div>
          </div>
        </div>
        ${caption(n)}
      </figure>`;
}

/**
 * 샘플 창 마크업. 이 문자열을 받는 쪽에 «진단서 샘플 보기» 단추
 * (`href="#sample-report" data-sample-open`)가 있어야 한다.
 */
export function sampleViewer() {
  const slides = Array.from({ length: OPEN_PAGES }, (_, i) => openSlide(i)).join('\n      ');
  const ats = Array.from(
    { length: TOTAL_PAGES },
    (_, i) => `<span${i === 0 ? ' class="is-on"' : ''}>${i + 1} / ${TOTAL_PAGES}</span>`
  ).join('');
  const thumbs = Array.from({ length: TOTAL_PAGES }, (_, i) => {
    const n = i + 1;
    const lock = n > OPEN_PAGES;
    return `<button type="button" class="sv-thumb${lock ? ' sv-thumb-lock' : ''}" data-sv-go="${i}" aria-label="${n}쪽${lock ? ' 잠금' : ''}"${
      i === 0 ? ' aria-current="true"' : ''
    }><img src="${thumbSrc(n)}" alt="" width="120" height="170" loading="lazy" decoding="async"><span>${lock ? '잠금' : n}</span></button>`;
  }).join('');
  const zimgs = Array.from(
    { length: OPEN_PAGES },
    (_, i) =>
      `<img class="sv-zimg" data-sv-z="${i}" src="${pageSrc(i + 1)}" alt="진단 리포트 샘플 ${i + 1}쪽 확대" width="2380" height="3368" loading="lazy" decoding="async" draggable="false">`
  ).join('');

  return `<div class="sv" id="${SAMPLE_ID}" role="dialog" aria-modal="true" aria-labelledby="sv-title">
${STYLE}
<div class="sv-box">
  <div class="sv-head">
    <div>
      <p class="sv-kicker">SAMPLE · AI 노출 진단 종합리포트</p>
      <h2 class="sv-title" id="sv-title">질문 9번, 언급 0번.</h2>
      <p class="sv-sub">손님처럼 ChatGPT · Claude · Gemini에 직접 물어본 결과를 10쪽 리포트로 정리합니다. 어디서 빠졌는지, 누가 그 자리를 차지했는지, 무엇부터 고칠지까지 — 실제 양식 그대로 9쪽을 공개합니다.</p>
      <p class="sv-sum">대행사 견적서보다 먼저 보셔야 할 10쪽 · 진단 신청 시 무료</p>
      <p class="sv-trust">실제 캠핑장 진단서에서 이름 · 지역 · 기록 번호만 가렸습니다.</p>
    </div>
    <a class="sv-close" href="#" aria-label="샘플 창 닫기">닫기 ✕</a>
    <div class="sv-guide">
      <p class="sv-guide-t">AI를 처음 접하시는 사장님께 — 이렇게 보십시오</p>
      <ol>
        <li>① <b>1쪽</b> — 손님이 AI에게 물었을 때 우리 캠핑장이 나오는지 점수로 봅니다</li>
        <li>② <b>3~5쪽</b> — 왜 안 나오는지, 누가 그 자리를 차지했는지 봅니다</li>
        <li>③ <b>6~8쪽</b> — 무엇부터, 누가 고칠지, 반영까지 얼마나 걸리는지 봅니다</li>
      </ol>
    </div>
  </div>
  <div class="sv-meta"><span class="sv-at" aria-live="polite">${ats}</span><span class="sv-opened">공개 <b>${OPEN_PAGES}</b> / ${TOTAL_PAGES}쪽<span class="sv-bar" aria-hidden="true"><i></i></span></span><a class="sv-close sv-close-meta" href="#" aria-label="샘플 창 닫기">닫기 ✕</a></div>
  <div class="sv-stage">
    <div class="sv-navs"><button class="sv-nav sv-prev" type="button" aria-label="이전 쪽" disabled>‹</button><button class="sv-nav sv-next" type="button" aria-label="다음 쪽">›</button></div>
    <div class="sv-pages">
      ${slides}
      ${lockedSlide()}
    </div>
  </div>
  <div class="sv-thumbs">${thumbs}</div>
  <div class="sv-zoom" role="dialog" aria-modal="true" aria-label="샘플 쪽 확대 보기">
    <div class="sv-zoom-bar"><span><span class="sv-zoom-mouse">확대 보기 — 끌어서 움직이세요</span><span class="sv-zoom-touch">확대 보기 — 손가락으로 밀고, 두 손가락으로 더 키우세요</span></span><button type="button" class="sv-zoom-x">닫기 ✕</button></div>
    <div class="sv-zoom-pane">${zimgs}</div>
  </div>
</div>
</div>`;
}
