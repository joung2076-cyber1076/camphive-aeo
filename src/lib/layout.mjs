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
<!-- 방문 가능한 곳(포천 전시장) 기준. 공장이 아니다. -->
<meta name="geo.placename" content="${esc((org.showroom ?? org.address).locality)}">

<link rel="stylesheet" href="${assetPath(page.type === 'landing' ? 'home.css' : 'styles.css')}">
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

  // 심볼 + 텍스트. 심볼이 안 떠도 상호는 글자로 남아야 하므로
  // 로고를 글자 대체물로 쓰지 않는다.
  // "Korea's Number One" 류의 자칭 수식어는 넣지 않는다.
  return `<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${esc(pathFor(''))}">
      <img class="brand-mark" src="${assetPath('img/logo-mark.png')}" alt="캠핑하이브 심볼" width="32" height="32" decoding="async">
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
  //
  // 라벨에 업종어를 넣는다. 푸터 링크의 글자는 AI에게 "이 사이트가
  // 무엇을 주는 곳인가"를 알리는 신호다. "회사소개서"보다
  // "캠핑장 컨설팅 안내"가 우리 정체를 한 번 더 박아 준다.
  //
  // status 는 없는 것을 있다고 하지 않기 위한 줄이다.
  // PDF가 올라오면 "PDF · 25면" 형식으로 바꾼다.
  const docs = [
    { label: '캠핑하이브 회사소개서', slug: 'intro/company', status: 'PDF 준비 중' },
    { label: '캠핑장 컨설팅 안내', slug: 'intro/consulting', status: 'PDF 준비 중' },
    { label: '캠핑장 AI 마케팅 소개서', slug: 'intro/ai-marketing', status: 'PDF 준비 중' },
  ];

  // 하위 페이지 9개 — 푸터에서 전 페이지로 닿게 한다 (2026-08-15 확정).
  //
  // slug 만 적는다. 주소를 문자열로 박으면 하위 경로 배포(/camphive-aeo/)
  // 에서 루트로 나가 404 가 된다. pathFor() 가 basePath 를 붙인다.
  const siteLinks = [
    { slug: 'service', label: 'AI 검색 노출 방법' },
    { slug: 'measurement', label: '효과 측정' },
    { slug: 'diagnosis', label: '무료 진단' },
    { slug: 'faq', label: '자주 묻는 질문' },
    { slug: 'faq/why-not-in-chatgpt', label: '챗GPT에 안 나오는 이유' },
    { slug: 'faq/naver-blog-still-works', label: '네이버 블로그 효과' },
    { slug: 'faq/ad-budget', label: '홍보비 배분' },
    { slug: 'about', label: '회사 소개' },
    { slug: 'privacy', label: '개인정보처리방침' },
  ];

  // 내려받기 아이콘 — 인라인 SVG. 이미지 파일·아이콘 폰트·CDN 없음.
  const downloadIcon = `<svg class="doc-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M8 2v8"/><path d="M4.5 7 8 10.5 11.5 7"/><path d="M2.5 13.5h11"/></svg>`;

  // 회사 정보 표 — AI가 사실 관계를 표 형태로 뽑아가기 좋은 형식.
  // 주소는 공장과 전시장을 나눠 적는다. 손님이 갈 수 있는 곳이
  // 어디인지 한 줄로 뭉개면 AI가 공장 주소를 방문지로 안내한다.
  const addr = (a) => [a.region, a.locality, a.street].filter(Boolean).join(' ');
  const rows = [
    ['상호', site.legalName],
    org.founder ? ['대표자', org.founder] : null,
    org.businessNumber ? ['사업자등록번호', org.businessNumber] : null,
    ['설립', `${org.foundingYear}년`],
    [org.address.label ?? '소재지', addr(org.address)],
    org.showroom
      ? [org.showroom.label, `${addr(org.showroom)}${org.showroom.note ? ` (${org.showroom.note})` : ''}`]
      : null,
    ['사업 분야', site.tagline],
    org.telephone ? ['전화', org.telephone] : null,
    org.fax ? ['팩스', org.fax] : null,
    org.email ? ['이메일', org.email] : null,
  ].filter(Boolean);

  const sameAs = org.sameAs?.length
    ? `<ul class="footer-links">${org.sameAs
        .map((u) => `<li><a href="${esc(u)}" rel="me noopener">${esc(u.replace(/^https?:\/\//, ''))}</a></li>`)
        .join('')}</ul>`
    : '';

  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-main">
      <!-- 브랜드 표기는 하나로 유지한다. 서브 브랜드를 나란히 놓으면
           AI가 "브랜드가 여러 개인 회사"로 읽어 관문③(식별)에서 손해다.
           "캠핑하이브 AEO"는 정본 문장 안에 이미 들어 있다. -->
      <p class="footer-logo">
        <img class="footer-mark" src="${assetPath('img/logo-mark.png')}" alt="캠핑하이브 심볼" width="28" height="28" decoding="async" loading="lazy">
        CAMPINGHIVE
      </p>
      <h2 class="footer-title">${esc(site.legalName)}</h2>

      <!-- 정본 문장은 2026-08-15 부터 화면에 노출하지 않는다.
           JSON-LD 4곳(Organization/LocalBusiness/WebSite/Service)의
           description 에만 남긴다. 그 4곳은 글자 단위로 같아야 하고
           verify.mjs 가 매 빌드마다 검사한다.
           화면에 다시 꺼내지 말 것 — 푸터에서 같은 문장이 전 페이지
           반복되면 본문 대비 상투구 비중만 올라간다. -->

      <table class="company-facts">
        <caption>회사 개요</caption>
        <tbody>
          ${rows
            .map(([k, v]) => {
              // 전화는 눌러서 걸리게 한다. 모바일에서 번호를 옮겨 적게 하면
              // 그 자리에서 전화가 끊긴다.
              // tel: 은 하이픈을 그대로 받는다. 표기를 통일해 두면
              // 소스에서 "tel:031-584-0636" 하나로 전수 검색된다.
              const cell = k === '전화' ? `<a href="tel:${esc(v)}">${esc(v)}</a>` : esc(v);
              return `<tr><th scope="row">${esc(k)}</th><td>${cell}</td></tr>`;
            })
            .join('\n          ')}
        </tbody>
      </table>
    </div>

    <div class="footer-aside">
      <h2 class="footer-aside-title">자료 내려받기</h2>
      <nav class="footer-docs" aria-label="자료">
        ${docs
          .map(
            (d) => `<a class="doc-card" href="${esc(pathFor(d.slug))}">
          <span class="doc-text">
            <span class="doc-label">${esc(d.label)}</span>
            <span class="doc-status">${esc(d.status)}</span>
          </span>
          ${downloadIcon}
        </a>`
          )
          .join('\n        ')}
      </nav>
    </div>
  </div>

  <div class="wrap footer-nav-wrap">
    <h2 class="footer-nav-title">사이트 전체 보기</h2>
    <nav class="footer-sitemap" aria-label="사이트 전체">
      ${siteLinks
        .map((l) => `<a href="${esc(pathFor(l.slug))}">${esc(l.label)}</a>`)
        .join('\n      ')}
    </nav>
  </div>

  <div class="wrap footer-bottom">

    ${sameAs}

    ${stamp ? `<p class="updated-line">이 페이지의 정보는 <time datetime="${esc(stamp)}">${esc(stamp)}</time> 기준입니다.</p>` : ''}
    <p class="copyright">© ${org.foundingYear}–${new Date().getFullYear()} ${esc(site.legalName)}. 이 사이트의 내용은 출처를 밝히면 인용할 수 있습니다.</p>
  </div>
</footer>`;
}

