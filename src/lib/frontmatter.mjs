// ─────────────────────────────────────────────────────────────
//  front matter 파서 (YAML 부분집합) — 의존성 0개
//
//  마크다운 파일 맨 위 --- 사이에 들어가는 설정을 읽는다.
//  YAML 전체를 지원하지 않는다. 이 사이트에 필요한 문법만 지원한다:
//
//    key: 값                     ← 한 줄 값
//    key: >                      ← 여러 줄 값 (줄바꿈을 공백으로 이어붙임)
//      첫 줄
//      둘째 줄
//    key: |                      ← 여러 줄 값 (줄바꿈 유지)
//    key:                        ← 목록
//      - 항목1
//      - 항목2
//    key:                        ← 항목이 여러 칸을 갖는 목록
//      - q: 질문
//        a: 답변
//
//  들여쓰기는 공백 2칸. 탭은 쓰지 않는다.
// ─────────────────────────────────────────────────────────────

/**
 * 문자열 값 정리: 줄 끝 메모 제거 → 따옴표 제거 → true/false 변환
 *
 * 줄 끝 메모는 "공백 + #" 부터다.  noindex: true   # 색인 제외
 * 값 안에 그냥 #이 있는 경우(색상코드 등)는 앞에 공백이 없으므로 살아남는다.
 * 따옴표로 감싼 값은 메모 제거를 하지 않는다.
 */
function scalar(raw) {
  let v = String(raw ?? '').trim();

  const quoted =
    (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
    (v.startsWith("'") && v.endsWith("'") && v.length >= 2);

  if (quoted) {
    v = v.slice(1, -1);
  } else {
    const comment = v.search(/\s#/);
    if (comment >= 0) v = v.slice(0, comment).trim();
  }

  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
}

const indentOf = (line) => line.match(/^(\s*)/)[1].length;

/** `  - ...` 형태의 목록을 읽는다. */
function parseList(lines, start, file) {
  const items = [];
  const baseIndent = indentOf(lines[start]);
  let i = start;

  while (i < lines.length) {
    const line = lines[i];
    // 빈 줄과 메모(#)는 목록을 끊지 않는다
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }

    const ind = indentOf(line);
    if (ind !== baseIndent || !/^\s*-\s/.test(line)) break;

    const rest = line.replace(/^\s*-\s*/, '');
    // 키가 영문으로 시작하면 "여러 칸을 갖는 항목"으로 본다 (- q: ... )
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(rest);

    if (kv) {
      const obj = { [kv[1]]: scalar(kv[2]) };
      i++;
      // 같은 항목에 딸린 추가 칸들 (더 깊은 들여쓰기, 대시 없음)
      while (i < lines.length) {
        const l2 = lines[i];
        if (!l2.trim() || l2.trim().startsWith('#')) { i++; continue; }
        if (indentOf(l2) <= baseIndent || /^\s*-\s/.test(l2)) break;
        const kv2 = /^\s*([A-Za-z_][\w-]*):\s*(.*)$/.exec(l2);
        if (!kv2) {
          throw new Error(`${file} front matter ${i + 1}번째 줄: 목록 항목의 형식이 잘못되었습니다 → ${l2.trim()}`);
        }
        obj[kv2[1]] = scalar(kv2[2]);
        i++;
      }
      items.push(obj);
    } else {
      items.push(scalar(rest));
      i++;
    }
  }

  return { items, next: i };
}

function parseBody(src, file) {
  const lines = src.split(/\r?\n/);
  const data = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }

    const m = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!m) {
      throw new Error(
        `${file} front matter ${i + 1}번째 줄을 이해하지 못했습니다 → ${line.trim()}\n` +
        `  "이름: 값" 형식이어야 하고, 이름은 영문으로 시작해야 합니다.`
      );
    }

    const key = m[1];
    const rest = m[2].trim();

    // 여러 줄 값:  key: >   또는   key: |
    if (rest === '>' || rest === '|') {
      const buf = [];
      i++;
      while (i < lines.length && (!lines[i].trim() || indentOf(lines[i]) >= 2)) {
        buf.push(lines[i].replace(/^\s{0,2}/, ''));
        i++;
      }
      while (buf.length && !buf[buf.length - 1].trim()) buf.pop();
      data[key] = rest === '>'
        ? buf.map((l) => l.trim()).filter(Boolean).join(' ')
        : buf.join('\n');
      continue;
    }

    // 값이 비어 있으면 목록일 수 있다
    if (rest === '') {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length && /^\s+-\s/.test(lines[j])) {
        const { items, next } = parseList(lines, j, file);
        data[key] = items;
        i = next;
        continue;
      }
      data[key] = '';
      i++;
      continue;
    }

    data[key] = scalar(rest);
    i++;
  }

  return data;
}

/**
 * 마크다운 파일 전체를 front matter와 본문으로 나눈다.
 * @returns {{ data: object, body: string }}
 */
export function parseFrontMatter(text, file = '(파일)') {
  const src = String(text).replace(/^﻿/, '');
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(src);

  if (!m) {
    throw new Error(
      `${file}: 파일 맨 위에 front matter가 없습니다.\n` +
      `  파일은 --- 로 시작해서 설정을 적고 다시 --- 로 닫아야 합니다.`
    );
  }

  return { data: parseBody(m[1], file), body: m[2] };
}
