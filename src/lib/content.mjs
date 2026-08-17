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

/**
 * 배포에서 빼는 파일 — 이름이 밑줄로 시작하는 것.
 *
 * _template.md 는 콘텐츠 구조 견본이라 실제 페이지가 아니다. 지금은
 * 전역 noindex 라 문제가 없지만, 색인을 여는 날 견본까지 함께 열린다.
 * 소스는 남겨 두고 산출물에서만 뺀다.
 */
const isDraft = (name) => name.startsWith('_');

/** src/content 아래의 .md 파일을 하위 폴더까지 훑는다. */
async function findMarkdown(dir, rel = '') {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (isDraft(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const relPath = path.posix.join(rel, entry.name);
    if (entry.isDirectory()) found.push(...(await findMarkdown(full, relPath)));
    else if (entry.name.endsWith('.md')) found.push({ full, rel: relPath });
  }
  return found.sort((a, b) => a.rel.localeCompare(b.rel));
}

/** front matter 값 정리 — 문자열로 온 boolean 등을 정돈한다. */
const bool = (v) => v === true || v === 'true';

/**
 * 허브 페이지의 본문에서 FAQ 문항을 뽑는다.
 *
 * 본문 구조는 「## 구획 → ### 질문 → 문단·표」다. ### 하나가 문항 하나이고,
 * 답변은 그 아래 다음 ### 전까지의 문단을 잇는다. 표는 넣지 않는다 —
 * acceptedAnswer 는 문장이어야 하고, 표는 화면에서 읽는 자리다.
 *
 * 화면(render-article)이 그리는 것도 같은 sections 다. 소스가 하나라
 * 둘이 어긋날 수 없다(6.3.6.2).
 */
function faqFromSections(sections) {
  const out = [];
  for (const section of sections ?? []) {
    let cur = null;
    for (const block of section.body ?? []) {
      if (block?.h3) {
        cur = { q: block.h3, parts: [] };
        out.push(cur);
      } else if (cur && block?.p) {
        cur.parts.push(block.p.text ?? '');
      }
    }
  }
  return out.map(({ q, parts }) => ({ q, a: parts.join(' ').replace(/\s+/g, ' ').trim() }));
}

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
      // 개별 색인 차단의 사유. noindex 를 켰다면 반드시 있어야 하고,
      // 없으면 validate 가 빌드를 세운다(2026-08-17 신설).
      // 색인 여부는 원칙적으로 site.config.mjs 의 noindexAll 하나로 정한다.
      noindexReason: typeof data.noindexReason === 'string' ? data.noindexReason.trim() : '',
      draft: bool(data.draft),
      // 구조 견본 페이지 표시 — 홈의 목록에 나타나지 않는다
      template: bool(data.template),
      nav: bool(data.nav),
      navLabel: data.navLabel || undefined,
      // 메뉴 순서. 없으면 뒤로 밀린다.
      // 이 값이 없으면 파일 경로순(가나다순)이 그대로 메뉴가 된다.
      navOrder: data.navOrder != null && data.navOrder !== '' ? Number(data.navOrder) : undefined,
      changefreq: data.changefreq || undefined,

      // 본문에서 뽑아낸 구조
      lead,
      tables,
      sections,

      // 질문 허브 표시. 질문 여러 개를 한 페이지에 모으는 구조라
      // 「질문 하나에 답하는 문서」 규격의 상한에서 빠진다(validate.mjs 5·6번).
      hub: bool(data.hub),

      //  FAQ 문항.
      //
      //  허브(hub: true)는 본문에서 뽑는다. 프론트매터에 같은 질문·답변을
      //  또 적으면 화면과 JSON-LD 가 두 소스가 되고, 한쪽만 고치는 날
      //  둘이 어긋난다 — 지침 6.3.6.2 가 경고한 그 구조다. 본문 한 곳만
      //  고치면 화면도 FAQPage 도 같이 따라오게 만든다.
      faq: bool(data.hub) ? faqFromSections(sections) : Array.isArray(data.faq) ? data.faq : [],
      related: Array.isArray(data.related) ? data.related : [],
    });
  }

  return pages;
}
