// ─────────────────────────────────────────────────────────────
//  콘텐츠 구조 검사
//
//  AEO에서 구조는 취향이 아니라 규격이다. 답변이 100단어가 되는 순간
//  AI는 그 문단을 통째로 인용하지 못하고 자기 말로 요약해버린다.
//  → 회사 표현이 답변에 남지 않는다.
//  그래서 규격 위반은 경고가 아니라 빌드 실패로 처리한다.
// ─────────────────────────────────────────────────────────────

import { wordCount } from './html.mjs';

const RULES = {
  answerMin: 40,
  answerMax: 60,
  tables: 2,
  sectionsMin: 5,
  sectionsMax: 8,
  faq: 4,
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validatePage(page) {
  const errors = [];
  const warnings = [];
  const bucket = page.draft || page.noindex ? warnings : errors;

  const need = (cond, msg) => {
    if (!cond) bucket.push(msg);
  };

  need(page.slug !== undefined, 'slug 가 없습니다.');
  need(Boolean(page.title), 'title 이 비어 있습니다.');
  need(Boolean(page.description), 'description(메타 설명)이 비어 있습니다.');

  if (page.type === 'home') {
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

  // 4. 데이터표 2개
  const tables = page.tables ?? [];
  need(tables.length === RULES.tables, `데이터표가 ${tables.length}개입니다. 정확히 ${RULES.tables}개여야 합니다.`);
  tables.forEach((t, i) => {
    need(Boolean(t.caption), `표 ${i + 1}: caption(표 제목)이 없습니다.`);
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
  const sections = page.sections ?? [];
  need(
    sections.length >= RULES.sectionsMin && sections.length <= RULES.sectionsMax,
    `H2 섹션이 ${sections.length}개입니다. ${RULES.sectionsMin}~${RULES.sectionsMax}개여야 합니다.`
  );
  sections.forEach((s, i) => {
    need(Boolean(s.h2), `섹션 ${i + 1}: h2 제목이 없습니다.`);
    need((s.body ?? []).length > 0, `섹션 ${i + 1}("${s.h2 ?? ''}"): 본문이 비어 있습니다.`);
  });

  // 6. FAQ 4문항
  const faq = page.faq ?? [];
  need(faq.length === RULES.faq, `FAQ가 ${faq.length}문항입니다. 정확히 ${RULES.faq}문항이어야 합니다.`);
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
