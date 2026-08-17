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

import { readdir, mkdir, readFile, writeFile, copyFile, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { site, org, bots } from './site.config.mjs';
import { loadPages } from './src/lib/content.mjs';
import { buildGraph } from './src/lib/jsonld.mjs';
import { renderDocument } from './src/lib/layout.mjs';
import { renderArticle } from './src/lib/render-article.mjs';
import { renderHome } from './src/lib/render-home.mjs';
import { renderLanding, LANDING } from './src/lib/render-landing.mjs';
import { loadDesign } from './src/lib/render-dc.mjs';
import { renderDiagnosis } from './src/lib/render-diagnosis.mjs';
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
    // ⚠ loadPages 는 파일 경로순으로 정렬한다(빌드를 재현 가능하게 하려고).
    //   그 배열을 그대로 메뉴에 쓰면 가나다순이 되어 "홈"이 다섯 번째로 간다.
    //   메뉴 순서는 손님이 처음 보는 줄이므로 각 페이지의 navOrder 로 고정한다.
    nav: pages.filter((p) => p.nav).sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99)),
  };

  // 홈은 시안(src/design/home.dc.html)을 그대로 쓴다. 우리가 다시
  // 그리지 않는다. 디자인을 고칠 일이 있으면 그 파일을 고친다.
  const design = await loadDesign();

  const written = [];
  for (const page of pages) {
    // 랜딩의 FAQ 는 화면 마크업에서 뽑은 것을 쓴다.
    //
    // 전에는 LANDING.s14.items(데이터 파일)를 썼다. 화면은 시안에서,
    // JSON-LD 는 데이터에서 나오니 시안을 갈아끼울 때 한쪽만 바뀌어
    // 화면에 없는 문항·문장이 JSON-LD 로 나갔다(2026-08-16).
    // 이제 화면이 정본이고 JSON-LD 는 그 파생물이다.
    if (page.type === 'landing') page.faq = design.faq;

    const graph = buildGraph(page, ctx);
    const main =
      page.type === 'landing' ? ''   // 시안 마크업이 대신한다
      : page.type === 'diagnosis' ? renderDiagnosis(page, ctx)
      : page.type === 'home' ? renderHome(page, ctx)
      : renderArticle(page, ctx);
    const html = renderDocument(page, ctx, graph, main, design);

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

  // styles.css = 시안 폰트 3종의 서브셋 @font-face + 본 스타일시트.
  // 파일을 나눠 <link> 를 여러 개 걸면 렌더 차단 요청이 그만큼 늘어난다.
  // 빌드 때 붙여 하나로 내보낸다. (반복이 많은 텍스트라 압축이 잘 먹는다)
  //
  // 2026-08-15 — Pretendard·Archivo 를 걷어내고 시안 폰트로 갈았다.
  //   Noto Sans KR   본문·제목 (가변 wght 100~900)
  //   JetBrains Mono 수치·라벨
  // 둘 다 자체 호스팅이다. CDN 링크를 넣지 말 것.
  //
  // Noto Serif KR 은 넣지 않는다. 시안이 <link> 로 불러오기만 하고
  // font-family 선언이 0건이라 실사용이 없었다. 124개 파일 5.96MB 를
  // 저장소에서 뺐다. 강조에 세리프가 필요해지면 그때 다시 받는다.
  // ⚠ 이어붙이기 전에 BOM 과 @charset 을 떼어낸다.
  //
  //   2026-08-17 — 소스 CSS 세 개가 저마다 BOM 으로 시작한다. 그대로 이으면
  //   BOM 이 파일 **중간**에 들어가고, CSS 파서는 중간 BOM(U+FEFF)을 만나면
  //   그 지점의 규칙을 버린다. 실제로 :root 블록이 통째로 죽어 있었다 —
  //   --s1~--s32, --bg, --muted, --wrap 등 변수 전부가 빈 값이 되어
  //   하위 15페이지의 색과 간격이 폴백으로 그려지고 있었다.
  //   (푸터 사이트맵 링크가 gap 없이 붙어 보이던 것이 그 증상이다)
  //
  //   @charset 도 같다. 파일 맨 앞에서만 유효하고 중간에 있으면 무효인데,
  //   앞의 BOM 과 겹쳐 파서를 더 흔든다. 합칠 때는 떼고, 최종 결과의
  //   맨 앞에 한 번만 붙인다.
  const stripCssHead = (s) => s.replace(/^﻿/, '').replace(/^\s*@charset\s+["'][^"']*["'];\s*/i, '');

  const FONT_FILES = ['fonts-noto-sans-kr.css', 'fonts-jetbrains-mono.css'];
  const fontCss = (
    await Promise.all(FONT_FILES.map((f) => readFile(path.join(ROOT, 'src', f), 'utf8')))
  )
    .map(stripCssHead)
    .join('\n');
  const mainCss = stripCssHead(await readFile(path.join(ROOT, 'src', 'styles.css'), 'utf8'));
  await writeFile(path.join(DIST, 'styles.css'), `@charset "utf-8";\n${fontCss}\n${mainCss}`, 'utf8');

  // 홈 전용 — 폰트 선언만. 시안은 스타일을 전부 인라인 style 과 자체
  // <style> 블록에 담고 있어서, 여기에 우리 styles.css 를 얹으면
  // h1/h2/p/section 같은 요소 선택자가 시안 위에 덧칠된다.
  // "디자인 그대로"를 지키려면 홈에는 폰트만 준다.
  // 홈도 같은 이유로 맨 앞에 한 번만 붙인다(위 stripCssHead 설명 참조).
  await writeFile(path.join(DIST, 'home.css'), `@charset "utf-8";\n${fontCss}`, 'utf8');
  console.log(`  ${C.ok('생성')}  home.css  ${C.dim(`폰트 선언만 ${(fontCss.length / 1024).toFixed(1)}KB — 홈은 시안 스타일을 쓴다`)}`);
  console.log(
    `  ${C.ok('생성')}  styles.css  ${C.dim(
      `본문 ${(mainCss.length / 1024).toFixed(1)}KB + 폰트 선언 ${(fontCss.length / 1024).toFixed(1)}KB`
    )}`
  );

  const copied = await copyStatic();
  for (const f of copied) console.log(`  ${C.ok('복사')}  ${f}`);

  console.log(C.b(`\n완료 — ${written.length}개 페이지, 출력 위치 dist/\n`));
  console.log(C.dim('  다음: npm run verify  (소스 보기 검증)\n'));
}

main().catch((err) => {
  console.error(C.err('\n빌드 실패:'), err);
  process.exit(1);
});
