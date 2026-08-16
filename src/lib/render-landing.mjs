// ─────────────────────────────────────────────────────────────
//  홈 랜딩 렌더러 — 16섹션
//
//  카피는 src/content/home.data.mjs 에 있고 여기서는 구조만 만든다.
//  모든 문자열은 HTML에 그대로 박힌다. JS로 그리는 텍스트는 하나도 없다.
//
//  섹션 순서: 01 히어로 / 앵커목차 / 핵심답변 / 02 / 03 / 04 / 05 / CTA① /
//            06 / 07 / 08 / 09 / CTA② / 10 / 11 / 12 / 13 / CTA③ / 13.5 /
//            14 / 15
// ─────────────────────────────────────────────────────────────

import { esc, pathFor, assetPath } from './html.mjs';
import { LANDING as L } from '../content/home.data.mjs';

/**
 * 진입 페이드 표식.
 *
 * ⚠ class 와 style 을 여기서 함께 만들어야 한다. 예전에는 이 함수가
 *   class="reveal" 만 돌려주고 호출부에 class="card" 가 따로 있었다.
 *   그러면 한 태그에 class 가 두 번 나오고 브라우저는 뒤쪽을 버린다.
 *   → reveal 이 104곳에서 조용히 죽어 있었다. 합쳐서 한 번만 내보낸다.
 *
 * @param {number|null} i  격자 안 순서. 0.08s 씩 밀어 시차를 준다.
 * @param {string} cls     이 요소가 원래 갖는 클래스
 * @param {string} style   이 요소가 원래 갖는 인라인 스타일
 */
const rv = (i, cls = '', style = '') => {
  const cn = cls ? `${cls} reveal` : 'reveal';
  const d = i == null ? '' : `--d:${(i * 0.08).toFixed(2)}s`;
  const parts = [style, d].filter(Boolean).join(';');
  return `class="${cn}"${parts ? ` style="${parts}"` : ''}`;
};

/* 이미지 자리표시 — 미완성이 아니라 "여기에 들어간다"로 읽히게 한다. */
const imageSlot = (n) => `<div class="block-thumb"><span>IMAGE ${n} / 16:10</span></div>`;

/* ── 00 커버 ───────────────────────────────────────────────────
   시안 S00. 배경 이미지 3장 + 카피 3벌이 7초마다 함께 넘어간다.

   구조가 시안과 다른 곳이 한 군데 있다. 시안은 <p> 하나의 글자를
   JS 로 갈아끼우지만, 여기서는 <p> 3개를 겹쳐 두고 is-on 클래스로
   투명도만 바꾼다. 화면 결과는 같고, 카피 3벌이 전부 소스에 남는다.
   JS 가 죽거나 크롤러가 실행하지 않으면 첫 벌이 그대로 보인다.

   이미지는 시안과 동일하게 3장을 겹쳐 두고 opacity 로만 바꾼다.
   ------------------------------------------------------------ */
function cover(c) {
  const imgs = c.images
    .map(
      (im, i) =>
        // lazy 를 쓰지 않는다. 셋 다 21초 안에 화면에 오르는 데다
        // opacity:0 인 요소는 브라우저가 로드를 미뤄, 교체 순간
        // 아직 안 받아진 빈 이미지가 뜬다. (2026-08-15 실제로 그랬다)
        `<img class="cover-img${i === 0 ? ' is-on' : ''}" src="${assetPath(im.src)}"` +
        ` alt="${esc(im.alt)}" style="--drift:${im.drift}s"` +
        ` fetchpriority="${i === 0 ? 'high' : 'low'}" decoding="async">`
    )
    .join('\n    ');

  const lines = c.lines
    .map(
      (pair, i) =>
        `<p class="cover-line${i === 0 ? ' is-on' : ''}">` +
        `<span>${esc(pair[0])}</span><span>${esc(pair[1])}</span></p>`
    )
    .join('\n        ');

  return `<section class="cover" data-cover>
  <div class="cover-media" aria-hidden="true">
    ${imgs}
  </div>
  <div class="cover-scrim" aria-hidden="true"></div>
  <div class="cover-glow" aria-hidden="true"></div>
  <div class="cover-sweep cover-sweep-a" aria-hidden="true"></div>
  <div class="cover-sweep cover-sweep-b" aria-hidden="true"></div>
  <div class="cover-vignette" aria-hidden="true"></div>
  <div class="cover-scan" aria-hidden="true"></div>
  <div class="cover-inner">
    <div class="cover-stage">
      <div class="cover-lines">
        ${lines}
      </div>
    </div>
  </div>
</section>`;
}

