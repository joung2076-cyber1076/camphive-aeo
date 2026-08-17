#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
//  소스 보기 검증 — 이 프로젝트의 절대 요건을 기계로 확인한다.
//
//  검사 항목:
//   1. 본문 텍스트가 HTML 소스에 그대로 있는가 (Ctrl+U 통과 여부)
//   2. JS가 본문을 그리지 않는가 (인라인 스크립트 0개 + JS 제거해도 본문 유지)
//   3. 정본 문장이 전 페이지에 글자 단위로 동일하게 있는가
//   4. JSON-LD 가 유효한 JSON 이고 @graph 노드가 서로 연결되어 있는가
//   5. sitemap / robots 가 존재하고 봇이 전부 허용되어 있는가
//   6. 내부 링크가 basePath 를 타고 실제 파일에 닿는가 (12-1)
//   7. 금칙어(자칭 수식어·성과 약속·옛 명칭)가 산출물에 없는가 (12-2)
//
//  실행: npm run verify
// ─────────────────────────────────────────────────────────────

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { site, bots, CANONICAL_SENTENCE } from './site.config.mjs';
import { loadPages } from './src/lib/content.mjs';

// 랜딩 카피 데이터 — 없으면 그 검사만 건너뛴다
let LANDING = null;
try {
  ({ LANDING } = await import('./src/content/home.data.mjs'));
} catch {
  LANDING = null;
}

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const CONTENT_DIR = path.join(ROOT, 'src', 'content');
// 홈 카피의 정본. 홈 본문 존재 검사의 기대값을 여기서 뽑는다.
const DESIGN_FILE = path.join(ROOT, 'src', 'design', 'home.dc.html');

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

/** 실패로 세지 않고 눈에만 띄게 한다. 규격은 아니지만 봐야 하는 것. */
function warn(label, detail = '') {
  console.log(`  ${C.warn('경고')}  ${label}${detail ? C.dim(`  ${detail}`) : ''}`);
}

// ── 질의 3원칙 (2026-08-14 확정) ────────────────────────────
//  ① 업종어 필수 ② 운영주 시점 ③ 반말 구어체
//  ①·③ 만 기계로 잡는다. ②는 문장을 읽어야 판단할 수 있다.
//
//  검사 대상은 "질문"뿐이다. 물음표로 끝나지 않는 H2("지금 할 수 있는
//  3단계" 등)는 질문이 아니므로 건드리지 않는다.
//  기업정보·자료실 페이지는 질의를 노리는 문서가 아니라 제외한다.
/**
 * 검사는 소스가 아니라 배포 산출물(dist)을 본다.
 * AI가 읽는 것은 산출물이다.
 * 2026-08-16 FAQ 이중 소스 사고의 재발 방지. 지침 6.3.6.4
 *
 * 아래 두 함수가 그 원칙의 도구다. 질문·FAQ 를 데이터 파일이 아니라
 * 빌드된 HTML 에서 뽑는다.
 */
const flatText = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** 산출물의 <details>/<summary> 에서 FAQ 를 뽑는다. */
function faqFromHtml(html) {
  return (html.match(/<details[\s\S]*?<\/details>/g) ?? []).map((d) => {
    const sm = d.match(/<summary[\s\S]*?>([\s\S]*?)<\/summary>/);
    return {
      q: flatText(sm ? sm[1] : '').replace(/^Q\d+\s*/, ''),
      a: flatText(d.replace(/<summary[\s\S]*?<\/summary>/, '')),
    };
  });
}

/** 산출물의 <main> 안 제목을 단계별로 뽑는다. 헤더·푸터는 제외한다. */
function headingsFromHtml(html) {
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? html;
  const grab = (tag) =>
    [...main.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))]
      .map((m) => flatText(m[1]))
      .filter(Boolean);
  return { h1: grab('h1'), h2: grab('h2'), h3: grab('h3') };
}

const CORPORATE_SLUGS = new Set([
  'about', 'contact', 'privacy',
  'intro/company', 'intro/consulting', 'intro/ai-marketing',
]);
const POLITE_ENDING = /(나요|가요|까요|습니까|해요)\?\s*$/;
const INDUSTRY_WORD = /(캠핑장|글램핑)/;

/** 업종어 예외 — 파일·문장 단위로 사유를 적어서만 연다. 규칙을 끄지 않는다. */
const INDUSTRY_EXCEPTIONS = [
  // 예) { slug: 'faq/xxx', text: '…?', why: '…' }
];

