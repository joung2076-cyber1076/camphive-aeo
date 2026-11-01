// ─────────────────────────────────────────────────────────────
//  진단 리포트 샘플 창 (2026-11-01 · 대표 지시 · 제니 지시 「샘플창교체」)
//
//  「진단서 샘플 보기」는 전에 진단 도구에 저장된 실제 캠핑장 진단서
//  (진단 도구의 진단서 기록 주소)로 갔다. 점수와, AI 가 대신
//  추천한 다른 캠핑장의 실명 · 링크가 그대로 보였고 게재 동의 기록이 없었다.
//  그 링크를 끊고 campinghive.kr 운영 진단 쪽 샘플 창과 같은 샘플을 보여 준다
//  — 「검색 · 추천 노출 종합 리포트」 9쪽 중 6쪽, 캠핑장 이름 · 지역 · 기록
//  번호는 검은 띠로 가린 이미지다. 두 사이트가 같은 샘플을 보여 준다.
//  진단 도구 쪽 원본 기록은 지우지도 바꾸지도 않는다 — 링크만 끊었다.
//
//  ⚠ 창은 마크업에 미리 다 들어 있다. enhance.js 는 요소 · 글자를 만들 수
//    없으므로(verify 6-1) 열기 · 넘기기만 한다. 자바스크립트가 없으면 단추가
//    #sample-report 로 이동해 :target 으로 열리고, 6쪽이 세로로 이어 보인다.
//  ⚠ 7~9쪽은 이미지를 두지 않는다. 잠금 쪽은 줄무늬 자리만 흐리게 그린다 —
//    흐림을 걷어내도 읽을 글자가 없다.
//  ⚠ PDF 저장 · 메일 보내기 단추를 두지 않는다(지시 4).
//  ⚠ 창은 <main> 밖에 붙는다. 홈 본문 문장 횟수 대조(verify)는 <main> 안만
//    센다. 홈 시안 스타일 · styles.css 둘 다 건드리지 않으려고 스타일은 창
//    안에 함께 둔다. 색은 승인 색(D12)만 쓴다. 링크 색은 `.sv a.…` 로 적는다 —
//    FAQ 쪽의 `body[class^="p-faq"] a` 가 `.sv-go` 하나보다 세서, 파란 단추 위
//    글자가 파랗게 덮여 안 보였다(2026-11-01 375 실측).
//  ⚠ 소요 시간은 적지 않는다(K4) — 손님 회선에 따라 달라 검증할 수 없다.
// ─────────────────────────────────────────────────────────────

import { assetPath } from './html.mjs';

export const SAMPLE_ID = 'sample-report';

// 진단 신청 길 — 헤더 「무료 진단 받기」 · 진단 쪽 「지금 진단하기」와 같은 곳
const DIAG_TOOL_URL = 'https://camphive-aeo.vercel.app/';

const OPEN_PAGES = 6;
const TOTAL_PAGES = 9;