/* ── 01 히어로 ─────────────────────────────────────────────────
   시안 S01. 좌 1.05fr / 우 0.95fr.

   ⚠ 구 디자인의 오렌지 지구본 SVG(globeSvg)는 2026-08-15 폐기했다.
     시안에 없는 요소다. 되살리지 말 것. */
function hero(h) {
  const chips = h.chips
    .map(
      (c) =>
        `<span class="ai-chip ai-chip-${c.tone}">` +
        `<span class="ai-chip-glyph" aria-hidden="true">${esc(c.glyph)}</span>${esc(c.name)}</span>`
    )
    .join('\n        ');

  const items = h.chat.items
    .map(
      (it) =>
        `<li><span class="num">${esc(it.n)}</span><span>${esc(it.name)}</span></li>`
    )
    .join('\n            ');

  const liveRows = h.live.rows
    .map(
      (r, i) =>
        `<div class="live-row">
            <span class="live-name live-${r.tone}">${esc(r.name)}</span>
            <span class="live-track"><span class="live-scan" style="--lag:${(i * 0.35).toFixed(2)}s"></span></span>
            <span class="live-val" style="--lag:${(i * 0.35).toFixed(2)}s">${esc(r.value)}</span>
          </div>`
    )
    .join('\n          ');

  return `<section class="hero" id="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p ${rv(0, 'eyebrow')}><span class="eyebrow-bar" aria-hidden="true"></span>${esc(h.eyebrow)}</p>
      <div ${rv(1, 'ai-chips')}>
        ${chips}
        <span class="ai-chip-note">${esc(h.chipsNote)}</span>
      </div>
      <h1 ${rv(2)}>${esc(h.h1[0])}<br>${esc(h.h1[1])}</h1>
      <p ${rv(3, 'hero-lead')}>${esc(h.leadHead)} <strong class="mark">${esc(h.leadMark)}</strong></p>
      <div ${rv(4, 'hero-cta')}>
        <a class="btn btn-primary" href="#diagnose">${esc(h.ctaPrimary)} <span class="btn-arrow" aria-hidden="true">▸</span></a>
        <a class="btn btn-secondary" href="#report">${esc(h.ctaSecondary)}</a>
      </div>
      <!-- 【실측 확인 필요】 "15초" — 진단 도구 실제 소요시간 측정 후 확정 -->
      <p ${rv(5, 'hero-note')}>${esc(h.note)}</p>
    </div>

    <div ${rv(2, 'chat-card')}>
      <div class="chat-head">
        <span class="chat-title">${esc(h.chat.title)}</span>
        <span class="chat-meta">${esc(h.chat.meta)}</span>
      </div>
      <div class="chat-ask">
        <p class="chat-q">${esc(h.chat.question)}<span class="caret" aria-hidden="true"></span></p>
      </div>
      <div class="chat-reply">
        <p class="chat-a">${esc(h.chat.answer)}</p>
        <ul class="chat-list">
            ${items}
        </ul>
        <div class="chat-missing">
          <b>✕ ${esc(h.chat.missingLabel)}</b>
          <span>${esc(h.chat.missingText)}</span>
        </div>
      </div>
      <p class="chat-foot">${esc(h.chat.foot)}</p>

      <div class="live-panel">
        <div class="live-head">
          <span class="live-label">${esc(h.live.label)}</span>
          <span class="live-badge"><span class="live-dot" aria-hidden="true"></span>${esc(h.live.badge)}</span>
        </div>
        <div class="live-rows">
          ${liveRows}
        </div>
        <p class="live-note">${esc(h.live.note)}</p>
      </div>
    </div>
  </div>
</section>`;
}

