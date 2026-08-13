#!/usr/bin/env node
// 로컬 미리보기 서버 — 의존성 0개.
// 실행: npm run serve  →  http://localhost:4321
//
// 브라우저에서 Ctrl+U (소스 보기) 를 눌러 본문 문장이 보이는지 직접 확인한다.
// 이게 이 프로젝트의 최종 합격 기준이다.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4321;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

async function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  // 상위 디렉터리 탈출 방지
  const target = path.normalize(path.join(DIST, clean));
  if (!target.startsWith(DIST)) return null;

  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      const index = path.join(target, 'index.html');
      await stat(index);
      return index;
    }
    return target;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const file = await resolve(req.url ?? '/');

  if (!file) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<h1>404</h1><p>없는 주소입니다. <a href="/">홈으로</a></p>');
    console.log(`  404  ${req.url}`);
    return;
  }

  const body = await readFile(file);
  res.writeHead(200, {
    'content-type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  res.end(body);
  console.log(`  200  ${req.url}`);
}).listen(PORT, () => {
  console.log(`\n  미리보기 서버 실행 중\n`);
  console.log(`    http://localhost:${PORT}/`);
  console.log(`    http://localhost:${PORT}/_template/     (콘텐츠 구조 견본)`);
  console.log(`    http://localhost:${PORT}/robots.txt`);
  console.log(`    http://localhost:${PORT}/sitemap.xml\n`);
  console.log(`  브라우저에서 Ctrl+U 로 소스를 열고 본문 문장을 Ctrl+F 로 찾아보십시오.`);
  console.log(`  종료: Ctrl+C\n`);
});