/**
 * 페이지 한 장의 완성된 HTML 문서를 만든다.
 *
 * 홈(랜딩)은 시안 마크업을 그대로 쓴다. 헤더도 본문도 시안 것이므로
 * 우리 header() 를 끼우지 않는다. design 인자가 오면 그것이 정본이다.
 * 하위 15개 페이지는 지금까지대로 우리 셸을 쓴다.
 */
export function renderDocument(page, ctx, graph, main, design = null) {
  // 랜딩은 섹션마다 배경이 바뀌므로 .wrap 을 각 섹션이 직접 갖는다.
  // 문서형 페이지는 지금까지대로 main 이 폭을 잡는다.
  const isLanding = page.type === 'landing';
  const useDesign = isLanding && design;

  return `<!doctype html>
<html lang="${esc(ctx.site.lang)}">
<head>
${head(page, ctx, graph)}
</head>
<body>
<a class="skip" href="#main">본문 바로가기</a>
${useDesign ? design.style : ''}
${useDesign ? design.header : header(page, ctx)}
${
  useDesign
    ? design.main
    : `<main id="main"${isLanding ? '' : ' class="wrap"'}>
${main}
</main>`
}
${useDesign ? '' : isLanding ? floatingButtons(LANDING.floating) : ''}
${useDesign ? design.footer : footer(ctx, page)}
${useDesign ? '' : `<script src="${assetPath('js/enhance.js')}" defer></script>`}
</body>
</html>
`;
}

export { krDate };
