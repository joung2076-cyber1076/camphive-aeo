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
  if (page.faq?.length) {
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