const STYLE = `<style>
.sv{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.72);box-sizing:border-box}
.sv:target,.sv.is-open{display:flex}
.sv-js .sv:not(.is-open){display:none}
html.sv-open{overflow:hidden}
.sv *{box-sizing:border-box}
.sv-box{width:100%;max-width:760px;max-height:calc(100vh - 32px);display:flex;flex-direction:column;background:#0F1319;border:1px solid rgba(255,255,255,0.09);border-radius:12px;overflow:hidden;color:#C4CCD8;word-break:keep-all;overflow-wrap:break-word}
.sv-head{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid rgba(255,255,255,0.09)}
.sv-kicker{margin:0 0 6px;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.08em;color:#60A5FA}
.sv-title{margin:0;font-size:22px;line-height:1.4;font-weight:900;color:#FFFFFF}
.sv-sub{margin:6px 0 0;font-size:15px;line-height:1.7;color:#C4CCD8}
.sv a.sv-close{flex:none;display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border:1px solid rgba(255,255,255,0.22);border-radius:100px;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;white-space:nowrap}
.sv a.sv-close:hover,.sv a.sv-close:focus-visible{border-color:#3B82F6;color:#60A5FA}
.sv-meta{display:flex;align-items:center;justify-content:flex-end;gap:12px;padding:10px 24px;font-size:14px;color:#8C96A6}
.sv-meta b{color:#FFFFFF}
.sv-bar{display:inline-block;width:96px;height:4px;border-radius:2px;background:#1B212B;overflow:hidden}
.sv-bar i{display:block;width:${((OPEN_PAGES / TOTAL_PAGES) * 100).toFixed(2)}%;height:100%;background:#3B82F6}
.sv-view{position:relative;flex:1;min-height:0;display:flex}
.sv-stage{flex:1;min-height:0;overflow:auto;background:#0B0E13;padding:16px}
.sv-pages{display:grid;gap:24px;justify-items:center}
.sv-slide{margin:0;width:100%;max-width:560px}
.sv-paper{position:relative;background:#FFFFFF;border-radius:4px;overflow:hidden;aspect-ratio:1190/1684}
.sv-paper img{display:block;width:100%;height:auto}
.sv-stamp{position:absolute;top:5%;right:6%;padding:4px 12px;border:2px solid #2563EB;border-radius:4px;background:rgba(255,255,255,0.88);color:#2563EB;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;letter-spacing:0.16em;transform:rotate(-8deg)}
.sv-slide figcaption{margin-top:8px;text-align:center;font-size:13px;color:#8C96A6}
.sv-locked .sv-paper{background:repeating-linear-gradient(180deg,#FFFFFF 0 18px,#C4CCD8 18px 26px);filter:blur(6px);opacity:0.45}
.sv-lockwrap{position:relative}
.sv-gate{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92%,420px);padding:24px;background:#161B22;border:1px solid rgba(255,255,255,0.14);border-radius:12px}
.sv-gate-main{margin:0;font-size:19px;line-height:1.5;font-weight:900;color:#FFFFFF}
.sv-gate-sub{margin:8px 0 0;font-size:14px;line-height:1.6;color:#8C96A6}
.sv-gate-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.sv a.sv-go,.sv a.sv-exit{display:inline-flex;align-items:center;min-height:48px;padding:0 20px;border-radius:100px;font-size:16px;font-weight:700;text-decoration:none}
.sv a.sv-go{background:#2563EB;color:#FFFFFF}
.sv a.sv-exit{border:1px solid rgba(255,255,255,0.22);color:#C4CCD8}
.sv-nav,.sv-dots{display:none}
.sv-js .sv-slide{display:none}
.sv-js .sv-slide.is-on{display:block}
.sv-js .sv-nav{display:flex;align-items:center;justify-content:center;position:absolute;top:50%;z-index:2;width:44px;height:44px;margin-top:-22px;padding:0;border:1px solid rgba(255,255,255,0.22);border-radius:50%;background:#161B22;color:#FFFFFF;font-size:24px;line-height:1;cursor:pointer;font-family:inherit}
.sv-prev{left:12px}
.sv-next{right:12px}
.sv-js .sv-nav:disabled{opacity:0.35;cursor:default}
.sv-js .sv-dots{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;padding:12px 16px 16px;border-top:1px solid rgba(255,255,255,0.09)}
.sv-dot{min-width:40px;min-height:36px;padding:0 10px;border:1px solid rgba(255,255,255,0.14);border-radius:8px;background:transparent;color:#C4CCD8;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
.sv-dot[aria-current="true"]{border-color:#3B82F6;background:#1B212B;color:#FFFFFF}
@media (max-width:480px){
  .sv{padding:8px}
  .sv-box{max-height:calc(100vh - 16px)}
  .sv-head{padding:16px}
  .sv-title{font-size:19px}
  .sv-meta{padding:8px 16px}
  .sv-stage{padding:12px 8px}
  .sv-js .sv-nav{width:40px;height:40px;margin-top:-20px}
  .sv-prev{left:4px}
  .sv-next{right:4px}
  .sv-gate{padding:18px}
  .sv-gate-main{font-size:17px}
}
</style>`;

