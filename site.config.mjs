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
  '2014년부터 글램핑장을 운영·제작하며 전국 캠핑장 280곳을 시공한 회사가 제공하는, 캠핑장 전용 AI 답변 최적화(AEO·GEO) 서비스';

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
   * 하위 경로 배포용 접두사. 예) GitHub Pages 프로젝트 주소
   *   https://사용자명.github.io/저장소이름/  → BASE_PATH=/저장소이름
   * aicampingmarketing.co.kr 도메인이 연결되면 비워둔다.
   */
  basePath: (process.env.BASE_PATH || '').replace(/\/+$/, ''),
};

export const org = {
  foundingYear: 2014,

  address: {
    region: '경기도',
    locality: '가평군',
    street: '',            // TODO(사장님): 도로명 주소
    postalCode: '',        // TODO(사장님): 우편번호
    country: 'KR',
  },

  telephone: '',           // TODO(사장님): 대표번호
  email: '',               // TODO(사장님): 대표 이메일
  businessNumber: '',      // TODO(사장님): 사업자등록번호

  // 상담 가능 시간이 확정되면 채운다. 비어 있으면 JSON-LD에 나오지 않는다.
  opens: '',
  closes: '',
  openDays: [],

  /**
   * sameAs — 이 회사가 "실재한다"는 것을 AI에게 증명하는 외부 링크.
   * 확인된 URL만 넣을 것. 없는 주소를 적으면 신뢰도가 오히려 떨어진다.
   * 값이 없으면 필드 자체가 생성되지 않는다(빈 배열 출력 금지).
   */
  sameAs: [],

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
