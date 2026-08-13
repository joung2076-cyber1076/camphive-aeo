// ─────────────────────────────────────────────────────────────
//  JSON-LD @graph 생성기
//
//  @graph 로 묶는 이유:
//  스키마를 페이지마다 따로 흩뿌리면 AI는 "이 Article을 쓴 회사"와
//  "가평의 그 제조사"를 서로 다른 존재로 본다.
//  @id 로 노드를 하나씩 지정하고 서로 참조시키면 하나의 지식 덩어리가 된다.
//
//  노드 @id 규칙:
//    {base}/#organization    회사 (사이트 전역, 불변)
//    {base}/#localbusiness   사업장 (사이트 전역, 불변)
//    {base}/#website         사이트 (사이트 전역, 불변)
//    {url}#webpage           페이지
//    {url}#article           페이지 본문
//    {url}#faq               페이지 FAQ
//    {url}#breadcrumb        빵부스러기
// ─────────────────────────────────────────────────────────────

import { CANONICAL_SENTENCE } from '../../site.config.mjs';
import { urlFor } from './html.mjs';

const ID = {
  org: (base) => `${base}/#organization`,
  local: (base) => `${base}/#localbusiness`,
  website: (base) => `${base}/#website`,
  webpage: (url) => `${url}#webpage`,
  article: (url) => `${url}#article`,
  faq: (url) => `${url}#faq`,
  crumb: (url) => `${url}#breadcrumb`,
};

/** 회사 — 모든 페이지에 동일하게 실린다. */
function organizationNode(site, org) {
  const node = {
    '@type': 'Organization',
    '@id': ID.org(site.baseUrl),
    name: site.name,
    legalName: site.legalName,
    url: `${site.baseUrl}/`,
    foundingDate: String(org.foundingYear),
    // ↓ 정본 문장. 회사를 한 문장으로 설명하는 값이며 전 페이지 동일.
    description: CANONICAL_SENTENCE,
    slogan: site.tagline,
    address: {
      '@type': 'PostalAddress',
      addressCountry: org.address.country,
      addressRegion: org.address.region,
      addressLocality: org.address.locality,
      ...(org.address.street ? { streetAddress: org.address.street } : {}),
      ...(org.address.postalCode ? { postalCode: org.address.postalCode } : {}),
    },
    areaServed: org.areaServed,
    knowsAbout: org.knowsAbout,
  };

  if (org.telephone) node.telephone = org.telephone;
  if (org.email) node.email = org.email;
  if (org.businessNumber) node.taxID = org.businessNumber;
  if (org.sameAs?.length) node.sameAs = org.sameAs;

  return node;
}

/** 사업장 — 회사와 같은 실체지만 "지역 사업자"로서의 면을 따로 선언한다. */
function localBusinessNode(site, org) {
  const node = {
    '@type': 'LocalBusiness',
    '@id': ID.local(site.baseUrl),
    name: site.name,
    url: `${site.baseUrl}/`,
    description: CANONICAL_SENTENCE,
    parentOrganization: { '@id': ID.org(site.baseUrl) },
    address: {
      '@type': 'PostalAddress',
      addressCountry: org.address.country,
      addressRegion: org.address.region,
      addressLocality: org.address.locality,
      ...(org.address.street ? { streetAddress: org.address.street } : {}),
      ...(org.address.postalCode ? { postalCode: org.address.postalCode } : {}),
    },
    areaServed: org.areaServed,
  };

  if (org.telephone) node.telephone = org.telephone;
  if (org.email) node.email = org.email;
  if (org.sameAs?.length) node.sameAs = org.sameAs;

  if (org.opens && org.closes && org.openDays?.length) {
    node.openingHoursSpecification = [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: org.openDays,
        opens: org.opens,
        closes: org.closes,
      },
    ];
  }

  return node;
}

function websiteNode(site) {
  return {
    '@type': 'WebSite',
    '@id': ID.website(site.baseUrl),
    url: `${site.baseUrl}/`,
    name: site.name,
    description: site.description,
    inLanguage: site.lang,
    publisher: { '@id': ID.org(site.baseUrl) },
  };
}

