// HTML 조립 헬퍼. 콘텐츠는 전부 평문(plain text)으로 받아 이스케이프한다.
// → 원고에 <, & 같은 글자가 들어가도 페이지가 깨지지 않는다.

import { site } from '../../site.config.mjs';

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 어절(공백 기준 단어) 수 — 답변 블록 40~60단어 검사에 쓴다. */
export function wordCount(text) {
  return String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
}

/** 'YYYY-MM-DD' → '2026년 8월 13일' */
export function krDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? '').trim());
  if (!m) return String(iso ?? '');
  return `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일`;
}

/** 슬러그 → 절대 URL. 빈 슬러그는 루트. 끝은 항상 슬래시. */
export function urlFor(baseUrl, slug) {
  const s = String(slug ?? '').replace(/^\/+|\/+$/g, '');
  return s ? `${baseUrl}/${s}/` : `${baseUrl}/`;
}

/**
 * 슬러그 → 사이트 내부 경로 (href용)
 * 하위 경로 배포(basePath)가 설정돼 있으면 앞에 붙인다.
 */
export function pathFor(slug) {
  const s = String(slug ?? '').replace(/^\/+|\/+$/g, '');
  return s ? `${site.basePath}/${s}/` : `${site.basePath}/`;
}

/** 정적 파일(css 등) 경로. basePath를 반영한다. */
export function assetPath(file) {
  return `${site.basePath}/${String(file).replace(/^\/+/, '')}`;
}

/**
 * 데이터표 렌더링.
 * table = { caption, columns: [...], rows: [[...], ...], source, note }
 *
 * AI는 <table>의 행/열 구조를 그대로 읽어 수치를 인용한다.
 * div로 만든 가짜 표는 인용되지 않으므로 반드시 진짜 table 태그를 쓴다.
 */
export function renderTable(table) {
  if (!table) return '';
  const cols = table.columns ?? [];
  const rows = table.rows ?? [];

  const head = cols.length
    ? `<thead><tr>${cols
        .map((c, i) => `<th scope="col"${i === 0 ? ' class="col-key"' : ''}>${esc(c)}</th>`)
        .join('')}</tr></thead>`
    : '';

  const body = `<tbody>${rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell, i) =>
            i === 0
              ? `<th scope="row">${esc(cell)}</th>`
              : `<td>${esc(cell)}</td>`
          )
          .join('')}</tr>`
    )
    .join('')}</tbody>`;

  const foot = [
    table.source ? `<p class="table-source">출처: ${esc(table.source)}</p>` : '',
    table.note ? `<p class="table-note">${esc(table.note)}</p>` : '',
  ].join('');

  return `<figure class="data-table">
  <table>
    ${table.caption ? `<caption>${esc(table.caption)}</caption>` : ''}
    ${head}
    ${body}
  </table>
  ${foot}
</figure>`;
}

/**
 * 본문 블록 렌더링.
 *
 * 블록은 마크다운 파서(markdown.mjs)가 만든다:
 *   { p: {html,text} }        문단
 *   { h3: '...' }             작은 제목
 *   { list: [{html,text}] }   순서 없는 목록
 *   { steps: [{html,text}] }  순서 있는 목록
 *   { table: {...} }          표
 *   { quote: {html,text} }    인용
 *
 * html 값은 markdown.mjs가 이미 이스케이프한 뒤 꾸밈만 입힌 것이라 그대로 쓴다.
 */
const frag = (v) => (v && typeof v === 'object' ? v.html : esc(v));

export function renderBlocks(blocks) {
  return (blocks ?? [])
    .map((block) => {
      if (typeof block === 'string') {
        return block.trim() ? `<p>${esc(block)}</p>` : '';
      }
      if (block.p) {
        return `<p>${frag(block.p)}</p>`;
      }
      if (block.h3) {
        return `<h3>${esc(block.h3)}</h3>`;
      }
      if (block.list) {
        return `<ul>${block.list.map((li) => `<li>${frag(li)}</li>`).join('')}</ul>`;
      }
      if (block.steps) {
        return `<ol>${block.steps.map((li) => `<li>${frag(li)}</li>`).join('')}</ol>`;
      }
      if (block.table) {
        return renderTable(block.table);
      }
      if (block.quote) {
        return `<blockquote><p>${frag(block.quote)}</p>${
          block.cite ? `<cite>${esc(block.cite)}</cite>` : ''
        }</blockquote>`;
      }
      return '';
    })
    .join('\n');
}
