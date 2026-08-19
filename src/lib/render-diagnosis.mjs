// ─────────────────────────────────────────────────────────────
//  /diagnosis/ 렌더러
//
//  일반 문서 + 진단 도구 안내. 구조는 콘텐츠 페이지 규격(8단)을 그대로
//  따르되 오른쪽에 안내와 버튼을 붙인다.
//
//  2026-08-19 — 입력 폼을 링크로 교체했다(v13 G-2). 값을 넘길 수단이
//  없어 폼이 있으면 손님이 같은 값을 두 번 입력하게 된다.
//
//  이 페이지는 화면으로만 쓰이지 않는다. 영업 나가서 캠핑장 사장님 앞에
//  태블릿을 가로로 놓고 여는 화면이다. 그래서 가로 1024px 에서 설명과
//  버튼이 한 화면에 같이 보여야 하고(스크롤해서 버튼을 찾게 만들면 대화가
//  끊긴다), 손가락으로 누르므로 표적이 최소 44px 이어야 한다.
//  그 두 가지는 styles.css 의 .diagnosis-stage 가 담당한다.
// ─────────────────────────────────────────────────────────────

import { renderArticle } from './render-article.mjs';

// 진단 도구 주소 — 진단기 팀 이식 사양서(2026-08-19) 1항·5항
//   손님이 넣는 값 3개(캠핑장 이름·홈페이지 주소·이메일)는 전부 저쪽
//   화면에서 받는다. 사양서 2항이 「쿼리 파라미터로 값을 넘겨도 무시된다」
//   고 명시하므로 우리 쪽 폼으로는 값을 넘길 수 없다. 폼을 두면 손님이
//   같은 값을 두 번 입력하게 되므로 링크로 보낸다.
//
//   샘플 진단서는 저장된 고정 문서다. 몇 번 열어도 원가 0원(사양서 5항).
//   종합리포트(/report)는 아직 미배포(404)라 링크하지 않는다.
const TOOL_URL = 'https://camphive-aeo.vercel.app/';
const SAMPLE_URL =
  'https://camphive-aeo.vercel.app/diagnosis/dgn_8d90a41640bf4be78523f7b879fa1314';

function esc(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 진단 도구로 보내는 안내 + 버튼 2개. 우리 사이트는 값을 받지 않는다. */
function diagnosisLinks() {
  return `<div class="form-block" id="apply">
      <h3>지금 진단 신청</h3>
      <p>아래 버튼을 누르면 진단 화면이 새 창으로 열립니다. 캠핑장 이름 · 홈페이지 주소 · 이메일 세 가지를 그 화면에서 넣으시면 됩니다.</p>
      <p><a class="btn btn-primary btn-block" href="${esc(TOOL_URL)}" target="_blank" rel="noopener">지금 진단하기</a></p>
      <p><a class="btn btn-block" href="${esc(SAMPLE_URL)}" target="_blank" rel="noopener">진단서 샘플 보기</a></p>
      <p class="form-note">진단서 샘플은 저장된 문서라 몇 번 열어 보셔도 비용이 들지 않습니다.<br>하루 20건 한정</p>
    </div>`;
}

export function renderDiagnosis(page, ctx) {
  return `<div class="diagnosis-stage">
  <div>
${renderArticle(page, ctx)}
  </div>
  <div>
${diagnosisLinks()}
  </div>
</div>`;
}