/** HTML 엔티티를 되돌려, 원고 문자열과 소스를 같은 기준으로 비교한다. */
/** 공백을 한 칸으로 눌러 비교한다. 줄바꿈·들여쓰기 차이로 어긋나지 않게. */
function norm(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}

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
async function expectedStrings(page) {
  const out = [];
  const add = (label, text) => {
    if (text && String(text).trim()) out.push({ label, text: String(text).trim() });
  };

  // 홈(랜딩)은 2026-08-15 부터 시안(src/design/home.dc.html)을 그대로
  // 출력한다. 카피의 정본이 home.data.mjs 가 아니라 시안 파일이다.
  //
  // 2026-08-16 — 예전에는 여기서 홈을 통째로 빼고 그 아래 LANDING 순회
  // 코드를 두었는데, early return 때문에 그 코드가 한 번도 실행되지
  // 않았다(죽은 코드). 홈만 관문 ②의 기본 검사를 안 받고 있었다.
  //
  // 기대값을 시안 **원문**(transform 전)에서 뽑아 되살린다.
  //   잡는 것 — transform() 이 문장을 삼키거나, 문서 조립에서 <main> 이
  //   누락되거나, 자리표시자 치환이 본문을 지우는 경우.
  //   못 잡는 것 — 시안 자체에 문장이 없는 경우(그건 디자인 문제다).
  // 시안 원문과 산출물 사이에 변환 단계가 있으므로 "같은 파일을 복사해
  // 자동 통과"가 아니다. 실제로 그 사이에서 텍스트가 사라질 수 있다.
  if (page.type === 'landing') {
    const dcRaw = await readFile(DESIGN_FILE, 'utf8');
    const mainRaw = dcRaw.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
    // <sc-if> 는 "제출 뒤" 상태라 첫 화면이 아니다. transform() 이 통째로
    // 지우므로 기대값에서도 뺀다(render-dc.mjs 93행과 같은 규칙).
    const cleaned = mainRaw.replace(/<sc-if\b[^>]*>[\s\S]*?<\/sc-if>/gi, '');

    // 존재 여부가 아니라 **출현 횟수**를 센다 (2026-08-16 강화).
    //
    //  존재 여부만 보면 같은 문장이 두 곳에 있을 때 한 곳이 사라져도
    //  다른 곳에서 매칭돼 통과한다. 실제로 커버에 두 번 나오는
    //  「손님이 고르지…」가 그렇게 빠져나갔다.
    //  시안 원문에서 N번 나오면 산출물에서도 N번이어야 한다.
    const counts = new Map();
    for (const m of cleaned.matchAll(/>([^<>{}]{12,})</g)) {
      // 산출물은 unescapeHtml 을 거친 뒤 비교되므로 기대값도 같은 기준으로 편다
      const s = unescapeHtml(m[1]).replace(/\s+/g, ' ').trim();
      if (!s || s.includes('{{') || /^[\s·|—-]+$/.test(s)) continue;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    let n = 0;
    for (const [text, expect] of counts) {
      n += 1;
      out.push({ label: `시안 본문 ${n}${expect > 1 ? ` (${expect}회)` : ''}`, text, expect });
    }
    return out;
  }

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
    //
    //    문장 중간에 <strong> 이 끼면 원문 문자열이 통으로는 안 잡힌다.
    //    ("**굵게**" 를 쓰면 A<strong>B</strong>C 가 되어 "ABC" 로는 못 찾는다)
    //    사람이 소스를 읽을 때는 태그가 보이지 않으므로, 태그를 걷어낸
    //    평문에서도 한 번 더 찾는다. 둘 중 하나만 걸리면 통과다.
    const expected = await expectedStrings(page);
    const plain = norm(source.replace(/<[^>]+>/g, ''));

    // expect 가 붙은 항목(홈)은 횟수까지 맞아야 한다.
    // 산출물 쪽도 <main> 안에서만 센다 — JSON-LD 에 같은 문장이 있으면
    // 화면과 무관하게 횟수가 늘어 오탐이 난다.
    // 산출물 쪽도 기대값과 **똑같은 방식**으로 뽑아 센다. 단순 부분 문자열
    // 카운트는 짧은 문장이 긴 문장 안에 포함될 때 더 세어져 오탐이 난다.
    const mainOut = source.match(/<main[\s\S]*?<\/main>/)?.[0] ?? source;
    const outCounts = new Map();
    for (const m of mainOut.matchAll(/>([^<>{}]{12,})</g)) {
      const s = unescapeHtml(m[1]).replace(/\s+/g, ' ').trim();
      if (!s) continue;
      outCounts.set(s, (outCounts.get(s) ?? 0) + 1);
    }
    const missing = [];
    for (const e of expected) {
      if (e.expect) {
        const got = outCounts.get(e.text) ?? 0;
        if (got !== e.expect) missing.push({ ...e, got });
      } else if (!source.includes(e.text) && !plain.includes(norm(e.text))) {
        missing.push(e);
      }
    }
    check(
      missing.length === 0,
      `본문 텍스트가 소스에 존재 (${expected.length - missing.length}/${expected.length} 항목)`
    );
    for (const m of missing.slice(0, 5)) {
      const how = m.expect ? ` [${m.expect}회 있어야 하는데 ${m.got}회]` : '';
      console.log(C.err(`         누락 → ${m.label}${how}: "${m.text.slice(0, 46)}…"`));
    }

    // 2) JS가 본문을 그리지 않는가
    //
    //    예전 규칙은 "<script> 0개"였다. 그러나 지시된 진입 페이드·카운트업·
    //    헤더 변형은 JS 없이 만들 수 없다. 그래서 규칙을 '스크립트 금지'가 아니라
    //    '스크립트가 텍스트를 만들지 못함'으로 바꾼다. 지키려던 것은 애초에
    //    "AI 크롤러가 JS를 실행하지 않아도 본문이 전부 보인다"였고, 그것은
    //    아래 두 가지로 보장된다.
    //      · 인라인 스크립트 금지 — 외부 파일 1개(enhance.js)만 허용
    //      · 그 파일이 텍스트 생성 API를 쓰지 않음 (아래 6-1에서 검사)
    //    본문 존재 자체는 위 1)이 원문 문자열 대조로 이미 확인한다.
    const scripts = [...raw.matchAll(/<script\b([^>]*)>/gi)].map((m) => m[1]);
    const jsonLd = scripts.filter((a) => /application\/ld\+json/i.test(a));
    const other = scripts.filter((a) => !/application\/ld\+json/i.test(a));
    const allowed = other.filter((a) => /\bsrc="[^"]*enhance\.js[^"]*"/i.test(a));
    check(
      other.length === allowed.length,
      '인라인 스크립트 0개 (외부 enhance.js 외 실행 스크립트 없음)',
      `<script> ${scripts.length}개 = JSON-LD ${jsonLd.length} + enhance.js ${allowed.length}`
    );

    // 2-1) 스크립트를 지운 상태에서도 본문이 그대로 남는가
    //      = JS를 실행하지 않는 크롤러가 보는 화면
    const noJs = unescapeHtml(raw.replace(/<script[\s\S]*?<\/script>/gi, ''));
    const noJsPlain = norm(noJs.replace(/<[^>]+>/g, ''));
    const missingNoJs = expected.filter(
      (e) => !noJs.includes(e.text) && !noJsPlain.includes(norm(e.text))
    );
    check(
      missingNoJs.length === 0,
      `JS를 지워도 본문 전부 존재 (${expected.length - missingNoJs.length}/${expected.length} 항목)`
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

      // ── 5) 정본 문장 5곳 완전 일치 ───────────────────────
      //
      //  푸터 + JSON-LD 4노드. 조사 하나, 마침표 하나 다르면 실패다.
      //  AI 는 여러 위치에서 완전히 같은 문장을 반복 확인해야 그 표현을
      //  회사의 정의로 굳힌다. 한 글자라도 흔들리면 자기 말로 요약해버리고
      //  우리가 쓴 문장은 답변에 남지 않는다.
      const nodeDesc = (type) =>
        graph.find((n) => [].concat(n['@type']).includes(type))?.description;

      //  2026-08-15 — 푸터 화면 노출을 없앴으므로 검사 대상은 JSON-LD 4곳이다.
      //  화면에서 뺀 것이지 문장을 버린 것이 아니다. 아래 4곳은 그대로 검사한다.
      const spots = [
        ['Organization.description', nodeDesc('Organization')],
        ['LocalBusiness.description', nodeDesc('LocalBusiness')],
        ['WebSite.description', nodeDesc('WebSite')],
        // Service 는 홈에만 있다. 없는 페이지에서는 검사 대상에서 뺀다.
        ...(graph.some((n) => [].concat(n['@type']).includes('Service'))
          ? [['Service.description', nodeDesc('Service')]]
          : []),
      ];
      const mismatched = spots.filter(([, v]) => v !== CANONICAL_SENTENCE);
      check(
        mismatched.length === 0,
        `정본 문장 ${spots.length}곳 완전 일치`,
        mismatched.length ? '' : spots.map(([k]) => k.split('.')[0]).join(' · ')
      );
      for (const [where, got] of mismatched) {
        console.log(C.err(`         ${where}: ${got === undefined ? '(없음)' : `"${String(got).slice(0, 60)}…"`}`));
      }
    }

    // 4-3) 화면 FAQ ↔ JSON-LD FAQPage 일치 (신설 2026-08-16)
    //
    //  Google 구조화 데이터 정책 — "Don't mark up content that is not visible
    //  to readers of the page." 화면과 JSON-LD 가 어긋나면 AI 는 우리 페이지에
    //  없는 문장을 우리 것으로 인용한다.
    //
    //  실제로 새 나갔던 것: 화면에 없는 유령 문항 1개, 질문 13건의 접두어 차이,
    //  화면에 없는 답변 문장 2건. 검사 26종이 전부 통과인 상태에서 새고 있었다.
    //  원인은 화면(시안 마크업)과 JSON-LD(데이터 파일)의 소스가 갈린 것이다.
    //  경고가 아니라 실패로 처리한다 — 배포를 막아야 한다.
    if (graph) {
      const details = raw.match(/<details[\s\S]*?<\/details>/g) ?? [];
      if (details.length) {
        const flat = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const screen = details.map((d) => {
          const sm = d.match(/<summary[\s\S]*?>([\s\S]*?)<\/summary>/);
          return {
            // 번호 배지(Q1…)는 표기용이라 질문 본문에서 뺀다
            q: flat(sm ? sm[1] : '').replace(/^Q\d+\s*/, ''),
            a: flat(d.replace(/<summary[\s\S]*?<\/summary>/, '')),
          };
        });
        const faqNode = graph.find((n) => [].concat(n['@type']).includes('FAQPage'));
        const items = (faqNode?.mainEntity ?? []).map((e) => ({
          q: flat(String(e.name ?? '')),
          a: flat(String(e.acceptedAnswer?.text ?? '')),
        }));

        const sameCount = items.length === screen.length;
        check(sameCount, '화면 FAQ ↔ JSON-LD 개수 일치', `화면·JSON-LD 각 ${screen.length}개`);
        if (!sameCount) {
          console.log(C.err(`         화면 <details> ${screen.length}개 · mainEntity ${items.length}개`));
          const extra = items.slice(screen.length);
          for (const e of extra.slice(0, 3)) console.log(C.err(`         JSON-LD 에만: "${e.q}"`));
        }

        const n = Math.min(items.length, screen.length);
        const qBad = [];
        const aBad = [];
        for (let i = 0; i < n; i += 1) {
          if (items[i].q !== screen[i].q) qBad.push(i + 1);
          if (items[i].a !== screen[i].a) aBad.push(i + 1);
        }
        check(qBad.length === 0, '화면 FAQ ↔ JSON-LD 질문 일치', qBad.length ? '' : `${n}개 글자 단위 일치`);
        for (const i of qBad.slice(0, 5)) {
          console.log(C.err(`         [${i}] 화면   : "${screen[i - 1].q}"`));
          console.log(C.err(`             JSON-LD: "${items[i - 1].q}"`));
        }
        check(aBad.length === 0, '화면 FAQ ↔ JSON-LD 답변 일치', aBad.length ? '' : `${n}개 글자 단위 일치`);
        for (const i of aBad.slice(0, 5)) {
          console.log(C.err(`         [${i}] 화면 ${screen[i - 1].a.length}자 / JSON-LD ${items[i - 1].a.length}자`));
          console.log(C.err(`             화면   : "${screen[i - 1].a.slice(0, 70)}…"`));
          console.log(C.err(`             JSON-LD: "${items[i - 1].a.slice(0, 70)}…"`));
        }
      }
    }

    // 4-4) JSON-LD 텍스트 ↔ 화면 본문 전역 대조 (신설 2026-08-16)
    //
    //  /privacy/ 프론트매터 요약문이 본문 5번(위탁 없음)과 정반대인 채로
    //  JSON-LD 에 나간 적이 있다. FAQ 일치 검사(4-3)는 FAQ 만 본다.
    //  같은 유형을 넓게 잡으려면 JSON-LD 의 사람이 읽는 문장이 그 페이지
    //  본문에도 있는지 봐야 한다.
    //
    //  ⚠ 지금은 경고다. 예외 목록이 채워지기 전에 실패로 걸면 빌드가 선다.
    //     색인 해제(noindexAll = false) 전까지 실패로 승격한다.
    //     색인 해제 점검표 항목이다. 경고인 채로 열지 말 것.
    if (graph) {
      // 문장형 필드만 본다. 식별자·연락처·URL 은 본문에 없는 것이 정상이다.
      const TEXT_KEYS = new Set(['description', 'headline', 'text', 'name']);
      const offenders = [];
      const visit = (node, type) => {
        if (!node || typeof node !== 'object') return;
        const t = [].concat(node['@type'] ?? type ?? []).join('/');
        for (const [k, v] of Object.entries(node)) {
          if (Array.isArray(v)) { v.forEach((x) => visit(x, t)); continue; }
          if (v && typeof v === 'object') { visit(v, t); continue; }
          if (typeof v !== 'string' || !TEXT_KEYS.has(k)) continue;
          const s = norm(v);
          if (s.length < 12) continue;

          // ── 예외 3종 — 사유 없이 지우지 말 것 ──────────────────
          //  ① 정본 문장 — 푸터 화면 노출을 없앤 결정(대장 I1, 2026-08-15).
          //     본문에 없는 것이 정상이다. 되돌리지 말 것.
          if (s === norm(CANONICAL_SENTENCE)) continue;
          //  ② WebPage.description — 메타 설명문. 본문에 없는 것이 정상.
          if (k === 'description' && t.includes('WebPage')) continue;
          //  ③ BreadcrumbList 항목명 — 화면 표기와 다를 수 있음.
          if (t.includes('BreadcrumbList') || t.includes('ListItem')) continue;
          //  Organization·LocalBusiness·WebSite 의 name 은 상호다.
          //  푸터 표기와 형태가 달라 본문 대조 대상이 아니다.
          if (k === 'name' && /Organization|LocalBusiness|WebSite|Service/.test(t)) continue;

          if (!plain.includes(s)) offenders.push({ where: `${t}.${k}`, text: s });
        }
      };
      graph.forEach((n) => visit(n, null));

      // 2026-08-17 — 경고에서 실패로 승격했다(아키 판정 2).
      //   경고로 두면 영구히 경고로 남는다는 것이 승격 사유였다. 승격 시점의
      //   위반은 0건이라 빌드가 멈추지 않는다.
      //   대상은 산출물이다 — plain 이 dist HTML 에서 태그를 걷어낸 값이고
      //   graph 도 같은 파일의 JSON-LD 다(6.3.6.4).
      check(
        offenders.length === 0,
        'JSON-LD 문장이 전부 본문에 있음',
        offenders.length ? '' : `${graph.length}개 노드 검사`
      );
      for (const o of offenders.slice(0, 5)) {
        console.log(C.err(`         ${o.where}: "${o.text.slice(0, 60)}…"`));
      }
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

    // ── 7) 질의 3원칙 — 문체·업종어 ──────────────────────
    const slugKey = String(page.slug ?? '').replace(/^\/+|\/+$/g, '');
    if (!page.template && !CORPORATE_SLUGS.has(slugKey)) {
      // 질문을 산출물에서 뽑는다 (2026-08-16 전환 · 지침 6.3.6.4).
      // 소스 데이터를 보면 "데이터에는 있고 화면에는 없는" 상태를 통과시킨다.
      // 실제로 업종어 검사가 그렇게 통과했다.
      const questions = [];
      if (page.type === 'landing') {
        // 랜딩은 FAQ만 대상이다. 섹션 H2는 시안 확정 카피라 질의가 아니다.
        faqFromHtml(raw).forEach((f, i) => questions.push([`홈 FAQ ${i + 1}`, f.q]));
      } else {
        headingsFromHtml(raw).h1.forEach((h) => questions.push(['H1', h]));
        headingsFromHtml(raw)
          .h2.filter((h) => /\?\s*$/.test(h))
          .forEach((h, i) => questions.push([`H2 ${i + 1}`, h]));
        headingsFromHtml(raw).h3.filter((h) => /\?\s*$/.test(h))
          .forEach((h, i) => questions.push([`FAQ ${i + 1}`, h]));
      }

      // ── 반말 어미 검사 — 타깃 질의에만 적용한다 (2026-08-15 확정) ──
      //
      //  질의 3원칙은 원래 "손님이 AI 검색창에 실제로 치는 문장"을 잡기
      //  위한 규칙이다. 손님은 검색창에 "캠핑장 AEO 뭐야?" 라고 반말로
      //  친다. 그래서 하위 페이지의 H1·타깃 질의는 반말이어야 한다.
      //
      //  홈 FAQ 는 성격이 다르다. 손님이 검색창에 치는 문장이 아니라
      //  우리가 손님에게 답하는 목록이고, 시안이 확정한 존댓말 카피다.
      //  여기에 반말을 강제하면 시안 카피를 뜯어고쳐야 한다.
      //
      //  ⚠ 검사를 끈 것이 아니라 대상을 나눈 것이다. 업종어 검사는
      //    홈 FAQ 에도 그대로 적용된다(아래). 약어 금지도 전체 유지다.
      //    되돌리지 말 것.
      const isLanding = page.type === 'landing';
      if (!isLanding) {
        const polite = questions.filter(([, q]) => POLITE_ENDING.test(q));
        check(
          polite.length === 0,
          `질문 ${questions.length}개 문체 — 타깃 질의는 반말이다(2026-08-14 확정)`,
          polite.length ? '' : '존댓말 어미 0건'
        );
        for (const [where, q] of polite.slice(0, 5)) console.log(C.err(`         ${where}: "${q}"`));
      } else {
        console.log(
          `  ${C.dim('건너뜀')}  반말 어미 검사 — 홈 FAQ 는 대상이 아니다(시안 확정 존댓말 카피)`
        );
      }

      const noWord = questions.filter(([, q]) => {
        if (INDUSTRY_WORD.test(q)) return false;
        return !INDUSTRY_EXCEPTIONS.some((e) => e.slug === slugKey && e.text === q);
      });
      check(
        noWord.length === 0,
        `질문 ${questions.length}개 업종어 — 모든 질문에 업종어(캠핑장·글램핑)가 있다(질의 3원칙 ①)`,
        noWord.length ? '' : '캠핑장·글램핑 포함'
      );
      for (const [where, q] of noWord.slice(0, 5)) console.log(C.err(`         ${where}: "${q}"`));

      // 질문에는 약어를 쓰지 않는다 (v9).
      // 운영주는 "예약 플랫폼"이라고 치지 "OTA"라고 치지 않는다.
      // 약어로 쓴 질문은 그 질의를 잡지 못한다.
      const abbrev = questions.filter(([, q]) => /OTA/.test(q));
      check(
        abbrev.length === 0,
        `질문 ${questions.length}개 약어 — 질문에는 약어를 쓰지 않는다(v9)`,
        abbrev.length ? '' : 'OTA 0건'
      );
      for (const [where, q] of abbrev.slice(0, 5)) console.log(C.err(`         ${where}: "${q}"`));

      // 본문에서 OTA 를 쓰려면 그 페이지 어딘가에 "예약 플랫폼(OTA)" 가
      // 한 번은 있어야 한다. 첫 등장에 묶어 두어야 AI 가 두 표현을
      // 같은 것으로 읽는다(지침 11.1 — 전문 용어는 첫 등장에서 풀이).
      if (/OTA/.test(source) && !source.includes('예약 플랫폼(OTA)')) {
        warn('본문에 OTA 가 있는데 "예약 플랫폼(OTA)" 병기가 없습니다 — 첫 등장에서 묶어 주십시오');
      }

      // 답변은 존댓말이어야 한다. 반말 종결이 섞이면 눈에 띄게만 한다.
      const casual = [];
      const scanBlocks = (blocks, label) => {
        for (const b of blocks ?? []) {
          const t = b?.p?.text;
          if (t && /(야|어|지)\.\s*$/.test(t)) casual.push([label, t]);
        }
      };
      scanBlocks(page.lead, '도입');
      (page.sections ?? []).forEach((s, i) => scanBlocks(s.body, `H2 ${i + 1}`));
      if (casual.length) {
        warn(`본문 ${casual.length}곳이 반말로 끝납니다 — 답변은 존댓말입니다`);
        for (const [where, t] of casual.slice(0, 3)) console.log(C.dim(`         ${where}: "…${t.slice(-32)}"`));
      }
    }
  }

  // ── 사이트 전역 파일 ─────────────────────────────────────
  console.log(C.b('\n[사이트 전역]'));

  // ── 12-1) 내부 링크 도달 검사 ────────────────────────────
  //
  //  "페이지가 존재한다"와 "링크가 그 페이지에 닿는다"는 다른 검사다.
  //  하위 경로 배포(/camphive-aeo/)에서 href="/privacy/" 라고 쓰면
  //  페이지는 멀쩡히 있는데 링크는 루트로 나가 404 가 된다.
  //  그래서 산출물의 href/src 를 실제 파일 경로로 풀어 존재를 확인하고,
  //  basePath 가 걸린 빌드에서는 접두사 누락 자체를 실패로 잡는다.
  const htmlFiles = [];
  const walkHtml = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walkHtml(full);
      else if (e.name.endsWith('.html')) htmlFiles.push(full);
    }
  };
  await walkHtml(DIST);

  const linkErrors = [];
  let linkCount = 0;
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    const from = path.relative(DIST, file).replace(/\\/g, '/');
    const links = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);

    for (const raw of links) {
      // 외부·앵커·특수 스킴은 대상이 아니다
      if (/^(https?:)?\/\//i.test(raw) || /^(mailto|tel|data):/i.test(raw)) continue;
      const clean = raw.split('#')[0].split('?')[0];
      if (!clean) continue;
      linkCount++;

      let rel;
      if (clean.startsWith('/')) {
        if (site.basePath) {
          if (clean !== site.basePath && !clean.startsWith(`${site.basePath}/`)) {
            linkErrors.push(`${from} → "${raw}" (basePath "${site.basePath}" 누락 — 루트로 나가 404)`);
            continue;
          }
          rel = clean.slice(site.basePath.length) || '/';
        } else {
          rel = clean;
        }
        rel = rel.replace(/^\/+/, '');
      } else {
        rel = path.posix.join(path.dirname(from), clean);
      }

      // 확장자가 없으면 디렉터리로 보고 index.html 을 찾는다
      const target = /\.[a-z0-9]+$/i.test(rel)
        ? path.join(DIST, ...rel.split('/'))
        : path.join(DIST, ...rel.split('/').filter(Boolean), 'index.html');

      if (!existsSync(target)) {
        linkErrors.push(`${from} → "${raw}" (없음: ${path.relative(DIST, target).replace(/\\/g, '/')})`);
      }
    }
  }
  check(
    linkErrors.length === 0,
    `내부 링크 도달 (${linkCount}개 검사, 404 ${linkErrors.length}건)`,
    linkErrors.length ? '' : `basePath="${site.basePath || '(없음)'}"`
  );
  for (const e of linkErrors.slice(0, 10)) console.log(C.err(`         ${e}`));

  // ── 중복 질의 검사 (질의 4원칙 ④) ────────────────────────
  //
  //  홈 FAQ 와 하위 페이지 H1 이 같은 질의를 겨냥하면 우리끼리 경쟁한다.
  //  AI 는 같은 질문에 대해 사이트 안에서 어느 쪽을 인용할지 정하지 못하고,
  //  결국 둘 다 밀린다.
  //
  //  유사도 판정은 사람이 봐야 하는 영역이라 실패가 아니라 경고로 둔다.
  //  겹치면 홈 FAQ 는 짧은 답 + 하위 페이지 링크로 처리하고
  //  전문은 하위 페이지가 갖는다.
  //
  //  ※ 하위 페이지에 원고가 들어오면 아래 3쌍이 충돌한다.
  //     지금은 그 페이지들이 비어 있어 문제되지 않는다.
  //       홈 4번  ↔ B4 캠핑장 홈페이지 꼭 있어야 돼?
  //       홈 7번  ↔ C4 소규모 캠핑장도 AI 마케팅 효과 있어?
  //       홈 11번 ↔ C3 캠핑장 GEO 마케팅 비용 얼마나 들어?
  const qkey = (s) => String(s).replace(/[^가-힣a-zA-Z0-9]/g, '');
  const bigrams = (s) => {
    const k = qkey(s);
    const out = new Set();
    for (let i = 0; i < k.length - 1; i++) out.add(k.slice(i, i + 2));
    return out;
  };
  const similarity = (a, b) => {
    const A = bigrams(a);
    const B = bigrams(b);
    if (!A.size || !B.size) return 0;
    let inter = 0;
    for (const g of A) if (B.has(g)) inter++;
    return inter / (A.size + B.size - inter);
  };

  // 양쪽 다 산출물에서 읽는다 (2026-08-16 전환 · 지침 6.3.6.4).
  const homeHtmlPath = htmlPathFor('');
  const homeFaq = existsSync(homeHtmlPath)
    ? faqFromHtml(await readFile(homeHtmlPath, 'utf8')).map((f) => f.q)
    : [];
  const subH1 = [];
  for (const p of pages) {
    if (!p.question || p.type === 'landing' || p.template) continue;
    if (CORPORATE_SLUGS.has(String(p.slug ?? '').replace(/^\/+|\/+$/g, ''))) continue;
    const f = htmlPathFor(p.slug);
    if (!existsSync(f)) continue;
    const [h1] = headingsFromHtml(await readFile(f, 'utf8')).h1;
    if (h1) subH1.push({ slug: p.slug, q: h1 });
  }

  const collisions = [];
  for (const [i, hq] of homeFaq.entries()) {
    for (const s of subH1) {
      const sim = similarity(hq, s.q);
      if (sim >= 0.6) collisions.push({ i: i + 1, hq, slug: s.slug, sq: s.q, sim });
    }
  }
  if (collisions.length) {
    warn(`홈 FAQ 와 하위 페이지 H1 이 겹칩니다 — ${collisions.length}쌍 (질의 4원칙 ④)`);
    for (const c of collisions) {
      console.log(C.dim(`         홈 FAQ ${c.i}: "${c.hq}"`));
      console.log(C.dim(`         /${c.slug}/: "${c.sq}"  유사도 ${(c.sim * 100).toFixed(0)}%`));
    }
  } else {
    check(true, `중복 질의 없음 (홈 FAQ ${homeFaq.length} × 하위 H1 ${subH1.length} 대조)`, '유사도 60% 이상 0쌍');
  }

  // ── 12-3) D12 색 토큰 대조 (2026-08-16 고정 · D26 해소) ──────
  //
  //  전에는 「실측 상위 빈도 13개」를 그때그때 뽑아 썼다. 그러면 회차마다
  //  목록이 바뀌어 전·후 대조가 성립하지 않는다. D12 13종을 배열로 못 박고
  //  이 배열만 대조 대상으로 쓴다. 0회여도 목록에서 빼지 않는다 —
  //  「사라졌다」는 사실 자체가 신호이기 때문이다.
  //
  //  대상 파일은 둘이다. D24 는 홈 렌더링의 전후 대조이므로 산출물이
  //  기준이지만, 시안 원문 쪽 값도 함께 내어 어느 단계에서 달라졌는지
  //  보이게 한다. 어느 쪽을 기준으로 삼을지는 아키가 정한다.
  const D12_TOKENS = [
    '#0b0e13', '#0f1319', '#12161d', '#161b22', '#1b212b',
    '#c4ccd8', '#8c96a6', '#3b82f6', '#60a5fa', '#2563eb',
    '#e8a33d', '#3dd6ac', '#e89476',
  ];
  {
    const designPath = DESIGN_FILE;
    const homeOut = htmlPathFor('');
    const countTokens = async (file) => {
      if (!existsSync(file)) return null;
      const t = await readFile(file, 'utf8');
      // 대소문자를 구분하지 않는다. 파일 표기는 대문자지만 규칙은 소문자다.
      return D12_TOKENS.map((tok) => [tok, (t.match(new RegExp(tok, 'gi')) ?? []).length]);
    };
    const inDesign = await countTokens(designPath);
    const inDist = await countTokens(homeOut);
    if (inDesign && inDist) {
      const zero = inDesign.filter(([, n], i) => n === 0 && inDist[i][1] === 0);
      check(
        true,
        `D12 색 토큰 ${D12_TOKENS.length}종 대조`,
        `시안·산출물 양쪽 집계 · 양쪽 0인 토큰 ${zero.length}종`
      );
      for (let i = 0; i < D12_TOKENS.length; i += 1) {
        const [tok, a] = inDesign[i];
        const b = inDist[i][1];
        console.log(C.dim(`         ${tok}  시안 ${String(a).padStart(3)}  산출물 ${String(b).padStart(3)}`));
      }
    } else {
      warn('D12 색 토큰 대조 — 대상 파일 없음', `${designPath} 또는 ${homeOut}`);
    }
  }

  // ── 12-2) 금칙어 검사 ────────────────────────────────────
  //
  //  자칭 수식어와 성과 약속, 쓰지 않기로 한 옛 명칭. 산출물에 하나라도
  //  있으면 실패다. 색인이 켜진 뒤에 발견하면 이미 학습된 뒤다.
  const BANNED = [
    'JS글램핑', 'JAYEONEURO', 'modoo', "Korea's Number One",
    '매출 상승', '최고의', '믿을 수 있는',
    // 추정 표현. robots.txt 원문 확인(2026-08-14)으로 이름 단위 차단이
    // 확인되었으므로 "차단하고 있습니다" 로 쓴다. 되돌아가지 않도록 막는다.
    '수집하기 어렵', '수집하지 못합니다',
    // 업종이 특정되지 않는 표현. 질의 3원칙 ① 위반이라 폐기했다.
    '우리 가게',
  ];
  const scanTargets = [];
  const walkAll = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walkAll(full);
      else if (/\.(html|css|js|txt|xml|svg)$/i.test(e.name)) scanTargets.push(full);
    }
  };
  await walkAll(DIST);

  // 예외는 파일 단위로, 사유를 적어서만 둔다.
  //
  //  금칙어 규칙의 뜻은 "우리를 이렇게 소개하지 않는다"다. 원고가 그 표현을
  //  '이렇게 쓰면 안 된다'는 반례로 인용하는 경우는 규칙을 어기는 게 아니라
  //  오히려 규칙을 설명하는 것이다. 그렇다고 단어를 통째로 풀면 자칭 표현이
  //  다시 들어와도 못 잡는다. 그래서 파일 하나, 단어 하나씩만 열어 둔다.
  const BANNED_EXCEPTIONS = [
    {
      file: 'faq/why-not-in-chatgpt/index.html',
      word: '최고의',
      why: '원고 표 3의 "이렇게 쓰면 인용되지 않습니다" 칸에 인용된 반례. 자칭이 아니다.',
    },
  ];

  const hits = [];
  for (const file of scanTargets) {
    const rel = path.relative(DIST, file).replace(/\\/g, '/');
    const body = await readFile(file, 'utf8');
    for (const word of BANNED) {
      if (!body.includes(word)) continue;
      const ex = BANNED_EXCEPTIONS.find((e) => e.file === rel && e.word === word);
      if (ex) {
        console.log(C.dim(`         예외 허용  "${word}" → ${rel}  (${ex.why})`));
        continue;
      }
      hits.push(`"${word}" → ${rel}`);
    }
  }
  check(
    hits.length === 0,
    `금칙어 ${BANNED.length}종 미사용 (${scanTargets.length}개 파일 검사)`,
    hits.length ? '' : BANNED.join(' · ')
  );
  for (const h of hits.slice(0, 10)) console.log(C.err(`         ${h}`));

  // enhance.js 가 텍스트를 만들어내지 않는지 — 만들면 그 글자는 소스에 없다
  const enhancePath = path.join(DIST, 'js', 'enhance.js');
  if (existsSync(enhancePath)) {
    const js = await readFile(enhancePath, 'utf8');
    // 주석은 코드가 아니다. 금지 API 이름을 주석에 적어 둔 것까지 잡히면
    // 규칙을 설명할 수가 없다.
    const code = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const banned = ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'createTextNode', 'createElement'];
    const found = banned.filter((b) => code.includes(b));
    check(
      found.length === 0,
      'enhance.js 가 텍스트·요소를 생성하지 않음',
      found.length ? `금지 API 사용: ${found.join(', ')}` : `${banned.length}종 전부 미사용`
    );
    check(
      js.includes('prefers-reduced-motion'),
      'enhance.js 가 prefers-reduced-motion 을 존중함'
    );
  }

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