/* ── 01b 흐름 띠 ───────────────────────────────────────────────
   시안의 marquee. 같은 문장을 두 벌 이어 붙여 끊김 없이 흐르게 한다.
   두 번째 벌은 시각 장치일 뿐이라 aria-hidden 으로 빼, 스크린리더가
   같은 문장을 두 번 읽지 않게 한다. */
function marquee(text) {
  const strip = `<span class="marquee-item">${esc(text)} · </span>`;
  return `<div class="marquee-band">
  <div class="marquee-track">
    ${strip}
    <span class="marquee-item" aria-hidden="true">${esc(text)} · </span>
  </div>
</div>`;
}

/* ── 04 ai-feed — AI 답변 피드 상승 ──────────────────────────
   시안 S00d. 우측 피드는 같은 묶음을 두 벌 이어 붙여 34초 루프를 만든다.
   두 번째 벌은 눈속임이라 aria-hidden 이다. */
function aiFeed(s) {
  const turn = (t, dup) => `<div class="feed-q"><span>${esc(t.q)}</span></div>
        <div class="feed-a">
          <div class="feed-engine feed-${t.tone}"><span aria-hidden="true">${esc(t.glyph)}</span>${esc(t.engine)}</div>
          <p>${esc(t.a)}</p>
        </div>`;

  const set = (dup) =>
    s.turns.map((t) => turn(t, dup)).join('\n        ');

  return `<section class="ai-feed" id="ai-feed">
  <div class="wrap ai-feed-grid">
    <div class="ai-feed-copy">
      <h2 ${rv(0)}>${esc(s.h2[0])}<br><span class="hl">${esc(s.h2[1])}</span><br>${esc(s.h2[2])}</h2>
      <p ${rv(1, 'ai-feed-lead')}>${esc(s.lead[0])}<br>${esc(s.lead[1])}</p>
      <p ${rv(2, 'ai-feed-punch')}>${esc(s.punch)}</p>
    </div>

    <div ${rv(1, 'feed-card')}>
      <div class="feed-window">
        <div class="feed-track">
        ${set(false)}
        <div class="feed-dup" aria-hidden="true">
        ${set(true)}
        </div>
        </div>
      </div>
      <p class="feed-foot">${esc(s.foot)}</p>
    </div>
  </div>
</section>`;
}

/* 4단계 아이콘 — 시안의 SVG 를 그대로 옮겼다. 장식이므로 aria-hidden. */
const STEP_ICON = {
  target: '<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="3"></rect><path d="M12 4v4M8 14h.01M16 14h.01M9 17h6"></path>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"></circle><path d="M15.5 15.5L21 21M8 10.5h5M10.5 8v5"></path>',
  rocket: '<path d="M12 3l7 18-7-4-7 4 7-18z"></path>',
};

/* ── 12 process — 분석 과정 4단계 ────────────────────────────── */
function process(s) {
  const cards = s.steps
    .map(
      (st, i) =>
        `<div ${rv(i, `proc-card${st.accent ? ' is-accent' : ''}`)}>
          <div class="proc-num">${esc(st.n)}</div>
          <span class="proc-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${STEP_ICON[st.icon]}</svg></span>
          <h3>${esc(st.title)} <span class="proc-en">${esc(st.en)}</span></h3>
          <p>${esc(st.body)}</p>
        </div>`
    )
    .join('\n        <div class="proc-arrow" aria-hidden="true">›</div>\n        ');

  return `<section class="section process" id="process">
  <div class="wrap">
    <h2 class="process-h2">${esc(s.h2[0])}<br><span class="hl">${esc(s.h2[1])}</span></h2>
    <p class="process-lead">${esc(s.lead)}</p>
    <div class="proc-row">
        ${cards}
    </div>
    <p class="process-foot">${esc(s.foot)}</p>
  </div>
</section>`;
}

/* ── 앵커 목차 ─────────────────────────────────────────────── */
function anchorNav(items) {
  return `<nav class="anchor-nav" aria-label="페이지 안내">
  <div class="wrap">
    <ul>
      ${items.map((a) => `<li><a href="${esc(a.href)}">${esc(a.label)}</a></li>`).join('\n      ')}
    </ul>
  </div>
</nav>`;
}

