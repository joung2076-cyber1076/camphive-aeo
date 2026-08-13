// 홈 렌더러. 콘텐츠 페이지와 구조가 다르므로 분리했다.
// 홈의 역할은 두 가지뿐: (1) 회사가 누구인지 사실로 못박기 (2) 콘텐츠 목록 제시.

import { esc, renderBlocks, renderTable, urlFor, pathFor, krDate } from './html.mjs';

export function renderHome(page, ctx) {
  const { site, allPages } = ctx;
  const parts = [];

  parts.push(`<article class="content home">`);
  parts.push(`<h1>${esc(page.question ?? page.title)}</h1>`);

  parts.push(`<div class="answer" role="region" aria-label="핵심 답변">
  <p class="answer-label">핵심 답변</p>
  <p class="answer-text">${esc(page.answer)}</p>
</div>`);

  if (page.asOf) {
    parts.push(
      `<p class="as-of">기준일자: <time datetime="${esc(page.asOf)}">${esc(krDate(page.asOf))}</time></p>`
    );
  }

  if (page.lead?.length) parts.push(renderBlocks(page.lead));

  for (const table of page.tables ?? []) parts.push(renderTable(table));

  for (const section of page.sections ?? []) {
    parts.push(`<section class="section">
  <h2>${esc(section.h2)}</h2>
  ${renderBlocks(section.body)}
</section>`);
  }

  // 콘텐츠 목록 — 공개된 페이지
  // 콘텐츠 목록에는 본문 문서만 넣는다.
  // 견본(template)과 법적 고지 페이지(page)는 읽을거리가 아니므로 제외한다.
  const others = (allPages ?? []).filter(
    (p) => p.type !== 'home' && p.type !== 'page' && !p.template
  );
  const listed = others.filter((p) => !p.noindex && !p.draft);
  // 자리표시자(원고 대기) 페이지는 따로 묶어 "준비 중"으로 밝힌다.
  // 없는 척 숨기지 않고, 완성된 글과 섞지도 않는다.
  const pending = others.filter((p) => p.noindex || p.draft);

  parts.push(`<section class="section" id="contents">
  <h2>콘텐츠 목록</h2>
  ${
    listed.length
      ? `<ul class="content-index">
    ${listed
      .map(
        (p) => `<li>
      <a href="${esc(pathFor(p.slug))}">${esc(p.question ?? p.title)}</a>
      ${p.answer ? `<p class="content-index-summary">${esc(truncate(p.answer, 90))}</p>` : ''}
      ${p.updated ? `<p class="content-index-date">갱신 ${esc(krDate(p.updated))}</p>` : ''}
    </li>`
      )
      .join('\n    ')}
  </ul>`
      : `<p>공개된 콘텐츠를 준비하고 있습니다.</p>`
  }
</section>`);

  if (pending.length) {
    parts.push(`<section class="section" id="pending">
  <h2>준비 중인 문서</h2>
  <p>아래 문서는 자리만 잡아둔 상태이며 본문을 작성하고 있습니다. 검색엔진 색인에서는 제외되어 있습니다.</p>
  <ul class="content-index">
    ${pending
      .map(
        (p) => `<li>
      <a href="${esc(pathFor(p.slug))}">${esc(p.question ?? p.title)}</a>
      <p class="content-index-date">준비 중</p>
    </li>`
      )
      .join('\n    ')}
  </ul>
</section>`);
  }

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

  if (page.updated) {
    parts.push(
      `<p class="updated">최종 갱신일: <time datetime="${esc(page.updated)}">${esc(krDate(page.updated))}</time></p>`
    );
  }

  parts.push(`</article>`);
  return parts.join('\n\n');
}

function truncate(text, max) {
  const s = String(text ?? '').trim();
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}