function webPageNode(site, page, url) {
  return {
    '@type': 'WebPage',
    '@id': ID.webpage(url),
    url,
    name: page.title ?? page.question ?? site.name,
    description: page.description ?? site.description,
    isPartOf: { '@id': ID.website(site.baseUrl) },
    about: { '@id': ID.org(site.baseUrl) },
    inLanguage: site.lang,
    ...(page.published ? { datePublished: page.published } : {}),
    ...(page.updated ? { dateModified: page.updated } : {}),
    ...(page.slug ? { breadcrumb: { '@id': ID.crumb(url) } } : {}),
  };
}

function articleNode(site, page, url) {
  return {
    '@type': 'Article',
    '@id': ID.article(url),
    // headline 은 H1(질의문)과 글자 단위로 같아야 한다.
    headline: page.question,
    description: page.answer,
    articleSection: page.category ?? undefined,
    inLanguage: site.lang,
    isPartOf: { '@id': ID.webpage(url) },
    mainEntityOfPage: { '@id': ID.webpage(url) },
    author: { '@id': ID.org(site.baseUrl) },
    publisher: { '@id': ID.org(site.baseUrl) },
    ...(page.published ? { datePublished: page.published } : {}),
    ...(page.updated ? { dateModified: page.updated } : {}),
    ...(page.keywords?.length ? { keywords: page.keywords.join(', ') } : {}),
  };
}

function faqNode(site, page, url) {
  if (!page.faq?.length) return null;
  return {
    '@type': 'FAQPage',
    '@id': ID.faq(url),
    isPartOf: { '@id': ID.webpage(url) },
    inLanguage: site.lang,
    mainEntity: page.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

function breadcrumbNode(site, page, url) {
  if (!page.slug) return null;
  return {
    '@type': 'BreadcrumbList',
    '@id': ID.crumb(url),
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: `${site.baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: page.question ?? page.title, item: url },
    ],
  };
}

/**
 * 홈에서 콘텐츠 목록을 ItemList로 노출 — AI에게 "이 사이트에 뭐가 있는지" 알린다.
 * 공개된 페이지만 담는다. 자리표시자·견본을 넣으면 AI에게 빈 문서를 소개하는 꼴이 된다.
 */
function itemListNode(site, pages, url) {
  const published = (pages ?? []).filter(
    (p) => p.type !== 'home' && !p.noindex && !p.draft && !p.template
  );
  if (!published.length) return null;
  return {
    '@type': 'ItemList',
    '@id': `${url}#contents`,
    name: `${site.name} 콘텐츠 목록`,
    itemListElement: published.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.question ?? p.title,
      url: urlFor(site.baseUrl, p.slug),
    })),
  };
}

/**
 * 페이지 하나에 실릴 @graph 전체를 만든다.
 * @param {object} page      콘텐츠 모듈
 * @param {object} ctx       { site, org, allPages }
 */
export function buildGraph(page, ctx) {
  const { site, org, allPages = [] } = ctx;
  const url = urlFor(site.baseUrl, page.slug);

  const nodes = [
    organizationNode(site, org),
    localBusinessNode(site, org),
    websiteNode(site),
    webPageNode(site, page, url),
  ];

  if (page.type === 'home') {
    nodes.push(itemListNode(site, allPages, url));
  } else if (page.type === 'page') {
    // 일반 페이지 — 본문이 기사(Article)가 아니므로 WebPage와 경로만 남긴다.
    // 법적 고지문에 Article/FAQPage를 붙이면 AI가 인용 대상 콘텐츠로 오인한다.
    nodes.push(breadcrumbNode(site, page, url));
  } else {
    nodes.push(articleNode(site, page, url));
    nodes.push(faqNode(site, page, url));
    nodes.push(breadcrumbNode(site, page, url));
  }

  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean),
  };
}

/**
 * <script type="application/ld+json"> 블록으로 직렬화.
 * </script> 조기 종료를 막기 위해 '<'를 유니코드 이스케이프한다.
 */
export function renderJsonLd(graph) {
  const json = JSON.stringify(graph, null, 2).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}