/* ── 섹션 껍데기 ───────────────────────────────────────────── */
function section({ id, deep, query, eyebrow, h2, sub, intro, body, foot }) {
  const introHtml = (intro ?? [])
    .map((p, i) => `<p ${rv(i + 1, 'section-intro')}>${esc(p)}</p>`)
    .join('\n    ');

  return `<section class="section${deep ? ' on-deep' : ''}"${id ? ` id="${esc(id)}"` : ''}>
  <div class="wrap">
    <div ${rv(0, 'section-head')}>
      ${query ? `<p class="query-sub">${esc(query)}</p>` : ''}
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
      <h2>${esc(h2)}</h2>
      ${sub ? `<p>${esc(sub)}</p>` : ''}
    </div>
    ${introHtml}
    ${body}
    ${foot ? `<p ${rv(1, 'caption', 'margin-top:var(--s8)')}>${esc(foot)}</p>` : ''}
  </div>
</section>`;
}

/* ── 02 ────────────────────────────────────────────────────── */
function s02(s) {
  const body = `<div class="grid grid-3">
      ${s.cards
        .map(
          (c, i) => `<article ${rv(i, 'card')}>
        <span class="num">${esc(c.n)}</span>
        <h3>${esc(c.h3)}</h3>
        <p>${esc(c.p)}</p>
      </article>`
        )
        .join('\n      ')}
    </div>`;
  return section({ id: s.id, h2: s.h2, body, foot: s.foot });
}

/* ── 03 ────────────────────────────────────────────────────── */
function s03(s) {
  const stats = s.stats
    .map(
      (st, i) => `<div ${rv(i, 'stat')}>
        <p class="stat-num" data-countup>${esc(st.num)}</p>
        <p class="stat-label">${esc(st.label)}</p>
        <p class="stat-src">${esc(st.src)}</p>
      </div>`
    )
    .join('\n      ');

  const conv = s.conv
    .map(
      (c, i) => `<div ${rv(i, 'conv-row')}>
        <span>${esc(c.label)}</span>
        <span class="conv-track"><span class="conv-fill${c.dim ? ' is-dim' : ''}" data-pct="${c.pct}" style="--pct:${c.pct}%"></span></span>
        <span class="conv-val">${esc(c.value)}</span>
      </div>`
    )
    .join('\n      ');

  const body = `<!-- 【게시 전 출처 확인】 통계 4개(63.5 / 54.5 / 77.2 / 58) · 전환율(14.2 / 2.8) -->
    <div class="grid grid-4">
      ${stats}
    </div>
    <div ${rv(1, 'conv')}>
      <p class="eyebrow">${esc(s.convTitle)}</p>
      ${conv}
      <p class="caption">${esc(s.convNote)}</p>
    </div>`;
  return section({ id: s.id, deep: true, h2: s.h2, sub: s.sub, body });
}

/* ── 04 ────────────────────────────────────────────────────── */
function s04(s) {
  const body = `<div class="contrast">
      <div ${rv(0, 'panel panel-bad')}>
        <p class="panel-title">△ ${esc(s.bad.title)}</p>
        <h3>${esc(s.bad.h3)}</h3>
        <p style="margin-top:var(--s3)">${esc(s.bad.p)}</p>
        <p class="cost-note">${esc(s.bad.cost)}</p>
      </div>
      <div class="contrast-arrow" aria-hidden="true">→</div>
      <div ${rv(1, 'panel panel-good')}>
        <p class="panel-title">✓ ${esc(s.good.title)}</p>
        <ul>
          ${s.good.items.map((it) => `<li>${esc(it)}</li>`).join('\n          ')}
        </ul>
        <p class="cost-note">↓ ${esc(s.good.foot)}</p>
      </div>
    </div>`;
  return section({ query: s.query, eyebrow: s.eyebrow, h2: s.h2, body, foot: s.foot });
}

/* ── 05 ────────────────────────────────────────────────────── */
function s05(s) {
  const body = s.steps
    .map(
      (st, i) => `<div ${rv(i, `step-row${st.featured ? ' is-featured' : ''}`)}>
      <div>
        <span class="num">${esc(st.n)}</span>
        ${st.badge ? `<span class="plan-badge" style="margin-top:var(--s2)">← ${esc(st.badge)}</span>` : ''}
      </div>
      <div>
        <h3>${esc(st.h3)}</h3>
        <dl class="dl-inline">
          <dt>대상</dt><dd>${esc(st.target)}</dd>
          <dt>목표</dt><dd>${esc(st.goal)}</dd>
          <dt>예</dt><dd>${esc(st.ex)}</dd>
        </dl>
      </div>
    </div>`
    )
    .join('\n    ');
  return section({ h2: s.h2, body, foot: s.foot });
}

