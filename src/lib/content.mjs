// ─────────────────────────────────────────────────────────────
//  콘텐츠 로더 — 마크다운 1개 = 페이지 1개
//
//  src/content/**/*.md 를 읽어 페이지 객체로 만든다.
//  빌드(build.mjs)와 검증(verify.mjs)이 같은 이 함수를 쓴다.
//  → 두 곳이 서로 다른 해석을 하는 사고가 구조적으로 불가능하다.
// ─────────────────────────────────────────────────────────────

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseFrontMatter } from './frontmatter.mjs';
import { parseMarkdown } from './markdown.mjs';

/** src/content 아래의 .md 파일을 하위 폴더까지 훑는다. */
async function findMarkdown(dir, rel = '') {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const relPath = path.posix.join(rel, entry.name);
    if (entry.isDirectory()) found.push(...(await findMarkdown(full, relPath)));
    else if (entry.name.endsWith('.md')) found.push({ full, rel: relPath });
  }
  return found.sort((a, b) => a.rel.localeCompare(b.rel));
}

/** front matter 값 정리 — 문자열로 온 boolean 등을 정돈한다. */
const bool = (v) => v === true || v === 'true';

export async function loadPages(contentDir) {
  const files = await findMarkdown(contentDir);
  const pages = [];

  for (const { full, rel } of files) {
    const raw = await readFile(full, 'utf8');
    const { data, body } = parseFrontMatter(raw, rel);
    const { lead, tables, sections } = parseMarkdown(body, rel);

    pages.push({
      _file: rel,

      type: data.type || 'article',
      slug: String(data.slug ?? '').replace(/^\/+|\/+$/g, ''),

      title: data.title ?? '',
      metaTitle: data.metaTitle || undefined,
      description: data.description ?? '',
      question: data.question ?? data.title ?? '',
      answer: data.answer ?? '',

      asOf: data.asOf ?? '',
      asOfNote: data.asOfNote || undefined,
      published: data.published || undefined,
      updated: data.updated ?? '',

      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      category: data.category || undefined,

      noindex: bool(data.noindex),
      draft: bool(data.draft),
      // 구조 견본 페이지 표시 — 홈의 목록에 나타나지 않는다
      template: bool(data.template),
      nav: bool(data.nav),
      navLabel: data.navLabel || undefined,
      changefreq: data.changefreq || undefined,

      // 본문에서 뽑아낸 구조
      lead,
      tables,
      sections,

      faq: Array.isArray(data.faq) ? data.faq : [],
      related: Array.isArray(data.related) ? data.related : [],
    });
  }

  return pages;
}
