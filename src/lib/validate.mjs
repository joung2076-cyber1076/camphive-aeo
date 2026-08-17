// ─────────────────────────────────────────────────────────────
//  콘텐츠 구조 검사
//
//  AEO에서 구조는 취향이 아니라 규격이다. 답변이 100단어가 되는 순간
//  AI는 그 문단을 통째로 인용하지 못하고 자기 말로 요약해버린다.
//  → 회사 표현이 답변에 남지 않는다.
//  그래서 규격 위반은 경고가 아니라 빌드 실패로 처리한다.
// ─────────────────────────────────────────────────────────────

import { wordCount } from './html.mjs';
import { site } from '../../site.config.mjs';

//  각 값 옆의 항목 번호는 그 값의 근거다. 근거 없는 값을 넣으면
//  지침을 지킨 원고가 실패한다 — tablesMax: 3 이 그랬다(2026-08-17 제거).
const RULES = {
  answerMin: 40, // 지침 7.1 — 답변 블록 40~60단어
  answerMax: 60, // 지침 7.1
  tablesMin: 2, // 지침 7.1 — 「데이터표 2개 이상」. 상한은 지침에 없다.
  sectionsMin: 5, // 지침 7.1 — H2 5~8개
  sectionsMax: 8, // 지침 7.1
  faq: 4, // 지침 7.1 — 질문 하나에 답하는 문서의 FAQ 4문항
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validatePage(page) {
  const errors = [];
  const warnings = [];
  // 규격 위반을 오류로 볼 것인가 경고로 볼 것인가
  //
  //   원래 조건은 `page.draft || page.noindex` 였다. 색인이 막힌 페이지는
  //   AI 가 인용하지 않으니 규격 미달이어도 배포를 세울 이유가 없다는 뜻이다.
  //   그 판단 자체는 옳다. 다만 기준이 개별 플래그였던 탓에, 원고에 붙은
  //   noindex 가 색인만이 아니라 구조 검사까지 함께 껐다. 색인을 여는 날
  //   그동안 눌려 있던 위반이 한꺼번에 오류로 튀어나온다.
  //
  //   2026-08-17: 개별 플래그를 없애면서 기준을 전역 스위치로 옮겼다.
  //   뜻은 그대로다 — 「색인이 막혀 있는 동안에는 경고」. 다르게 만든 것은
  //   기준이 한 곳이 됐다는 점뿐이다.
  //
  //   ⚠ 전역 스위치를 끄는 날 이 경고들은 전부 오류가 된다.
  //     해제 전에 경고 0건을 먼저 만들어야 한다.
  const bucket = page.draft || site.noindexAll || page.noindex ? warnings : errors;

  const need = (cond, msg) => {
    if (!cond) bucket.push(msg);
  };

  // 개별 색인 차단에는 사유가 따라와야 한다 (2026-08-17 신설)
  //
  //   색인 여부는 site.config.mjs 의 noindexAll 하나로 정하는 것이 원칙이다.
  //   전역 스위치와 개별 플래그를 둘 다 쓰면 전역을 열어도 개별로 막힌
  //   페이지가 남고, 그 페이지는 아무 경고 없이 색인에서 빠진다.
  //   그래서 개별 차단은 사유를 적어야만 통과시킨다.
  //
  //   errors 에 직접 넣는다. bucket 을 쓰면 noindex 인 페이지는 경고로
  //   빠져 — 검사하려는 대상이 스스로 검사를 무력화한다.
  if (page.noindex && !page.noindexReason) {
    errors.push(
      'noindex: true 를 켰으면 noindexReason 에 사유를 적어야 합니다. ' +
        '색인 여부는 원칙적으로 site.config.mjs 의 noindexAll 로만 정합니다.'
    );
  }

  need(page.slug !== undefined, 'slug 가 없습니다.');
  need(Boolean(page.title), 'title 이 비어 있습니다.');
  need(Boolean(page.description), 'description(메타 설명)이 비어 있습니다.');

  // 홈·랜딩은 8단 구조를 요구하지 않는다.
  // 8단 구조는 "질문 하나에 답하는 문서" 규격이다. 랜딩은 16개 섹션이
  // 각자 다른 일을 하는 페이지라 표 2개·H2 5~8개 같은 수치를 강제하면
  // 오히려 구조를 망가뜨린다. 대신 랜딩은 렌더러가 구조를 고정한다.
  if (page.type === 'home' || page.type === 'landing') {
    need(Boolean(page.answer), 'answer(핵심 답변)가 비어 있습니다.');
    return { errors, warnings };
  }

  // 일반 페이지(개인정보처리방침·이용약관 등)는 AEO 8단 구조를 요구하지 않는다.
  // 이런 문서는 AI 인용 대상이 아니라 법적 고지 목적이므로 규격을 강제하면 오히려 방해된다.
  if (page.type === 'page') {
    need(Boolean(page.question), 'question(H1 제목)이 비어 있습니다.');
    need(DATE.test(page.updated ?? ''), 'updated(갱신일)가 없거나 YYYY-MM-DD 형식이 아닙니다.');
    return { errors, warnings };
  }

  // 1. H1 = 질의문
  need(Boolean(page.question), 'question(H1 질의문)이 비어 있습니다.');
  // 끝의 닫는 따옴표는 무시하고 물음표로 끝나는지 본다.
  if (page.question && !/[?？]["'”’\s]*$/.test(page.question.trim())) {
    warnings.push(
      `H1 "${page.question}" 이 물음표로 끝나지 않습니다. H1은 사람이 실제로 검색창에 치는 질의문 그대로여야 합니다.`
    );
  }

  // 2. 답변 블록 40~60단어
  const words = wordCount(page.answer);
  need(Boolean(page.answer), 'answer(핵심 답변 블록)가 비어 있습니다.');
  if (page.answer) {
    need(
      words >= RULES.answerMin && words <= RULES.answerMax,
      `answer 가 ${words}단어입니다. ${RULES.answerMin}~${RULES.answerMax}단어여야 합니다.`
    );
  }

  // 3. 기준일자
  need(DATE.test(page.asOf ?? ''), 'asOf(기준일자)가 없거나 YYYY-MM-DD 형식이 아닙니다.');

  // 4. 데이터표 2~3개
  //
  //  예전 규칙은 "첫 ## 앞에 정확히 2개"였다. 두 가지를 고쳤다.
  //   · 개수를 2~3개로 넓혔다 — 아키가 확정한 원고가 표 3개 구성이다.
  //   · 위치를 따지지 않는다 — 규칙의 뜻은 "이 페이지에 데이터표가 있다"이지
  //     "맨 위에 몰아 둔다"가 아니었다. 표는 그 사실을 설명하는 절 안에
  //     있어야 읽는 사람과 AI 모두 맥락을 잃지 않는다.
  const topTables = page.tables ?? [];
  const sectionTables = (page.sections ?? []).flatMap((s) =>
    (s.body ?? []).filter((b) => b && b.table).map((b) => b.table)
  );
  const tables = [...topTables, ...sectionTables];
  //  상한을 두지 않는다. 지침 7.1 은 「데이터표 2개 이상」이고 상한이 없다.
  //  종전의 tablesMax: 3 은 지침·대장 어디에도 근거가 없는 값이었고, 표가
  //  많다는 이유로 지침을 지킨 원고 3편을 실패시키고 있었다. 표는 AI 가 가장
  //  잘 인용하는 형태이므로(6.1.3·7.2) 상한은 우리 강점을 깎는다. (2026-08-17)
  need(
    tables.length >= RULES.tablesMin,
    `데이터표가 ${tables.length}개입니다. ${RULES.tablesMin}개 이상이어야 합니다.`
  );
  tables.forEach((t, i) => {
    //  허브는 표 제목을 요구하지 않는다. 표가 ### 질문 바로 아래에 붙어
    //  있어서 그 질문이 곧 표의 이름이다. caption 을 또 달면 화면에 같은
    //  문장이 두 번 나온다. 허브 밖의 문서는 종전대로 요구한다.
    if (!page.hub) need(Boolean(t.caption), `표 ${i + 1}: caption(표 제목)이 없습니다.`);
    need((t.columns ?? []).length > 0, `표 ${i + 1}: columns(열 이름)가 없습니다.`);
    need((t.rows ?? []).length > 0, `표 ${i + 1}: rows(데이터 행)가 없습니다.`);
    (t.rows ?? []).forEach((row, r) => {
      need(
        row.length === (t.columns ?? []).length,
        `표 ${i + 1} ${r + 1}행: 칸 수(${row.length})가 열 수(${(t.columns ?? []).length})와 다릅니다.`
      );
    });
  });

  // 5. H2 본문 5~8개
  //
  //  질문 허브(hub: true)는 상한에서 뺀다. 지침 7.1 의 5~8개는 「질문 하나에
  //  답하는 문서」 규격이다. 허브는 질문 여러 개를 한 자리에 모으는 페이지라
  //  같은 잣대를 대면 구조를 오히려 망가뜨린다 — 랜딩을 뺀 것과 같은 이유다.
  //  하한 5개는 허브에도 적용한다. (2026-08-17, E-8)
  //  허브는 H2 개수로 재지 않는다. 허브의 H2 는 문항을 담는 구획이라
  //  개수가 내용의 양을 뜻하지 않는다 — 구획 4개에 문항 22개일 수도 있다.
  //  허브의 분량은 아래 6번의 FAQ 문항 수로 본다.
  const sections = page.sections ?? [];
  if (page.hub) {
    need(sections.length >= 1, 'H2 구획이 하나도 없습니다.');
  } else {
    need(
      sections.length >= RULES.sectionsMin && sections.length <= RULES.sectionsMax,
      `H2 섹션이 ${sections.length}개입니다. ${RULES.sectionsMin}~${RULES.sectionsMax}개여야 합니다.`
    );
  }
  sections.forEach((s, i) => {
    need(Boolean(s.h2), `섹션 ${i + 1}: h2 제목이 없습니다.`);
    need((s.body ?? []).length > 0, `섹션 ${i + 1}("${s.h2 ?? ''}"): 본문이 비어 있습니다.`);
  });

  // 6. FAQ 4문항
  //
  //  허브는 문항 수가 곧 페이지의 내용이라 고정할 수 없다. 대신 하한 4문항은
  //  지킨다 — 그 아래면 허브라고 부를 것이 없다. (2026-08-17, E-8)
  const faq = page.faq ?? [];
  need(
    page.hub ? faq.length >= RULES.faq : faq.length === RULES.faq,
    `FAQ가 ${faq.length}문항입니다. ${page.hub ? `${RULES.faq}문항 이상이어야` : `정확히 ${RULES.faq}문항이어야`} 합니다.`
  );
  faq.forEach((f, i) => {
    need(Boolean(f.q), `FAQ ${i + 1}: 질문이 없습니다.`);
    need(Boolean(f.a), `FAQ ${i + 1}: 답변이 없습니다.`);
  });

  // 7. 갱신일
  need(DATE.test(page.updated ?? ''), 'updated(갱신일)가 없거나 YYYY-MM-DD 형식이 아닙니다.');
  if (page.published) {
    need(DATE.test(page.published), 'published(최초 작성일)가 YYYY-MM-DD 형식이 아닙니다.');
  }

  // 8. 내부 링크
  need((page.related ?? []).length >= 1, '내부 링크(related)가 없습니다. 최소 1개 필요합니다.');

  return { errors, warnings };
}

export { RULES };