/* ── 중간 CTA ──────────────────────────────────────────────── */
function ctaBand(c, href = '#diagnose') {
  return `<section class="cta-band">
  <div class="wrap">
    <p ${rv(0)}>${esc(c.text)}</p>
    <a href="${esc(href)}" ${rv(1, 'btn btn-primary')}>${esc(c.btn)}</a>
  </div>
</section>`;
}

/* ── 진단 폼 (06·15·/diagnosis/ 공통) ──────────────────────── */
export function diagnosisForm(f, { id, title, lead } = {}) {
  const fields = f.fields
    .map(
      (fd) => `<div class="field">
        <label for="${esc(id ?? 'd')}-${esc(fd.name)}">${esc(fd.label)}</label>
        <input id="${esc(id ?? 'd')}-${esc(fd.name)}" name="${esc(fd.name)}" type="${
        fd.name === 'email' ? 'email' : fd.name === 'url' ? 'url' : 'text'
      }" placeholder="${esc(fd.placeholder)}" required>
      </div>`
    )
    .join('\n      ');

  // 도구 직행 — 우리 서버는 없다. 입력값을 쿼리스트링으로 붙여 도구로 보낸다.
  // action 이 확정되면 아래 한 줄만 바꾼다. 파라미터명도 도구 쪽에 맞춘다.
  return `<div ${rv(0, 'form-block')}${id ? ` id="${esc(id)}"` : ''}>
      ${title ? `<h3>${esc(title)}</h3>` : ''}
      ${lead ? `<p>${esc(lead)}</p>` : ''}
      <!-- 【확인 필요】 진단 도구 URL — action 에 넣는다. 예: action="https://도구주소/" -->
      <!-- 【확인 필요】 파라미터명(name/url/email)이 도구 쪽과 일치하는지 확인 -->
      <form method="get" action="#" novalidate>
      ${fields}
      <div class="consent">
        <label>
          <input type="checkbox" name="agree" required>
          <span>${esc(f.consentRequired)} <a href="${esc(pathFor(f.consentLinkSlug))}">${esc(f.consentRequiredLink)}</a></span>
        </label>
        <label>
          <input type="checkbox" name="marketing">
          <!-- 선택 동의도 개인정보 이용(마케팅 수신)이므로 정보주체가
               방침을 열람할 경로가 있어야 한다. 필수 항목과 같은 형태로 건다. -->
          <span>${esc(f.consentOptional)} <a href="${esc(pathFor(f.consentLinkSlug))}">${esc(f.consentRequiredLink)}</a>
            <span class="opt-note">${esc(f.consentOptionalNote)}</span>
          </span>
        </label>
      </div>
      <button class="btn btn-primary btn-block" type="submit">${esc(f.submit)}</button>
      </form>
      <!-- 【실측 확인 필요】 "15초" -->
      <p class="form-note">${esc(f.note)}<br>${esc(f.note2)}</p>
    </div>`;
}

