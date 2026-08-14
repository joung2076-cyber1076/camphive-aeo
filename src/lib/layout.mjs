// ─────────────────────────────────────────────────────────────
//  HTML 셸 (head / header / footer)
//
//  결과물에는 <script type="application/ld+json"> 외에 실행 스크립트가
//  단 한 줄도 들어가지 않는다. JS 0줄 = AI 크롤러에게 100% 읽히는 페이지.
// ─────────────────────────────────────────────────────────────

import { CANONICAL_SENTENCE } from '../../site.config.mjs';
import { esc, urlFor, pathFor, assetPath, krDate } from './html.mjs';
import { renderJsonLd } from './jsonld.mjs';
import { floatingButtons, LANDING } from './render-landing.mjs';

function head(page, ctx, graph) {
  const { site, org } = ctx;
  const url = urlFor(site.baseUrl, page.slug);
  const title = page.metaTitle ?? page.title ?? page.question ?? site.name;
  const desc = page.description ?? site.description;

  // 색인 차단 조건은 두 가지.
  //  1) site.noindexAll — 사이트 정체성 확정 전 전 페이지 차단 (아키 지시로만 해제)
  //  2) page.noindex    — 자리표시자·견본 등 개별 페이지 차단
  const robots = site.noindexAll || page.noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(url)}">
<meta name="author" content="${esc(site.legalName)}">
<meta name="publisher" content="${esc(site.legalName)}">
${page.updated ? `<meta name="last-modified" content="${esc(page.updated)}">` : ''}

<meta property="og:type" content="${page.type === 'home' ? 'website' : 'article'}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="${esc(site.locale)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<!-- 이미지 슬롯: og:image 1200×630. 파일이 준비되면 아래 주석을 푼다.
<meta property="og:image" content="${esc(site.baseUrl)}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630"> -->
${page.updated ? `<meta property="article:modified_time" content="${esc(page.updated)}">` : ''}
${page.published ? `<meta property="article:published_time" content="${esc(page.published)}">` : ''}

<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">

<meta name="geo.region" content="KR-41">
<meta name="geo.placename" content="${esc(org.address.locality)}">

<link rel="stylesheet" href="${assetPath('styles.css')}">
<link rel="sitemap" type="application/xml" href="${assetPath('sitemap.xml')}">
<link rel="icon" href="${assetPath('favicon.svg')}" type="image/svg+xml">

${renderJsonLd(graph)}`;
}

function header(page, ctx) {
  const { nav } = ctx;
  const links = (nav ?? [])
    .map((n) => {
      const href = pathFor(n.slug);
      const current = pathFor(page.slug) === href;
      return `<a href="${esc(href)}"${current ? ' aria-current="page"' : ''}>${esc(n.navLabel ?? n.title)}</a>`;
    })
    .join('\n        ');

  // 텍스트 로고. SVG 로고가 도착하면 이 span 을 교체한다(흰색 단색).
  // "Korea's Number One" 류의 자칭 수식어는 넣지 않는다.
  return `<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${esc(pathFor(''))}">
      <span class="brand-name">CAMPINGHIVE</span>
      <span class="brand-sub">Since 2014 · 전국 280곳</span>
    </a>
    ${links ? `<nav class="site-nav" aria-label="주요 메뉴">\n        ${links}\n      </nav>` : ''}
  </div>
</header>`;
}

function footer(ctx, page) {
  const { site, org } = ctx;
  // 갱신일 — 전 페이지 하단에 자동 삽입. AI는 시점이 적힌 정보를 더 신뢰한다.
  const stamp = page?.updated ?? page?.asOf ?? site.asOf ?? '';

  // 자료 3종은 PDF 직링크가 아니라 안내 페이지로 보낸다.
  // PDF를 직접 걸면 AI가 본문을 읽지 못하고 링크만 보게 된다.
  const docs = [
    ['회사소개서', '/intro/company/'],
    ['캠핑장 컨설팅', '/intro/consulting/'],
    ['AI마케팅 소개서', '/intro/ai-marketing/'],
  ];

  // 회사 정보 표 — AI가 사실 관계를 표 형태로 뽑아가기 좋은 형식.
  const rows = [
    ['상호', site.legalName],
    ['설립', `${org.foundingYear}년`],
    ['소재지', [org.address.region, org.address.locality, org.address.street].filter(Boolean).join(' ')],
    ['사업 분야', site.tagline],
    org.telephone ? ['대표번호', org.telephone] : null,
    org.email ? ['이메일', org.email] : null,
    org.businessNumber ? ['사업자등록번호', org.businessNumber] : null,
  ].filter(Boolean);

  const sameAs = org.sameAs?.length
    ? `<ul class="footer-links">${org.sameAs
        .map((u) => `<li><a href="${esc(u)}" rel="me noopener">${esc(u.replace(/^https?:\/\//, ''))}</a></li>`)
        .join('')}</ul>`
    : '';

  return `<footer class="site-footer">
  <div class="wrap">
    <h2 class="footer-title">${esc(site.legalName)}</h2>

    <!-- 정본 문장: 전 페이지 글자 단위 동일. 절대 수정 금지. -->
    <p class="canonical-sentence">${esc(site.legalName)}는 ${esc(CANONICAL_SENTENCE)}입니다.</p>

    <table class="company-facts">
      <caption>회사 개요</caption>
      <tbody>
        ${rows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('\n        ')}
      </tbody>
    </table>

    <nav class="footer-docs" aria-label="자료">
      ${docs.map(([label, href]) => `<a href="${esc(pathFor(href.replace(/^\/|\/$/g, '')))}">${esc(label)}</a>`).join('\n      ')}
    </nav>

    ${sameAs}

    ${stamp ? `<p class="updated-line">이 페이지의 정보는 <time datetime="${esc(stamp)}">${esc(stamp)}</time> 기준입니다.</p>` : ''}
    <p class="copyright">© ${org.foundingYear}–${new Date().getFullYear()} ${esc(site.legalName)}. 이 사이트의 내용은 출처를 밝히면 인용할 수 있습니다.</p>
  </div>
</footer>`;
}

/** 페이지 한 장의 완성된 HTML 문서를 만든다. */
export function renderDocument(page, ctx, graph, main) {
  // 랜딩은 섹션마다 배경이 바뀌므로 .wrap 을 각 섹션이 직접 갖는다.
  // 문서형 페이지는 지금까지대로 main 이 폭을 잡는다.
  const isLanding = page.type === 'landing';

  return `<!doctype html>
<html lang="${esc(ctx.site.lang)}">
<head>
${head(page, ctx, graph)}
</head>
<body>
<a class="skip" href="#main">본문 바로가기</a>
${header(page, ctx)}
<main id="main"${isLanding ? '' : ' class="wrap"'}>
${main}
</main>
${isLanding ? floatingButtons(LANDING.floating) : ''}
${footer(ctx, page)}
<script src="${assetPath('js/enhance.js')}" defer></script>
</body>
</html>
`;
}

export { krDate };
