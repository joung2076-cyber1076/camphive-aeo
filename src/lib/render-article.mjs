// ─────────────────────────────────────────────────────────────
//  콘텐츠 페이지 렌더러
//
//  고정 구조 (순서를 바꾸지 말 것):
//    1. H1        — 사람이 실제로 던지는 질의문 그대로
//    2. 답변 블록 — 40~60단어. AI가 통째로 뽑아가는 부분.
//    3. 기준일자  — 이 답변이 언제 기준인지
//    4. 데이터표 2개 — 수치/비교. AI가 표를 그대로 인용한다.
//    5. H2 본문 5~8개 — 근거와 설명
//    6. FAQ 4문항
//    7. 갱신일
//    8. 내부 링크
//
//  이 순서는 AI가 문서를 훑는 순서와 같다. 결론부터 나오지 않으면
//  인용 후보에서 밀린다.
// ─────────────────────────────────────────────────────────────

import { esc, krDate, renderTable, renderBlocks, pathFor } from './html.mjs';

// 진단 도구 주소 — 진단기 팀 이식 사양서(2026-08-19) 1항·5항
// 샘플 진단서는 저장된 고정 문서다. 몇 번 열어도 원가 0원.
// 종합리포트(/report)는 미배포(404)라 링크하지 않는다.
const DIAG_TOOL_URL = 'https://camphive-aeo.vercel.app/';
const DIAG_SAMPLE_URL =
  'https://camphive-aeo.vercel.app/diagnosis/dgn_8d90a41640bf4be78523f7b879fa1314';