/* ── 06 ────────────────────────────────────────────────────── */
function s06(s, f) {
  const t = s.table;
  const body = `<div class="split">
      <div ${rv(0, 'split-head')}>
        <p class="eyebrow">${esc(s.proofTitle)}</p>
        <!-- 이미지 슬롯: AI 답변 화면 캡처. 임시 이미지 넣지 말 것 -->
        ${imageSlot('00')}
        <p class="caption" style="margin-top:var(--s4)">${esc(s.proofCaption)}</p>
        <div class="table-wrap">
          <table>
            <caption>${esc(t.caption)}</caption>
            <thead><tr>${t.head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
            <tbody>
              ${t.rows.map((r) => `<tr><th scope="row">${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('\n              ')}
            </tbody>
          </table>
        </div>
        <p class="caption">${esc(s.tableNote)}</p>
      </div>
      <div>
        ${diagnosisForm(f, { id: 'form-top', title: s.formTitle, lead: s.formLead })}
      </div>
    </div>`;
  return section({ id: s.id, h2: s.h2, body });
}

/* ── 07 ────────────────────────────────────────────────────── */
function s07(s) {
  const body = `<div class="grid grid-4" id="report">
      ${s.blocks
        .map(
          (b, i) => `<article ${rv(i, 'block-card')}>
        <!-- 이미지 슬롯: 진단서 ${esc(b.n)} 실제 캡처 -->
        ${imageSlot(String(i + 1).padStart(2, '0'))}
        <div class="block-body">
          <span class="num">${esc(b.n)}</span>
          <h3>${esc(b.h3)}</h3>
          <p>${esc(b.p)}</p>
        </div>
      </article>`
        )
        .join('\n      ')}
    </div>`;
  return section({ deep: true, h2: s.h2, sub: s.sub, body, foot: s.foot });
}

/* ── 08 ────────────────────────────────────────────────────── */
function s08(s) {
  const body = s.steps
    .map(
      (st, i) => `<div ${rv(i, `step-row${st.featured ? ' is-featured' : ''}`)}>
      <div class="step-letter">${esc(st.letter)}</div>
      <div>
        <span class="proc-en">${esc(st.en)}</span>
        <h3>${esc(st.h3)}</h3>
        <p style="color:var(--muted);margin-top:var(--s2)">${esc(st.p)}</p>
        <p class="step-out">→ ${esc(st.out)}</p>
      </div>
    </div>`
    )
    .join('\n    ');
  return section({ id: s.id, query: s.query, h2: s.h2, sub: s.sub, body, foot: s.foot });
}

/* ── 09 ────────────────────────────────────────────────────── */
function s09(s) {
  const body = `<div class="grid grid-4">
      ${s.cards
        .map(
          (c, i) => `<article ${rv(i, 'card')}>
        <span class="num">${esc(c.when)}</span>
        <h3>${esc(c.h3)}</h3>
        <ul style="list-style:none;display:grid;gap:var(--s2);margin-top:var(--s4)">
          ${c.items.map((it) => `<li style="font-size:0.875rem;color:var(--muted)">✓ ${esc(it)}</li>`).join('\n          ')}
        </ul>
        ${c.note ? `<p class="caption" style="margin-top:var(--s4)">${esc(c.note)}</p>` : ''}
      </article>`
        )
        .join('\n      ')}
    </div>`;
  return section({ h2: s.h2, body });
}

/* ── 10 ────────────────────────────────────────────────────── */
function s10(s) {
  const t = s.table;
  const body = `<div ${rv(0, 'table-wrap')}>
      <table>
        <caption>${esc(t.caption)}</caption>
        <thead><tr>${t.head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>
          ${t.rows
            .map(
              (r) =>
                `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map((c) => `<td class="is-num">${esc(c)}</td>`).join('')}</tr>`
            )
            .join('\n          ')}
        </tbody>
      </table>
    </div>
    <p class="caption">${esc(s.note)}</p>
    <p ${rv(1, '', 'margin-top:var(--s6)')}>${esc(s.fail)}</p>
    <div ${rv(2, 'block-deep', 'margin-top:var(--s10);padding:var(--s8);border-radius:var(--radius)')}>
      <p class="eyebrow">${esc(s.halluLead)}</p>
      <h3>${esc(s.halluTitle)}</h3>
      <p style="color:var(--muted);margin-top:var(--s3)">${esc(s.halluBody)}</p>
    </div>`;
  return section({ h2: s.h2, body });
}

/* ── 11 ────────────────────────────────────────────────────── */
function s11(s) {
  const body = `<div class="grid grid-4">
      ${s.cards
        .map(
          (c, i) => `<article ${rv(i, 'card')}>
        <span class="num">${esc(c.n)}</span>
        <h3>${esc(c.h3)}</h3>
        <p>${esc(c.p)}</p>
      </article>`
        )
        .join('\n      ')}
    </div>

    <div ${rv(1, 'deny-line')}>
      <b>${esc(s.denyTitle)}</b>
      <span>${esc(s.denyBody)}</span>
    </div>

    <div ${rv(2, 'record-band')}>
      ${s.band
        .map(
          (b, i) => `<div ${rv(i)}>
        <span class="num" data-countup>${esc(b.num)}</span>
        <p>${esc(b.label)}</p>
      </div>`
        )
        .join('\n      ')}
    </div>`;
  return section({ deep: true, h2: s.h2, intro: s.intro, body });
}

/* ── 12 ────────────────────────────────────────────────────── */
function s12(s) {
  const plans = s.plans
    .map(
      (p, i) => `<article ${rv(i, `plan${p.featured ? ' is-featured' : ''}`)}>
        ${p.badge ? `<span class="plan-badge">★ ${esc(p.badge)}</span>` : ''}
        <span class="num">${esc(p.code)}</span>
        <h3>${esc(p.name)}</h3>
        <p class="plan-for">${esc(p.for)}</p>
        <p class="plan-price">${esc(s.priceLabel)}</p>
        <dl>
          ${p.rows.map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('\n          ')}
        </dl>
        <a class="btn ${p.featured ? 'btn-primary' : 'btn-secondary'}" href="#diagnose">${esc(p.cta)}</a>
      </article>`
    )
    .join('\n      ');

  const extras = s.extras
    .map(
      (e, i) => `<article ${rv(i, 'card')}>
        <h3>${esc(e.name)}</h3>
        <p class="plan-price" style="margin-top:var(--s2)">${esc(e.price)}</p>
        <ul>
          ${e.items.map((it) => `<li>${esc(it)}</li>`).join('\n          ')}
        </ul>
      </article>`
    )
    .join('\n      ');

  const body = `<div class="plan-grid">
      ${plans}
    </div>
    <div class="plan-wide">
      ${extras}
    </div>`;
  return section({ id: s.id, h2: s.h2, body, foot: s.foot });
}

/* ── 13 ────────────────────────────────────────────────────── */
function s13(s) {
  const body = `<div class="grid grid-3">
      ${s.cards
        .map(
          (c, i) => `<article ${rv(i, 'ask-card')}>
        <h3>${esc(c.h3)}</h3>
        <dl class="ask-row ask-good"><dt>✓ ${esc(s.labels.good)}</dt><dd>${esc(c.good)}</dd></dl>
        <dl class="ask-row ask-bad"><dt>✕ ${esc(s.labels.bad)}</dt><dd>${esc(c.bad)}</dd></dl>
        <dl class="ask-row ask-ours"><dt>${esc(s.labels.ours)}</dt><dd>${esc(c.ours)}</dd></dl>
      </article>`
        )
        .join('\n      ')}
    </div>`;
  return section({ deep: true, h2: s.h2, sub: s.sub, body, foot: s.foot });
}

/* ── 13.5 (신규) ───────────────────────────────────────────── */
function s135(s) {
  const body = `<div class="grid grid-4">
      ${s.cards
        .map(
          (c, i) => `<a href="${esc(pathFor(c.slug))}" ${rv(i, 'card')}>
        <span class="num">${esc(c.n)}</span>
        <h3>${esc(c.h3)}</h3>
        <p>${esc(c.p)}</p>
      </a>`
        )
        .join('\n      ')}
    </div>
    <p ${rv(1, '', 'margin-top:var(--s8)')}><a class="btn btn-secondary" href="${esc(pathFor(s.moreSlug))}">${esc(s.more)} →</a></p>`;
  return section({ h2: s.h2, sub: s.sub, body });
}

/* ── 14 FAQ — 접지 않는다 ──────────────────────────────────── */
function s14(s) {
  // 답변 안의 페이지명을 내부 링크로 바꾼다.
  // 먼저 통째로 이스케이프한 뒤 링크 문구만 앵커로 교체한다 —
  // 순서를 바꾸면 앵커까지 이스케이프되어 글자로 보인다.
  // JSON-LD FAQPage 에는 평문 f.a 가 그대로 들어간다(링크 없음).
  const answerHtml = (f) => {
    const plain = esc(f.a);
    if (!f.link?.slug || !f.link?.text) return plain;
    const needle = esc(f.link.text);
    if (!plain.includes(needle)) return plain;
    const anchor = `<a href="${esc(pathFor(f.link.slug))}">${needle}</a>`;
    return plain.replace(needle, anchor);
  };

  const body = `<div class="faq-list">
      ${s.items
        .map(
          (f, i) => `<div ${rv(Math.min(i, 6), 'faq-item')}>
        <span class="num">Q${i + 1}</span>
        <div>
          <h3>${esc(f.q)}</h3>
          <p>${answerHtml(f)}</p>
        </div>
      </div>`
        )
        .join('\n      ')}
    </div>`;
  return section({ id: s.id, h2: s.h2, body });
}

/* ── 15 ────────────────────────────────────────────────────── */
function s15(s, f) {
  // 【확인 필요】 카카오 채널 URL — 개설되면 아래 tel: 을 채널 주소로 바꾼다.
  const body = `<div class="split">
      <div ${rv(0, 'split-head')}>
        <p style="font-size:1.0625rem;color:var(--muted)">${esc(s.lead)}</p>
        <p class="caption" style="margin-top:var(--s4)">${esc(s.sub)}</p>
        <p style="margin-top:var(--s6)"><a class="btn btn-secondary" href="${esc(s.kakaoHref)}">${esc(s.kakao)}</a></p>
      </div>
      <div>
        ${diagnosisForm(f, { id: 'form-bottom' })}
      </div>
    </div>`;
  return section({ deep: true, h2: s.h2, body });
}

/* ── 플로팅 ────────────────────────────────────────────────── */
export function floatingButtons(items) {
  // 【확인 필요】 카카오 채널 URL — 개설되면 tel: 을 채널 주소로 바꾼다.
  return `<div class="floating" role="complementary" aria-label="바로가기">
  ${items
    .map(
      (b) => `<a class="btn ${b.primary ? 'btn-primary' : 'btn-secondary'}" href="${esc(b.href)}">${esc(b.label)}</a>`
    )
    .join('\n  ')}
</div>`;
}

/* ── 핵심 답변 블록 ────────────────────────────────────────
   시안에는 없다. AEO 규격으로 넣은 것이다.
   <title>이 던지는 질의("캠핑장 AI 마케팅 어디에 맡겨야 돼?")에 대한
   40~60단어 답이 페이지 안에 없으면, AI는 인용할 문단을 찾지 못하고
   히어로 카피를 자기 말로 요약해버린다. 그러면 우리 문장이 사라진다. */
function answerBlock(page) {
  return `<section class="section" style="padding-block:var(--s12)">
  <div class="wrap">
    <div ${rv(0, 'answer', 'max-width:72ch')}>
      <p class="answer-label">${esc(page.question ?? '핵심 답변')}</p>
      <p class="answer-text">${esc(page.answer)}</p>
    </div>
  </div>
</section>`;
}

/* ── 조립 ──────────────────────────────────────────────────── */
export function renderLanding(page, ctx) {
  // 순서는 v11 지시문 1번 표를 따른다. id 는 시안의 실제 id 다.
  //
  // 폐기(2026-08-15 사장님 승인) — 되살리지 말 것:
  //   · s10 「우리가 우리에게 먼저 적용했습니다」  = Before·After 섹션
  //   · s13 「어느 업체를 만나든 이 6가지를 물어보세요」 — 시안에 없다
  //   · s135 「캠핑장 운영 질문 120개」          = Q&A 허브 4카드
  return [
    cover(L.cover),        // 02
    hero(L.hero),          // 03
    marquee(L.marquee),
    aiFeed(L.aiFeed),      // 04
    anchorNav(L.anchors),
    answerBlock(page),
    s02(L.s02),            // 05 problem
    s03(L.s03),            // 06 data
    s04(L.s04),            // 07 gap
    s05(L.s05),            // 08 concept
    ctaBand(L.cta1),
    s06(L.s06, L.form),    // 10 demo
    s07(L.s07),            // 11 report-preview
    process(L.process),    // 12 process
    s08(L.s08),            // 13 framework — CAMP-AI 5단계
    s09(L.s09),            // 14 deliverable
    ctaBand(L.cta2),
    s11(L.s11),            // 15 why
    s12(L.s12),            // 16 plan
    s14(L.s14),            // 17 faq
    s15(L.s15, L.form),    // 18 cta
  ].join('\n\n');
}

export { L as LANDING };
