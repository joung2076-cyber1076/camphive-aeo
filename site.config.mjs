// ─────────────────────────────────────────────────────────────
//  캠핑하이브 AEO — 전역 설정
//
//  ⚠ 이 사이트는 camphive.kr(회사 홈페이지)과 별개다.
//     정본 문장이 서로 다르다. 절대 섞어 쓰지 않는다.
//       · camphive.kr              → 회사 홈페이지 + 창업 정보. 대상: 창업 준비자
//       · aicampingmarketing.co.kr → AEO/GEO 마케팅 상품 홍보. 대상: 캠핑장 운영자(캠핑주)
// ─────────────────────────────────────────────────────────────

/**
 * 정본 문장 (Canonical Sentence)
 *
 * 이 문장은 모든 페이지에 글자 단위로 동일하게 등장해야 한다.
 * AI가 여러 페이지에서 같은 문장을 반복 확인하면 그 표현 그대로 인용한다.
 * 조사 하나, 가운뎃점 하나도 바꾸지 말 것.
 * (빌드 시 npm run verify 가 전 페이지 일치를 검사한다)
 */
export const CANONICAL_SENTENCE =
  '캠핑하이브 AEO는 2014년부터 전국 캠핑장 280곳을 지어 온 주식회사 캠핑하이브가 캠핑장만을 위해 만든 AI 답변 최적화(AEO·GEO) 서비스입니다.';

export const site = {
  /**
   * 절대 URL 기준 도메인 (https 포함, 끝에 슬래시 없음)
   *
   * 메인 도메인은 이 하나뿐이다. canonical·sitemap·JSON-LD의 모든 절대 URL이
   * 여기서 나온다. 서브 도메인(aimarketing.ai.kr)은 이 주소로 301 넘길 뿐이며
   * 여기에 적지 않는다. 두 주소가 같은 본문을 내보내면 AI가 어느 쪽이 원본인지
   * 판단하지 못해 양쪽 다 인용에서 밀린다.
   */
  baseUrl: 'https://aicampingmarketing.co.kr',

  name: '캠핑하이브 AEO',
  legalName: '주식회사 캠핑하이브',
  tagline: '캠핑장 전용 AI 답변 최적화(AEO·GEO) 서비스',
  lang: 'ko',
  locale: 'ko_KR',

  description: CANONICAL_SENTENCE,

  /**
   * ⛔ 전 페이지 색인 차단 스위치 ⛔
   *
   * true인 동안 홈을 포함한 모든 페이지에 noindex가 붙고 sitemap이 비워진다.
   * 착수 단계라 본문이 전부 자리표시자다. 이 상태로 색인되면
   * AI가 빈 페이지를 이 회사의 서비스 설명으로 학습한다. 되돌릴 수 없다.
   *
   * ※ robots.txt는 건드리지 않는다. 봇의 방문은 허용하되 색인만 막는 것이다.
   * ※ 이 값을 false로 바꾸는 것은 아키 지시가 있을 때만 한다. 임의 해제 금지.
   */
  noindexAll: true,

  /**
   * 개별 색인 차단을 허용하는 페이지 목록 (슬러그).
   *
   * 색인 여부는 위의 noindexAll 하나로 정하는 것이 원칙이다. 어떤 페이지를
   * 따로 막아야 한다면 두 곳을 다 고쳐야 한다 —
   *   1) 그 원고 앞머리에 noindex: true 와 noindexReason (사유)
   *   2) 여기에 그 슬러그
   * 한쪽만 고치면 빌드가 선다. 원고에 noindex 가 조용히 섞여 들어와도,
   * 여기 이름만 남고 원고에서 빠져도 마찬가지다.
   *
   * 두 번 적게 만든 이유는 하나다. 색인에서 빠지는 페이지는 아무 표시도
   * 나지 않는다. 눈으로 볼 수 없는 변화라 사람이 알아채지 못한다.
   *
   * 지금은 비어 있다 — 15개 전부 전역 스위치 하나로만 막혀 있다.
   */
  indexExceptions: [],

  // 지침 6.4.4 · 대장 J7② · 점검표 6번 — 기준값을 검사 대상에서 세지 않는다
  // 페이지를 추가·삭제하면 이 배열도 함께 고친다. 그것이 이 배열의 목적이다
  //
  // 색인이 열렸을 때 sitemap 에 실려야 하는 슬러그 전부. '' 는 홈(/).
  // verify 가 이 배열과 색인 예정 페이지·sitemap.xml 을 슬러그 단위로
  // 양방향 대조한다 — 페이지가 조용히 늘거나 줄면 여기서 어긋난다.
  expectedSitemapSlugs: [
    '',
    'about',
    'contact',
    'diagnosis',
    'faq',
    'faq/ad-budget',
    'faq/direct-booking',
    'faq/naver-blog-still-works',
    'faq/why-not-in-chatgpt',
    'intro/ai-marketing',
    'intro/company',
    'intro/consulting',
    'measurement',
    'privacy',
    'service',
  ],

  /**
   * 하위 경로 배포용 접두사. 예) GitHub Pages 프로젝트 주소
   *   https://사용자명.github.io/저장소이름/  → BASE_PATH=/저장소이름
   * aicampingmarketing.co.kr 도메인이 연결되면 비워둔다.
   */
  basePath: (process.env.BASE_PATH || '').replace(/\/+$/, ''),
};