function openSlide(i) {
  const n = i + 1;
  const src = assetPath(`img/sample/report-anonymous-0${n}.png`);
  return `<figure class="sv-slide${i === 0 ? ' is-on' : ''}" data-sv="${i}">
        <div class="sv-paper"><img src="${src}" alt="진단 리포트 샘플 ${n}쪽(이름 가림)" width="1190" height="1684" loading="lazy" decoding="async">${
          i === 0 ? '<span class="sv-stamp" aria-hidden="true">SAMPLE</span>' : ''
        }</div>
        <figcaption>${n} / ${TOTAL_PAGES}쪽</figcaption>
      </figure>`;
}

/**
 * 샘플 창 마크업. 이 문자열을 받는 쪽에 «진단서 샘플 보기» 단추
 * (`href="#sample-report" data-sample-open`)가 있어야 한다.
 */
export function sampleViewer() {
  const slides = Array.from({ length: OPEN_PAGES }, (_, i) => openSlide(i)).join('\n      ');
  const dots = Array.from(
    { length: OPEN_PAGES },
    (_, i) =>
      `<button type="button" class="sv-dot" data-sv-go="${i}" aria-label="${i + 1}쪽"${i === 0 ? ' aria-current="true"' : ''}>${i + 1}</button>`
  ).join('');

  return `<div class="sv" id="${SAMPLE_ID}" role="dialog" aria-modal="true" aria-labelledby="sv-title">
${STYLE}
<div class="sv-box">
  <div class="sv-head">
    <div>
      <p class="sv-kicker">SAMPLE · AI 노출 진단 종합리포트</p>
      <h2 class="sv-title" id="sv-title">진단 리포트 샘플</h2>
      <p class="sv-sub">실제 리포트 양식 그대로입니다. 캠핑장 이름 · 지역 · 기록 번호는 검은 띠로 가렸습니다.</p>
    </div>
    <a class="sv-close" href="#" aria-label="샘플 창 닫기">닫기 ✕</a>
  </div>
  <div class="sv-meta"><span>공개 <b>${OPEN_PAGES}</b> / 전체 ${TOTAL_PAGES}쪽</span><span class="sv-bar" aria-hidden="true"><i></i></span></div>
  <div class="sv-view">
    <button class="sv-nav sv-prev" type="button" aria-label="이전 쪽" disabled>‹</button>
    <div class="sv-stage">
    <div class="sv-pages">
      ${slides}
      <figure class="sv-slide sv-locked" data-sv="${OPEN_PAGES}">
        <div class="sv-lockwrap">
          <div class="sv-paper" aria-hidden="true"></div>
          <div class="sv-gate">
            <p class="sv-gate-main">여기부터는 우리 캠핑장 기준으로 작성됩니다.</p>
            <p class="sv-gate-sub">${OPEN_PAGES + 1}~${TOTAL_PAGES}쪽은 샘플에서 열지 않습니다 · 무료 진단은 하루 20건까지</p>
            <div class="sv-gate-btns">
              <a class="sv-go" href="${DIAG_TOOL_URL}" target="_blank" rel="noopener" data-ga="diag_sample">진단하고 전체 받기 →</a>
              <a class="sv-exit" href="#">나가기</a>
            </div>
          </div>
        </div>
        <figcaption>${OPEN_PAGES + 1}~${TOTAL_PAGES} / ${TOTAL_PAGES}쪽 · 잠금</figcaption>
      </figure>
    </div>
    </div>
    <button class="sv-nav sv-next" type="button" aria-label="다음 쪽">›</button>
  </div>
  <div class="sv-dots">${dots}<button type="button" class="sv-dot" data-sv-go="${OPEN_PAGES}" aria-label="${OPEN_PAGES + 1}~${TOTAL_PAGES}쪽 잠금">${OPEN_PAGES + 1}–${TOTAL_PAGES} 잠금</button></div>
</div>
</div>`;
}
