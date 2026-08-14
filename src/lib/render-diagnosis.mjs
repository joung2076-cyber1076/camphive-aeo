// ─────────────────────────────────────────────────────────────
//  /diagnosis/ 렌더러
//
//  일반 문서 + 신청 폼. 구조는 콘텐츠 페이지 규격(8단)을 그대로 따르되
//  오른쪽에 폼을 붙인다.
//
//  이 페이지는 화면으로만 쓰이지 않는다. 영업 나가서 캠핑장 사장님 앞에
//  태블릿을 가로로 놓고 여는 화면이다. 그래서 가로 1024px 에서 설명과
//  폼이 한 화면에 같이 보여야 하고(스크롤해서 폼을 찾게 만들면 대화가
//  끊긴다), 손가락으로 누르므로 표적이 최소 44px 이어야 한다.
//  그 두 가지는 styles.css 의 .diagnosis-stage 가 담당한다.
// ─────────────────────────────────────────────────────────────

import { renderArticle } from './render-article.mjs';
import { diagnosisForm, LANDING } from './render-landing.mjs';

export function renderDiagnosis(page, ctx) {
  return `<div class="diagnosis-stage">
  <div>
${renderArticle(page, ctx)}
  </div>
  <div>
${diagnosisForm(LANDING.form, { id: 'apply', title: '지금 진단 신청', lead: '세 가지만 넣으시면 됩니다.' })}
  </div>
</div>`;
}