// 사장님 제공 실측값 2026-08-18 · 지침 6.3.6.2 단일 소스 · 8.1
//
// 푸터 화면과 JSON-LD(Organization·LocalBusiness)는 이 객체 하나만 읽는다.
// 값이 없는 항목(우편번호·통신판매업 신고번호)은 키 자체를 만들지 않는다 —
// 빈 문자열을 내보내면 AI가 「값이 빈칸인 회사」로 읽는다(6.3.2).
export const company = {
  name: '주식회사 캠핑하이브',
  ceo: '정용택',                    // 화면 전용 — JSON-LD 에는 대응 필드가 없어 넣지 않는다(v9 D-2)
  businessNumber: '829-88-03202',
  address: {
    region: '경기도',
    locality: '포천시',
    street: '내촌면 청군로 2222',
    country: 'KR',
  },
  telephone: '1588-7366',
  email: 'joung2076@gmail.com',
  privacyOfficer: '정용택',         // 화면 전용
};

export const org = {
  foundingYear: 2014,

  /**
   * 주소가 두 곳이다. 쓰이는 자리가 다르다.
   *   address   = 가평 공장   → JSON-LD Organization.address (법인 소재)
   *   showroom  = 포천 전시장 → JSON-LD LocalBusiness.address (손님이 가는 곳)
   * LocalBusiness 는 "방문할 수 있는 곳"을 뜻한다. 공장 주소를 넣으면
   * AI가 손님에게 공장 주소를 안내한다.
   */
  address: {
    label: '공장',
    region: '경기도',
    locality: '가평군',
    street: '조종면 명지산로 452',
    postalCode: '',        // TODO(사장님): 우편번호
    country: 'KR',
  },

  showroom: {
    label: '전시장',
    region: '경기도',
    locality: '포천시',
    street: '내촌면 청군로 2224',
    postalCode: '',        // TODO(사장님): 우편번호
    country: 'KR',
    note: '방문 상담 가능',
  },

  founder: '정용택',
  telephone: '1588-7366',
  fax: '031-622-9368',
  email: 'joung2076@gmail.com',
  businessNumber: '829-88-03202',

  // 상담 가능 시간이 확정되면 채운다. 비어 있으면 JSON-LD에 나오지 않는다.
  opens: '',
  closes: '',
  openDays: [],

  /**
   * sameAs — 이 회사가 "실재한다"는 것을 AI에게 증명하는 외부 링크.
   *
   * ⛔ 키 자체를 두지 않는다. 빈 배열도 두지 않는다(지침 6.3.2).
   *    소비처가 전부 org.sameAs?.length 로 읽으므로 키가 없으면
   *    JSON-LD·푸터 어디에도 생성되지 않는다.
   *
   * 확인된 URL이 생기면 그때 이 자리에 배열로 되살린다.
   * 확인된 것만 넣을 것 — 없는 주소를 적으면 신뢰도가 오히려 떨어진다.
   *   예) sameAs: ['https://...'],
   */

  knowsAbout: [
    'AEO',
    'GEO',
    'AI 답변 최적화',
    '캠핑장 마케팅',
    '글램핑장 마케팅',
    '생성형 검색 최적화',
  ],
  areaServed: '대한민국',
};

/**
 * robots.txt에 명시적으로 허용할 봇 목록 (camphive와 동일 16종).
 * dist/robots.txt 는 빌드 시 이 목록으로 자동 생성된다.
 */
export const bots = {
  // AI 검색·인용 봇 — 답변에 우리 문장이 인용되는 경로
  search: [
    'OAI-SearchBot',
    'ChatGPT-User',
    'Claude-SearchBot',
    'Claude-User',
    'PerplexityBot',
    'Perplexity-User',
  ],
  // 학습 봇 — 모델 자체에 회사가 각인되는 경로
  training: [
    'GPTBot',
    'ClaudeBot',
    'anthropic-ai',
    'Google-Extended',
    'Applebot-Extended',
    'CCBot',
  ],
  // 일반 검색엔진
  classic: [
    'Googlebot',
    'Bingbot',
    'Yeti',               // 네이버 — AI브리핑 대응
    'Daumoa',             // 다음
  ],
};