export function renderArticle(page, ctx) {
  const parts = [];

  parts.push(`<article class="content">`);

  if (page.noindex) {
    parts.push(
      `<p class="draft-badge">이 페이지는 구조 견본입니다. 색인·사이트맵에서 제외되어 있습니다.</p>`
    );
  }

  // ── 1. H1 = 질의문 그대로 ────────────────────────────────
  parts.push(`<h1>${esc(page.question)}</h1>`);

  // ── 2. 답변 블록 (40~60단어) ─────────────────────────────
  // AI가 이 한 덩어리를 그대로 답변에 옮긴다. 문단 하나, 접속사 없이 결론부터.
  parts.push(`<div class="answer" role="region" aria-label="핵심 답변">
  <p class="answer-label">핵심 답변</p>
  <p class="answer-text">${esc(page.answer)}</p>
</div>`);

  // ── 3. 기준일자 ──────────────────────────────────────────
  if (page.asOf) {
    parts.push(
      `<p class="as-of">기준일자: <time datetime="${esc(page.asOf)}">${esc(krDate(page.asOf))}</time>${
        page.asOfNote ? ` · ${esc(page.asOfNote)}` : ''
      }</p>`
    );
  }

  // 표 앞에 놓인 도입 문단 (있으면)
  if (page.lead?.length) {
    parts.push(renderBlocks(page.lead));
  }

  // ── 4. 데이터표 2개 ──────────────────────────────────────
  if (page.tables?.length) {
    parts.push(`<section class="tables" aria-label="데이터">`);
    for (const table of page.tables) parts.push(renderTable(table));
    parts.push(`</section>`);
  }

  // ── 5. H2 본문 5~8개 ────────────────────────────────────
  for (const section of page.sections ?? []) {
    const id = section.id ?? slugify(section.h2);
    parts.push(`<section class="section" id="${esc(id)}">
  <h2>${esc(section.h2)}</h2>
  ${renderBlocks(section.body)}
</section>`);
  }

  // ── 6. FAQ 4문항 ────────────────────────────────────────
  // dl 이 아니라 h3 + p 로 쓴다. AI는 질문을 헤딩으로 인식할 때 더 잘 뽑는다.
  //  허브는 이 블록을 그리지 않는다. 문항이 이미 본문 5번에 다 있어서,
  //  여기서 또 그리면 같은 질문 22개가 화면에 두 번 나온다. page.faq 는
  //  그 본문에서 뽑아낸 값이라 JSON-LD 쪽만 쓰면 된다(content.mjs).
  if (page.faq?.length && !page.hub) {
    parts.push(`<section class="faq" id="faq">
  <h2>자주 묻는 질문</h2>
  ${page.faq
    .map(
      (item, i) => `<div class="faq-item">
    <h3 id="faq-${i + 1}">${esc(item.q)}</h3>
    <p>${esc(item.a)}</p>
  </div>`
    )
    .join('\n  ')}
</section>`);
  }

  // ── 7. 갱신일 ───────────────────────────────────────────
  if (page.updated) {
    parts.push(`<p class="updated">
  최종 갱신일: <time datetime="${esc(page.updated)}">${esc(krDate(page.updated))}</time>${
    page.published ? ` · 최초 작성일: <time datetime="${esc(page.published)}">${esc(krDate(page.published))}</time>` : ''
  }
</p>`);
  }

  // ── 8. 내부 링크 ────────────────────────────────────────
  if (page.related?.length) {
    parts.push(`<nav class="related" aria-label="관련 문서">
  <h2>관련 문서</h2>
  <ul>
    ${page.related
      .map((r) => {
        const href = r.href ?? pathFor(r.slug);
        return `<li><a href="${esc(href)}">${esc(r.label)}</a>${
          r.note ? ` — <span class="related-note">${esc(r.note)}</span>` : ''
        }</li>`;
      })
      .join('\n    ')}
  </ul>
</nav>`);
  }

  // ── 진단 CTA (v15 작업 N-2) ────────────────────────
  //
  //  진단 도구는 우리 서버가 아니라 진단기 팀이 따로 배포한다.
  //  이식 사양서(2026-08-19) 2항이 「쿼리 파라미터로 값을 넘겨도 무시된다」고
  //  명시하므로 값을 넘기지 않고 링크로만 보낸다. ?src= 도 붙이지 않는다 —
  //  기록되지 않아 붙여 봐야 측정에 쓸 수 없다.
  //
  //  /diagnosis/ 는 v13 G-2 에서 같은 버튼 2개를 이미 갖췄다. 중복으로 붙이지
  //  않는다. 문구에 소요 시간을 넣지 않는다(K4) — 손님 사양·회선에 따라
  //  달라져 검증할 수 없는 수치다.
  //  대상은 아키가 지정한 11페이지다(v15 N-2). /diagnosis/ 는 이미 갖췄고,
  //  /contact/ 와 /privacy/ 는 목록 밖이라 넣지 않는다 — 방침 문서에 영업
  //  버튼을 붙이지 않는다.
  const DIAG_CTA_SLUGS = new Set([
    'service',
    'measurement',
    'faq',
    'faq/ad-budget',
    'faq/direct-booking',
    'faq/naver-blog-still-works',
    'faq/why-not-in-chatgpt',
    'about',
    'intro/ai-marketing',
    'intro/company',
    'intro/consulting',
  ]);
  if (DIAG_CTA_SLUGS.has(page.slug)) {
    parts.push(`<aside class="diag-cta" aria-label="무료 AI 노출 진단">
  <p>ChatGPT · Claude · Gemini 세 곳에 실제로 물어 우리 캠핑장이 답변에 나오는지 확인해 드립니다. 캠핑장 이름 · 홈페이지 주소 · 이메일 세 가지를 진단 화면에서 넣으시면 됩니다. 하루 20건 한정입니다.</p>
  <p class="diag-cta-actions">
    <a class="btn btn-primary" href="${DIAG_TOOL_URL}" target="_blank" rel="noopener">무료로 AI 노출 진단받기</a>
    <a class="btn" href="${DIAG_SAMPLE_URL}" target="_blank" rel="noopener">진단서 샘플 보기</a>
  </p>
</aside>`);
  }

  parts.push(`</article>`);
  return parts.join('\n\n');
}

/** 한글 헤딩도 앵커로 쓸 수 있게 처리 */
function slugify(text) {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}
