#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
//  소스 보기 검증 — 이 프로젝트의 절대 요건을 기계로 확인한다.
//
//  검사 항목:
//   1. 본문 텍스트가 HTML 소스에 그대로 있는가 (Ctrl+U 통과 여부)
//   2. 실행 스크립트가 0개인가 (JS로 그려지는 텍스트가 없는가)
//   3. 정본 문장이 전 페이지에 글자 단위로 동일하게 있는가
//   4. JSON-LD 가 유효한 JSON 이고 @graph 노드가 서로 연결되어 있는가
//   5. sitemap / robots 가 존재하고 봇이 전부 허용되어 있는가
//   6. 내부 링크가 실제 존재하는 페이지를 가리키는가
//
//  실행: npm run verify
// ─────────────────────────────────────────────────────────────

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { site, bots, CANONICAL_SENTENCE } from './site.config.mjs';
import { loadPages } from './src/lib/content.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const CONTENT_DIR = path.join(ROOT, 'src', 'content');

const C = {
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\x1b[0m`,
  err: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  b: (s) => `\x1b[1m${s}\x1b[0m`,
};

const PASS = C.ok('통과');
const FAIL = C.err('실패');

let failures = 0;
function check(condition, label, detail = '') {
  console.log(`  ${condition ? PASS : FAIL}  ${label}${detail ? C.dim(`  ${detail}`) : ''}`);
  if (!condition) failures++;
  return condition;
}

/** HTML 엔티티를 되돌려, 원고 문자열과 소스를 같은 기준으로 비교한다. */
function unescapeHtml(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function htmlPathFor(slug) {
  const s = String(slug ?? '').replace(/^\/+|\/+$/g, '');
  return s ? path.join(DIST, ...s.split('/'), 'index.html') : path.join(DIST, 'index.html');
}

/** 페이지에서 "소스에 반드시 있어야 하는" 문자열들을 뽑아낸다. */
function expectedStrings(page) {
  const out = [];
  const add = (label, text) => {
    if (text && String(text).trim()) out.push({ label, text: String(text).trim() });
  };

  add('H1 질의문', page.question ?? page.title);
  add('답변 블록', page.answer);

  (page.tables ?? []).forEach((t, i) => {
    add(`표${i + 1} 제목`, t.caption);
    (t.columns ?? []).forEach((c, j) => add(`표${i + 1} 열${j + 1}`, c));
    (t.rows ?? []).forEach((row, r) =>
      row.forEach((cell, c) => add(`표${i + 1} ${r + 1}행${c + 1}열`, cell))
    );
  });

  // 마크다운 블록에서 "소스에 그대로 있어야 하는 순수 텍스트"를 뽑는다.
  // block.p 등은 {html, text} 이므로 꾸밈 기호를 뗀 text 쪽을 대조 기준으로 쓴다.
  const blockText = (label, blocks) => {
    (blocks ?? []).forEach((block, j) => {
      if (typeof block === 'string') return add(`${label} 문단${j + 1}`, block);
      if (block.p) return add(`${label} 문단${j + 1}`, block.p.text);
      if (block.h3) return add(`${label} 소제목`, block.h3);
      if (block.list) return block.list.forEach((li, k) => add(`${label} 목록${k + 1}`, li.text));
      if (block.steps) return block.steps.forEach((li, k) => add(`${label} 단계${k + 1}`, li.text));
      if (block.quote) return add(`${label} 인용`, block.quote.text);
      if (block.table) {
        add(`${label} 표 제목`, block.table.caption);
        (block.table.rows ?? []).forEach((row, r) =>
          row.forEach((cell, c) => add(`${label} 표 ${r + 1}행${c + 1}열`, cell))
        );
      }
    });
  };

  blockText('도입', page.lead);

  (page.sections ?? []).forEach((s, i) => {
    add(`H2 ${i + 1}`, s.h2);
    blockText(`H2 ${i + 1}`, s.body);
  });

  (page.faq ?? []).forEach((f, i) => {
    add(`FAQ${i + 1} 질문`, f.q);
    add(`FAQ${i + 1} 답변`, f.a);
  });

  (page.related ?? []).forEach((r, i) => add(`관련문서${i + 1}`, r.label));

  return out;
}

async function main() {
  console.log(C.b('\n소스 보기 검증 (Ctrl+U 기준)\n'));

  if (!existsSync(DIST)) {
    console.log(C.err('dist/ 가 없습니다. 먼저 npm run build 를 실행하세요.\n'));
    process.exit(1);
  }

  const pages = await loadPages(CONTENT_DIR);
  const slugs = new Set(pages.map((p) => `/${String(p.slug ?? '').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/')));

  // ── 페이지별 검사 ────────────────────────────────────────
  for (const page of pages) {
    const file = htmlPathFor(page.slug);
    const rel = path.relative(DIST, file).replace(/\\/g, '/');
    console.log(C.b(`\n[${rel}]`) + C.dim(`  ← ${page._file}`));

    if (!existsSync(file)) {
      check(false, '파일 존재');
      continue;
    }

    const raw = await readFile(file, 'utf8');
    const source = unescapeHtml(raw);

    // 1) 본문 텍스트가 소스에 그대로 있는가
    const expected = expectedStrings(page);
    const missing = expected.filter((e) => !source.includes(e.text));
    check(
      missing.length === 0,
      `본문 텍스트가 소스에 존재 (${expected.length - missing.length}/${expected.length} 항목)`
    );
    for (const m of missing.slice(0, 5)) {
      console.log(C.err(`         누락 → ${m.label}: "${m.text.slice(0, 50)}…"`));
    }

    // 2) 실행 스크립트 0개
    const scripts = [...raw.matchAll(/<script\b([^>]*)>/gi)].map((m) => m[1]);
    const executable = scripts.filter((attrs) => !/application\/ld\+json/i.test(attrs));
    check(
      executable.length === 0,
      '실행 스크립트 0개 (JS로 그려지는 텍스트 없음)',
      `<script> ${scripts.length}개 중 JSON-LD ${scripts.length - executable.length}개`
    );

    // 3) 정본 문장
    check(
      source.includes(CANONICAL_SENTENCE),
      '정본 문장이 소스에 글자 단위로 존재'
    );

    // 3-1) 전역 색인 차단이 켜져 있으면 예외 없이 noindex여야 한다
    if (site.noindexAll) {
      check(
        /<meta name="robots" content="noindex, nofollow">/.test(raw),
        '색인 차단(noindex, nofollow) 적용됨',
        '전역 차단 중'
      );
    }

    // 4) JSON-LD 유효성 + @graph 연결
    const ldMatch = raw.match(
      /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/i
    );
    let graph = null;
    if (ldMatch) {
      try {
        graph = JSON.parse(ldMatch[1].replace(/\\u003c/g, '<'))['@graph'];
      } catch {
        graph = null;
      }
    }
    check(Array.isArray(graph) && graph.length > 0, 'JSON-LD 파싱 가능 + @graph 존재',
      Array.isArray(graph) ? `노드 ${graph.length}개: ${graph.map((n) => [].concat(n['@type']).join('/')).join(', ')}` : '');

    if (Array.isArray(graph)) {
      const ids = new Set(graph.map((n) => n['@id']).filter(Boolean));
      const refs = [];
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (node && typeof node === 'object') {
          const keys = Object.keys(node);
          if (keys.length === 1 && keys[0] === '@id') refs.push(node['@id']);
          else keys.forEach((k) => walk(node[k]));
        }
      };
      graph.forEach(walk);
      const dangling = refs.filter((r) => !ids.has(r));
      check(dangling.length === 0, `@graph 노드 참조가 전부 연결됨 (참조 ${refs.length}개)`,
        dangling.length ? `끊김: ${[...new Set(dangling)].join(', ')}` : '');

      const orgNode = graph.find((n) => [].concat(n['@type']).includes('Organization'));
      check(
        orgNode?.description === CANONICAL_SENTENCE,
        'Organization.description == 정본 문장'
      );
    }

    // 5) 소스 대비 실제 텍스트 비중 — 낮으면 껍데기 페이지라는 뜻
    const textOnly = raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    check(textOnly.length > 300, '렌더링 없이 읽히는 본문 분량', `${textOnly.length}자`);

    // 6) 내부 링크가 실제 페이지를 가리키는가
    //    하위 경로 배포(basePath)가 걸려 있으면 떼어내고 대조한다
    const internal = [...raw.matchAll(/href="(\/[^"#?]*)"/g)]
      .map((m) => m[1])
      .filter((h) => !/\.(css|xml|txt|png|jpg|svg|ico|webp)$/i.test(h))
      .map((h) => (site.basePath && h.startsWith(site.basePath) ? h.slice(site.basePath.length) || '/' : h));
    const broken = [...new Set(internal)].filter((h) => !slugs.has(h.endsWith('/') ? h : `${h}/`));
    check(broken.length === 0, `내부 링크 유효 (${[...new Set(internal)].length}개)`,
      broken.length ? `깨짐: ${broken.join(', ')}` : '');
  }

  // ── 사이트 전역 파일 ─────────────────────────────────────
  console.log(C.b('\n[사이트 전역]'));

  const robotsPath = path.join(DIST, 'robots.txt');
  if (check(existsSync(robotsPath), 'robots.txt 존재')) {
    const robots = await readFile(robotsPath, 'utf8');
    const allBots = [...bots.search, ...bots.training, ...bots.classic];
    const missingBots = allBots.filter(
      (b) => !new RegExp(`User-agent:\\s*${b}\\s*\\nAllow:\\s*/`, 'i').test(robots)
    );
    check(missingBots.length === 0, `AI 봇 ${allBots.length}종 전부 Allow: /`,
      missingBots.length ? `누락: ${missingBots.join(', ')}` : bots.search.join(', '));
    check(
      robots.includes(`Sitemap: ${site.baseUrl}/sitemap.xml`),
      'robots.txt 에 sitemap 경로 기재'
    );
    check(!/^\s*Disallow:\s*\/\s*$/m.test(robots), '전체 차단(Disallow: /) 없음');
  }

  const sitemapPath = path.join(DIST, 'sitemap.xml');
  if (check(existsSync(sitemapPath), 'sitemap.xml 존재')) {
    const sitemap = await readFile(sitemapPath, 'utf8');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const indexable = site.noindexAll ? [] : pages.filter((p) => !p.noindex && !p.draft);
    check(
      locs.length === indexable.length,
      `sitemap URL 수 == 색인 대상 페이지 수`,
      site.noindexAll ? `${locs.length}개 (전역 색인 차단 중이므로 0이어야 정상)` : `${locs.length}개`
    );
    check(
      locs.every((l) => l.startsWith(site.baseUrl)),
      `모든 URL 이 ${site.baseUrl} 절대경로`
    );
    const noindexUrls = pages.filter((p) => p.noindex || p.draft).map((p) => p.slug);
    check(
      !locs.some((l) => noindexUrls.some((s) => s && l.includes(`/${s}/`))),
      'noindex 페이지는 sitemap 에서 제외됨'
    );
  }

  // ── 결과 ────────────────────────────────────────────────
  console.log('');
  if (failures === 0) {
    console.log(C.ok(C.b('전 항목 통과 — 본문 텍스트가 페이지 소스에 정적으로 존재합니다.\n')));
    console.log(C.dim('  브라우저에서 직접 확인: npm run serve → Ctrl+U → Ctrl+F 로 본문 문장 검색\n'));
  } else {
    console.log(C.err(C.b(`실패 ${failures}건 — 위 항목을 고쳐야 합니다.\n`)));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(C.err('\n검증 실패:'), err);
  process.exit(1);
});
