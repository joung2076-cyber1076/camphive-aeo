#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
//  빌드 스크립트 — 의존성 0개
//
//  src/content/*.mjs  →  dist/<slug>/index.html
//  + dist/sitemap.xml (자동 생성)
//  + dist/robots.txt  (site.config.mjs 의 봇 목록으로 자동 생성)
//  + dist/styles.css
//
//  실행: npm run build
// ─────────────────────────────────────────────────────────────

import { readdir, mkdir, writeFile, copyFile, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { site, org, bots } from './site.config.mjs';
import { loadPages } from './src/lib/content.mjs';
import { buildGraph } from './src/lib/jsonld.mjs';
import { renderDocument } from './src/lib/layout.mjs';
import { renderArticle } from './src/lib/render-article.mjs';
import { renderHome } from './src/lib/render-home.mjs';
import { validatePage } from './src/lib/validate.mjs';
import { urlFor } from './src/lib/html.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(ROOT, 'src', 'content');
const STATIC_DIR = path.join(ROOT, 'static');
const DIST = path.join(ROOT, 'dist');

const C = {
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\x1b[0m`,
  err: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  b: (s) => `\x1b[1m${s}\x1b[0m`,
};

function outputPathFor(slug) {
  const s = String(slug ?? '').replace(/^\/+|\/+$/g, '');
  return s ? path.join(DIST, ...s.split('/'), 'index.html') : path.join(DIST, 'index.html');
}

function buildRobotsTxt() {
  const block = (name) => `User-agent: ${name}\nAllow: /`;
  return [
    `# ${site.baseUrl.replace(/^https?:\/\//, '')} — robots.txt`,
    `# 이 사이트는 AI가 읽고 인용하라고 만든 사이트다. 전 봇 전면 허용.`,
    `# 이 파일은 site.config.mjs 로부터 자동 생성된다. 직접 수정하지 말 것.`,
    '',
    '# ── AI 검색·인용 봇 (답변에 우리 문장이 인용되는 경로) ──',
    bots.search.map(block).join('\n\n'),
    '',
    '# ── AI 학습 봇 (모델 자체에 회사가 각인되는 경로) ──',
    bots.training.map(block).join('\n\n'),
    '',
    '# ── 일반 검색엔진 ──',
    bots.classic.map(block).join('\n\n'),
    '',
    '# ── 그 외 모든 봇 ──',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${site.baseUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

/** 색인 대상 = 전역 차단이 꺼져 있고, 자리표시자도 아닌 페이지 */
export function indexablePages(pages) {
  if (site.noindexAll) return [];
  return pages.filter((p) => !p.noindex && !p.draft);
}

function buildSitemap(pages) {
  const entries = indexablePages(pages)
    .map((p) => {
      const url = urlFor(site.baseUrl, p.slug);
      const priority = p.type === 'home' ? '1.0' : '0.8';
      return `  <url>
    <loc>${url}</loc>${p.updated ? `\n    <lastmod>${p.updated}</lastmod>` : ''}
    <changefreq>${p.changefreq ?? 'monthly'}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

async function copyStatic() {
  if (!existsSync(STATIC_DIR)) return [];
  const copied = [];
  const walk = async (dir, rel = '') => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const from = path.join(dir, entry.name);
      const relPath = path.posix.join(rel, entry.name);
      if (entry.isDirectory()) {
        await walk(from, relPath);
      } else {
        const to = path.join(DIST, ...relPath.split('/'));
        await mkdir(path.dirname(to), { recursive: true });
        await copyFile(from, to);
        copied.push(relPath);
      }
    }
  };
  await walk(STATIC_DIR);
  return copied;
}

async function main() {
  console.log(C.b('\n캠핑하이브 AEO 사이트 빌드\n'));

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  const pages = await loadPages(CONTENT_DIR);
  if (!pages.length) {
    console.log(C.err('src/content/ 에 마크다운(.md) 페이지가 없습니다.'));
    process.exit(1);
  }

  // ── 구조 검사 ────────────────────────────────────────────
  let errorCount = 0;
  for (const page of pages) {
    const { errors, warnings } = validatePage(page);
    for (const w of warnings) console.log(C.warn(`  경고  ${page._file}: ${w}`));
    for (const e of errors) {
      console.log(C.err(`  오류  ${page._file}: ${e}`));
      errorCount++;
    }
  }
  if (errorCount) {
    console.log(
      C.err(`\n구조 검사 실패 — 오류 ${errorCount}건. 빌드를 중단합니다.\n`) +
        C.dim('  규격을 벗어난 페이지는 AI가 인용하지 못합니다. 고친 뒤 다시 실행하세요.\n')
    );
    process.exit(1);
  }

  // ── 렌더링 ───────────────────────────────────────────────
  const ctx = {
    site,
    org,
    allPages: pages,
    nav: pages.filter((p) => p.nav),
  };

  const written = [];
  for (const page of pages) {
    const graph = buildGraph(page, ctx);
    const main = page.type === 'home' ? renderHome(page, ctx) : renderArticle(page, ctx);
    const html = renderDocument(page, ctx, graph, main);

    const out = outputPathFor(page.slug);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, html, 'utf8');
    written.push(path.relative(ROOT, out));

    const size = (await stat(out)).size;
    const flag = page.noindex ? C.dim(' [noindex]') : '';
    console.log(`  ${C.ok('생성')}  ${path.relative(DIST, out).replace(/\\/g, '/')}  ${C.dim(`${(size / 1024).toFixed(1)}KB`)}${flag}`);
  }

  // ── robots.txt / sitemap.xml / 정적 파일 ─────────────────
  await writeFile(path.join(DIST, 'robots.txt'), buildRobotsTxt(), 'utf8');
  console.log(`  ${C.ok('생성')}  robots.txt  ${C.dim(`${bots.search.length + bots.training.length + bots.classic.length}개 봇 허용`)}`);

  const indexed = indexablePages(pages);
  await writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(pages), 'utf8');
  console.log(`  ${C.ok('생성')}  sitemap.xml  ${C.dim(`${indexed.length}개 URL`)}`);
  if (site.noindexAll) {
    console.log(
      C.warn('\n  ⛔ site.noindexAll = true — 전 페이지 색인 차단 중입니다.') +
        C.dim('\n     홈을 포함한 모든 페이지에 noindex가 붙고 sitemap이 비어 있습니다.') +
        C.dim('\n     해제는 아키 지시가 있을 때만 site.config.mjs에서 합니다.')
    );
  }

  await copyFile(path.join(ROOT, 'src', 'styles.css'), path.join(DIST, 'styles.css'));
  console.log(`  ${C.ok('생성')}  styles.css`);

  const copied = await copyStatic();
  for (const f of copied) console.log(`  ${C.ok('복사')}  ${f}`);

  console.log(C.b(`\n완료 — ${written.length}개 페이지, 출력 위치 dist/\n`));
  console.log(C.dim('  다음: npm run verify  (소스 보기 검증)\n'));
}

main().catch((err) => {
  console.error(C.err('\n빌드 실패:'), err);
  process.exit(1);
});
